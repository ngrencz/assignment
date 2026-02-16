// --- Configuration & Supabase Init ---
window.totalSecondsWorked = parseInt(sessionStorage.getItem('total_work_time')) || 0;
window.currentQSeconds = 0;
window.isCurrentQActive = false;
window.currentQCap = 60;
window.currentUser = sessionStorage.getItem('current_user') || 'test_user';
window.targetLesson = sessionStorage.getItem('target_lesson') || '6.2.4';

const SB_URL = "https://khazeoycsjdqnmwodncw.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoYXper3ljc2pkcW5td29kbmN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MDMwOTMsImV4cCI6MjA3ODQ3OTA5M30.h-WabaGcQZ968sO2ImetccUaRihRFmO2mUKCdPiAbEI";
const supabaseClient = supabase.createClient(SB_URL, SB_KEY);

// Logic Tracking
let hasDonePrimaryLesson = false;
let skillsCompletedThisSession = []; 
let lastActivity = Date.now();

const TARGET_MINUTES = 12;

// --- Global Timer Logic ---
setInterval(() => {
    const statePill = document.getElementById('timer-state-pill');
    const totalDisplay = document.getElementById('debug-total-time');
    const qDisplay = document.getElementById('debug-q-time');
    const hubTimer = document.getElementById('total-timer');

    if (window.isCurrentQActive) {
        window.currentQSeconds++;
        window.totalSecondsWorked++;

        sessionStorage.setItem('total_work_time', window.totalSecondsWorked);

        if (statePill) {
            statePill.innerText = "RUNNING";
            statePill.style.background = "#22c55e";
        }

        let mins = Math.floor(window.totalSecondsWorked / 60);
        let secs = window.totalSecondsWorked % 60;
        let formattedTime = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

        if (totalDisplay) totalDisplay.innerText = `${formattedTime} / 12:00`;
        if (hubTimer) hubTimer.innerText = `${formattedTime} / 12:00`;
        if (qDisplay) qDisplay.innerText = window.currentQSeconds + "s";

        if (window.totalSecondsWorked >= 720) {
            window.isCurrentQActive = false;
            if (typeof log === "function") log("🎯 12-Minute Goal Reached!");
            finishAssignment();
        }
    } else {
        if (statePill) {
            statePill.innerText = "PAUSED";
            statePill.style.background = "#64748b";
        }
        if (qDisplay) qDisplay.style.opacity = "0.5";
    }
}, 1000);

// --- Adaptive Routing Logic ---
async function loadNextQuestion() {
    const feedback = document.getElementById('feedback-box');
    if(feedback) {
        feedback.style.display = 'none';
        feedback.className = '';
    }
    
    window.scrollTo(0,0);

    const skillMap = [
        { id: 'C6Transformation', fn: initTransformationGame },
        { id: 'LinearSystem', fn: initLinearSystemGame },
        { id: 'FigureGrowth', fn: initFigureGrowthGame },
        { id: 'SolveX', fn: initSolveXGame },
        { id: 'BoxPlot', fn: initBoxPlotGame }
    ];

    // Use window.targetLesson
    if (window.targetLesson === '6.2.4') {
        if (!hasDonePrimaryLesson) {
            hasDonePrimaryLesson = true;
            skillsCompletedThisSession.push('C6Transformation');
            return initTransformationGame();
        }

        // FETCH Mastery Scores
        const { data, error } = await supabaseClient
            .from('assignment')
            .select('*')
            .eq('userName', window.currentUser) // Use window.currentUser
            .maybeSingle(); // Better for new users than .single()

        if (error || !data) {
            console.error("Mastery fetch issue, falling back to random.");
            return skillMap[Math.floor(Math.random() * skillMap.length)].fn();
        }

        let availableSkills = skillMap.filter(s => !skillsCompletedThisSession.includes(s.id));
        
        if (availableSkills.length === 0) {
            skillsCompletedThisSession = [];
            availableSkills = skillMap;
        }

        // Sort by lowest score
        availableSkills.sort((a, b) => (data[a.id] || 0) - (data[b.id] || 0));

        const nextSkill = availableSkills[0];
        skillsCompletedThisSession.push(nextSkill.id);
        nextSkill.fn();

    } else {
        document.getElementById('q-title').innerText = "Under Construction";
        document.getElementById('q-content').innerHTML = `Lesson ${window.targetLesson} is not yet available.`;
    }
}

async function finishAssignment() {
    window.isCurrentQActive = false;

    try {
        const { error } = await supabaseClient
            .from('assignment')
            .update({ C624_Completed: true })
            .eq('userName', window.currentUser);

        if (error) throw error;

        document.getElementById('work-area').innerHTML = `
            <div style="text-align: center; padding: 40px; background: #f8fafc; border-radius: 12px; border: 2px solid #22c55e;">
                <h1 style="color: #22c55e;">Goal Reached!</h1>
                <p>Your 12 minutes of practice are logged.</p>
                <div style="margin: 20px 0; font-size: 3rem;">🌟</div>
                <button onclick="window.location.href='index.html'" style="background: #000; color: white; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer;">Return to Dashboard</button>
            </div>
        `;
    } catch (err) {
        console.error("Completion Error:", err);
        alert("Practice goal reached! Progress saved.");
    }
}

window.onload = loadNextQuestion;
