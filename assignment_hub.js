// --- Configuration & Supabase Init ---
const SB_URL = "https://khazeoycsjdqnmwodncw.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoYXplb3ljc2pkcW5td29kbmN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MDMwOTMsImV4cCI6MjA3ODQ3OTA5M30.h-WabaGcQZ968sO2ImetccUaRihRFmO2mUKCdPiAbEI";

window.supabaseClient = supabase.createClient(SB_URL, SB_KEY);

// Global State
window.totalSecondsWorked = parseInt(sessionStorage.getItem('total_work_time')) || 0;
window.isCurrentQActive = false;
window.currentQSeconds = 0;
window.currentUser = sessionStorage.getItem('current_user') || 'test_user';
window.targetLesson = sessionStorage.getItem('target_lesson') || '6.2.4';
window.lastActivity = Date.now();
window.isIdle = false;
window.hasDonePrimaryLesson = false;
window.skillsCompletedThisSession = []; 
window.canCount = false; 
window.resumeTimeout = null;
window.isWindowLargeEnough = true;

// --- Window Size Checker Function ---
function checkWindowSize() {
    const screenWidth = window.screen.availWidth;
    const screenHeight = window.screen.availHeight;
    const winWidth = window.outerWidth;
    const winHeight = window.outerHeight;
    const overlay = document.getElementById('size-overlay');

    // Pause if window is less than 90% of screen
    if (winWidth < (screenWidth * 0.9) || winHeight < (screenHeight * 0.9)) {
        window.isWindowLargeEnough = false;
        if (overlay) overlay.classList.add('active'); // SHOW OVERLAY
        if (typeof log === "function") log("⚠️ Window not maximized/large enough.");
    } else {
        window.isWindowLargeEnough = true;
        if (overlay) overlay.classList.remove('active'); // HIDE OVERLAY
    }
}

// --- Activity & Focus Listeners ---
window.onblur = () => {
    window.canCount = false;
    clearTimeout(window.resumeTimeout);
    if (typeof log === "function") log("⏸️ Window Lost Focus: Timer stopped.");
};

window.onfocus = () => {
    if (typeof log === "function") log("⏱️ Window Regained: Resuming in 15s...");
    clearTimeout(window.resumeTimeout);
    window.resumeTimeout = setTimeout(() => {
        window.canCount = true;
        if (typeof log === "function") log("▶️ Penalty elapsed: Timer resumed.");
    }, 15000);
};

window.addEventListener('resize', checkWindowSize);
checkWindowSize(); // Initial check

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        window.canCount = false;
        clearTimeout(window.resumeTimeout);
    }
});

// Initial startup countdown
window.resumeTimeout = setTimeout(() => { window.canCount = true; }, 20000);

// --- The Master Timer Loop ---
setInterval(() => {
    const statePill = document.getElementById('timer-state-pill');
    const totalDisplay = document.getElementById('debug-total-time');
    const qTimeDisplay = document.getElementById('debug-q-time');
    
    // Inactivity check
    const secondsSinceLastActivity = (Date.now() - window.lastActivity) / 1000;
    if (secondsSinceLastActivity > 30) window.isIdle = true;

    const qContent = document.getElementById('q-content');
    const hasQuestion = qContent && qContent.innerHTML.length > 50 && !qContent.innerText.includes("Wait...");

    // SINGLE Condition for ticking
    if (window.isCurrentQActive && window.canCount && hasQuestion && !window.isIdle && window.isWindowLargeEnough) {
        window.totalSecondsWorked++;
        window.currentQSeconds++;
        sessionStorage.setItem('total_work_time', window.totalSecondsWorked);

        // UI Updates
        let mins = Math.floor(window.totalSecondsWorked / 60);
        let secs = window.totalSecondsWorked % 60;
        if (totalDisplay) totalDisplay.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs} / 12:00`;
        if (qTimeDisplay) qTimeDisplay.innerText = `${window.currentQSeconds}s`;
        
        if (statePill) {
            statePill.innerText = "RUNNING";
            statePill.style.background = "#22c55e";
        }
        
        if (window.totalSecondsWorked >= 720) finishAssignment();
    } else {
        // Handle PAUSED states
        if (statePill) {
            if (!window.isWindowLargeEnough) {
                statePill.innerText = "RESTORE WINDOW SIZE";
                statePill.style.background = "#7c3aed";
            } else if (!hasQuestion) {
                statePill.innerText = "NO QUESTION";
                statePill.style.background = "#64748b";
            } else if (window.isIdle) {
                statePill.innerText = "IDLE PAUSE";
                statePill.style.background = "#f59e0b";
            } else if (!window.canCount) {
                statePill.innerText = "TAB PENALTY";
                statePill.style.background = "#3b82f6";
            } else {
                statePill.innerText = "PAUSED";
                statePill.style.background = "#ef4444";
            }
        }
    }
}, 1000);

// --- Adaptive Routing & Finish logic remains the same ---
async function loadNextQuestion() {
    window.currentQSeconds = 0; 
    const feedback = document.getElementById('feedback-box');
    if(feedback) {
        feedback.style.display = 'none';
        feedback.className = '';
    }
    
    window.scrollTo(0,0);

    const skillMap = [
        { id: 'C6Transformation', fn: typeof initTransformationGame !== 'undefined' ? initTransformationGame : null },
        { id: 'LinearSystem', fn: typeof initLinearSystemGame !== 'undefined' ? initLinearSystemGame : null },
        { id: 'FigureGrowth', fn: typeof initFigureGrowthGame !== 'undefined' ? initFigureGrowthGame : null },
        { id: 'SolveX', fn: typeof initSolveXGame !== 'undefined' ? initSolveXGame : null },
        { id: 'BoxPlot', fn: typeof initBoxPlotGame !== 'undefined' ? initBoxPlotGame : null }
    ].filter(s => s.fn !== null);

    if (window.targetLesson === '6.2.4') {
        if (!window.hasDonePrimaryLesson) {
            window.hasDonePrimaryLesson = true;
            window.skillsCompletedThisSession.push('C6Transformation');
            return initTransformationGame();
        }

        const { data, error } = await window.supabaseClient
            .from('assignment')
            .select('*')
            .eq('userName', window.currentUser)
            .maybeSingle(); 

        if (error || !data) {
            return skillMap[Math.floor(Math.random() * skillMap.length)].fn();
        }

        let availableSkills = skillMap.filter(s => !window.skillsCompletedThisSession.includes(s.id));
        if (availableSkills.length === 0) {
            window.skillsCompletedThisSession = [];
            availableSkills = skillMap;
        }

        availableSkills.sort((a, b) => (data[a.id] || 0) - (data[b.id] || 0));
        const nextSkill = availableSkills[0];
        window.skillsCompletedThisSession.push(nextSkill.id);
        nextSkill.fn();

    } else {
        document.getElementById('q-title').innerText = "Under Construction";
        document.getElementById('q-content').innerHTML = `Lesson ${window.targetLesson} is not yet available.`;
    }
}

async function finishAssignment() {
    window.isCurrentQActive = false;
    try {
        await window.supabaseClient.from('assignment').update({ C624_Completed: true }).eq('userName', window.currentUser);
        document.getElementById('work-area').innerHTML = `
            <div style="text-align: center; padding: 40px; background: #f8fafc; border-radius: 12px; border: 2px solid #22c55e;">
                <h1 style="color: #22c55e;">Goal Reached!</h1>
                <p>Your 12 minutes of practice are logged.</p>
                <button onclick="location.reload()" class="primary-btn">Start New Session</button>
            </div>
        `;
    } catch (err) { console.error(err); }
}

window.onload = loadNextQuestion;
