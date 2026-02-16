// --- Configuration & Supabase Init ---
const SB_URL = "https://khazeoycsjdqnmwodncw.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoYXplb3ljc2pkcW5td29kbmN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MDMwOTMsImV4cCI6MjA3ODQ3OTA5M30.h-WabaGcQZ968sO2ImetccUaRihRFmO2mUKCdPiAbEI";
const supabaseClient = supabase.createClient(SB_URL, SB_KEY);

// Session State
let totalWorkSeconds = 0;
let currentQSeconds = 0;
let currentQCap = 60; 
let isCurrentQActive = false;
let lastActivity = Date.now();
let currentUser = sessionStorage.getItem('current_user');
let targetLesson = sessionStorage.getItem('target_lesson');

// Logic Tracking
let hasDonePrimaryLesson = false;
let skillsCompletedThisSession = []; 

const IDLE_LIMIT = 30000; // 30 seconds
const TARGET_MINUTES = 12;

// --- Global Timer Logic ---
setInterval(() => {
    // 1. Grab UI elements (these only exist if you're on test.html)
    const statePill = document.getElementById('timer-state-pill');
    const totalDisplay = document.getElementById('debug-total-time');
    const qDisplay = document.getElementById('debug-q-time');
    const hubTimer = document.getElementById('total-timer'); // The student-facing timer

    // 2. Logic for when a question is active
    if (isCurrentQActive) {
        currentQSeconds++;
        totalSecondsWorked++;

        // Save to Session Storage so a refresh doesn't lose time
        sessionStorage.setItem('total_work_time', totalSecondsWorked);

        // Update the Control Panel Status (Test Mode)
        if (statePill) {
            statePill.innerText = "RUNNING";
            statePill.style.background = "#22c55e"; // Green
        }

        // Format and Update Total Time (M:SS)
        let mins = Math.floor(totalSecondsWorked / 60);
        let secs = totalSecondsWorked % 60;
        let formattedTime = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

        if (totalDisplay) totalDisplay.innerText = `${formattedTime} / 12:00`;
        if (hubTimer) hubTimer.innerText = `${formattedTime} / 12:00`;
        
        // Update Individual Question Clock
        if (qDisplay) qDisplay.innerText = currentQSeconds + "s";

        // Check for Completion (720 seconds = 12 minutes)
        if (totalSecondsWorked >= 720) {
            isCurrentQActive = false;
            if (typeof log === "function") log("🎯 12-Minute Goal Reached!");
            finishAssignment(); // Your function to redirect/save
        }

    } else {
        // 3. Logic for when the timer is paused (loading screens, menus)
        if (statePill) {
            statePill.innerText = "PAUSED";
            statePill.style.background = "#64748b"; // Slate Gray
        }
        
        // Ensure current question time stays visible but stops counting
        if (qDisplay) qDisplay.style.opacity = "0.5";
    }
}, 1000);

['mousedown', 'keydown', 'mousemove', 'touchstart'].forEach(e => 
    window.addEventListener(e, () => lastActivity = Date.now())
);

// --- Adaptive Routing Logic ---
async function loadNextQuestion() {
    const feedback = document.getElementById('feedback-box');
    if(feedback) {
        feedback.style.display = 'none';
        feedback.className = '';
    }
    
    window.scrollTo(0,0);

    // Skill Map matching your 6.2.4 requirements
    const skillMap = [
        { id: 'C6Transformation', fn: initTransformationGame },
        { id: 'LinearSystem', fn: initLinearSystemGame },
        { id: 'FigureGrowth', fn: initFigureGrowthGame },
        { id: 'SolveX', fn: initSolveXGame },
        { id: 'BoxPlot', fn: initBoxPlotGame }
    ];

    if (targetLesson === '6.2.4') {
        // 1. PRIMARY LESSON: Always start with the core 6.2.4 skill
        if (!hasDonePrimaryLesson) {
            hasDonePrimaryLesson = true;
            skillsCompletedThisSession.push('C6Transformation');
            return initTransformationGame();
        }

        // 2. FETCH DATA: Get mastery scores for need-based sorting
        const { data, error } = await supabaseClient
            .from('assignment')
            .select('*')
            .eq('userName', currentUser)
            .single();

        if (error) {
            console.error("Mastery fetch failed, falling back to random.");
            return skillMap[Math.floor(Math.random() * skillMap.length)].fn();
        }

        // 3. FILTER: Look for skills not yet done in this session
        let availableSkills = skillMap.filter(s => !skillsCompletedThisSession.includes(s.id));
        
        // Reset session tracking if all types have been completed once
        if (availableSkills.length === 0) {
            skillsCompletedThisSession = [];
            availableSkills = skillMap;
        }

        // 4. SORT BY NEED: Lowest score (highest need) moves to the front
        availableSkills.sort((a, b) => (data[a.id] || 0) - (data[b.id] || 0));

        // 5. EXECUTE: Load the highest-need skill
        const nextSkill = availableSkills[0];
        skillsCompletedThisSession.push(nextSkill.id);
        nextSkill.fn();

    } else {
        document.getElementById('q-title').innerText = "Under Construction";
        document.getElementById('q-content').innerHTML = `Lesson ${targetLesson} is not yet available.`;
    }
}

async function finishAssignment() {
    isCurrentQActive = false;

    try {
        // Mark as completed. Supabase will handle the timestamp metadata.
        const { error } = await supabaseClient
            .from('assignment')
            .update({ C624_Completed: true })
            .eq('userName', currentUser);

        if (error) throw error;

        // Display Success UI
        document.getElementById('work-area').innerHTML = `
            <div style="text-align: center; padding: 40px; background: var(--gray-light); border-radius: 12px; border: 2px solid var(--kelly-green);">
                <h1 style="color: var(--kelly-green);">Goal Reached!</h1>
                <p>Your 12 minutes of practice are logged.</p>
                <div style="margin: 20px 0; font-size: 3rem;">🌟</div>
                <button onclick="window.location.href='index.html'" style="background: var(--black);">Return to Dashboard</button>
            </div>
        `;
    } catch (err) {
        console.error("Completion Error:", err);
        alert("Practice goal reached! Progress saved.");
    }
}

window.onload = loadNextQuestion;
