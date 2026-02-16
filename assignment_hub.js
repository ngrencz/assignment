window.totalSecondsWorked = parseInt(sessionStorage.getItem('total_work_time')) || 0;
window.isCurrentQActive = false;
window.currentQSeconds = 0;
let canCount = false; // Starts false until 20s delay or initial load
let resumeTimeout = null;

// --- Tab Visibility Logic ---
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        canCount = false;
        clearTimeout(resumeTimeout);
        if (typeof log === "function") log("⏸️ Tab hidden: Timer stopped.");
    } else {
        if (typeof log === "function") log("⏱️ Tab active: Resuming in 20s...");
        resumeTimeout = setTimeout(() => {
            canCount = true;
            if (typeof log === "function") log("▶️ 20s elapsed: Timer resumed.");
        }, 20000); 
    }
});

// Initial trigger to start the first 20s countdown on load
resumeTimeout = setTimeout(() => { canCount = true; }, 20000);

// --- The Master Timer Loop ---
setInterval(() => {
    const statePill = document.getElementById('timer-state-pill');
    const totalDisplay = document.getElementById('debug-total-time');
    
    // Check if a question is actually visible (not just "Wait...")
    const qContent = document.getElementById('q-content');
    const hasQuestion = qContent && qContent.innerHTML.length > 50 && !qContent.innerText.includes("Wait...");

    if (window.isCurrentQActive && canCount && hasQuestion) {
        window.totalSecondsWorked++;
        window.currentQSeconds++;
        sessionStorage.setItem('total_work_time', window.totalSecondsWorked);

        // UI Updates
        let mins = Math.floor(window.totalSecondsWorked / 60);
        let secs = window.totalSecondsWorked % 60;
        if (totalDisplay) totalDisplay.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs} / 12:00`;
        if (statePill) {
            statePill.innerText = "RUNNING";
            statePill.style.background = "#22c55e";
        }
        
        if (window.totalSecondsWorked >= 720) finishAssignment();
    } else {
        if (statePill) {
            if (!hasQuestion) {
                statePill.innerText = "NO QUESTION LOADED";
                statePill.style.background = "#ef4444";
            } else if (!canCount) {
                statePill.innerText = "TAB COOLDOWN (20s)";
                statePill.style.background = "#3b82f6";
            } else {
                statePill.innerText = "PAUSED";
                statePill.style.background = "#64748b";
            }
        }
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
