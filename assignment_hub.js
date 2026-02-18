// --- Configuration & Supabase Init ---
const SB_URL = "https://khazeoycsjdqnmwodncw.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoYXplb3ljc2pkcW5td29kbmN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MDMwOTMsImV4cCI6MjA3ODQ3OTA5M30.h-WabaGcQZ968sO2ImetccUaRihRFmO2mUKCdPiAbEI";
const isAssignmentPage = window.location.pathname.includes('assignment.html');

// FIX: Use window.supabaseClient to avoid redeclaration errors in global scope
if (!window.supabaseClient) {
    window.supabaseClient = supabase.createClient(SB_URL, SB_KEY);
}

// Global State
window.totalSecondsWorked = 0; // Loaded from DB now
window.isCurrentQActive = false;
window.currentQSeconds = 0;
window.currentUser = sessionStorage.getItem('current_user') || 'test_user';
window.targetLesson = sessionStorage.getItem('target_lesson') || 'C6Review';
window.lastActivity = Date.now();
window.isIdle = false;
window.hasDonePrimaryLesson = false;
window.skillsCompletedThisSession = []; 
window.canCount = false; 
window.resumeTimeout = null;
window.isWindowLargeEnough = true;
window.hasLoadedTime = false; // Added to prevent timer starting before DB fetch

// --- Window Size Checker Function ---
function checkWindowSize() {
    if (!isAssignmentPage) {
        window.isWindowLargeEnough = true;
        return;
    }
    const winWidth = window.outerWidth;
    const winHeight = window.outerHeight;
    const screenWidth = window.screen.availWidth;
    const screenHeight = window.screen.availHeight;
    const overlay = document.getElementById('size-overlay');

    if (winWidth < (screenWidth * 0.9) || winHeight < (screenHeight * 0.9)) {
        window.isWindowLargeEnough = false;
        if (overlay) overlay.classList.add('active');
    } else {
        window.isWindowLargeEnough = true;
        if (overlay) overlay.classList.remove('active');
    }
}

// --- Activity & Focus Listeners ---
window.onblur = () => {
    window.canCount = false;
    clearTimeout(window.resumeTimeout);
};
window.onfocus = () => {
    clearTimeout(window.resumeTimeout);
    if (isAssignmentPage) {
        // Keep the penalty as it ensures the tab is actually active
        window.resumeTimeout = setTimeout(() => { window.canCount = true; }, 15000);
    } else {
        window.canCount = true;
    }
};

window.addEventListener('resize', checkWindowSize);
checkWindowSize();

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        window.canCount = false;
        clearTimeout(window.resumeTimeout);
    }
});

if (!isAssignmentPage) {
    window.canCount = true; 
} else {
    window.resumeTimeout = setTimeout(() => { window.canCount = true; }, 20000);
}

// --- The Master Timer Loop ---
setInterval(() => {
    if (!isAssignmentPage || !window.hasLoadedTime) return;

    const statePill = document.getElementById('timer-state-pill');
    const totalDisplay = document.getElementById('debug-total-time');
    const qTimeDisplay = document.getElementById('debug-q-time');
    
    const secondsSinceLastActivity = (Date.now() - window.lastActivity) / 1000;
    if (secondsSinceLastActivity > 30) window.isIdle = true;

    const qContent = document.getElementById('q-content');
    const hasQuestion = qContent && qContent.innerHTML.length > 50 && !qContent.innerText.includes("Wait...");

    if (window.isCurrentQActive && window.canCount && hasQuestion && !window.isIdle && window.isWindowLargeEnough) {
        window.totalSecondsWorked++;
        window.currentQSeconds++;
        
        // --- COUNTDOWN DISPLAY LOGIC ---
        const goal = 720;
        const remaining = Math.max(0, goal - window.totalSecondsWorked);
        let mins = Math.floor(remaining / 60);
        let secs = remaining % 60;
        
        if (totalDisplay) totalDisplay.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        if (qTimeDisplay) qTimeDisplay.innerText = `${window.currentQSeconds}s`;
        
        // --- DB SYNC LOGIC (Every 10 seconds) ---
        if (window.totalSecondsWorked % 10 === 0) {
            syncTimerToDB();
        }

        if (statePill) {
            statePill.innerText = "RUNNING";
            statePill.style.background = "#22c55e";
        }
        
        if (window.totalSecondsWorked >= 720) finishAssignment();
    } else {
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

// --- New Sync Function ---
async function syncTimerToDB() {
    const currentHour = sessionStorage.getItem('target_hour') || "00";
    const timerCol = `${window.targetLesson}Timer`;
    const update = {};
    update[timerCol] = window.totalSecondsWorked;
    
    await window.supabaseClient
        .from('assignment')
        .update(update)
        .eq('userName', window.currentUser)
        .eq('hour', currentHour);
}

// --- Adaptive Routing & DB Check/Create Logic ---
async function loadNextQuestion() {
    if (window.isCurrentQActive) return;
    window.currentQSeconds = 0; 
    const feedback = document.getElementById('feedback-box');
    if(feedback) {
        feedback.style.display = 'none';
        feedback.className = '';
    }
    
    window.scrollTo(0,0);
    const currentHour = sessionStorage.getItem('target_hour') || "00";

    try {
        let { data, error } = await window.supabaseClient
            .from('assignment')
            .select('*')
            .eq('userName', window.currentUser)
            .eq('hour', currentHour)
            .maybeSingle();

        if (!data && !error) {
            const timerCol = `${window.targetLesson}Timer`;
            const ins = { userName: window.currentUser, hour: currentHour };
            ins[window.targetLesson] = false;
            ins[timerCol] = 0;

            await window.supabaseClient.from('assignment').insert([ins]);
            window.totalSecondsWorked = 0;
        } else {
            // --- LOAD TIME & APPLY 30s PENALTY ---
            const timerCol = `${window.targetLesson}Timer`;
            const savedTime = data[timerCol] || 0;
            window.totalSecondsWorked = Math.max(0, savedTime - 30);
            
            if (data[window.targetLesson] === true) {
                window.totalSecondsWorked = 720;
            }
        }
        window.hasLoadedTime = true;
    } catch (err) {
        console.error("DB Initialization Error:", err);
    }

    const skillMap = [
        { id: 'C6Transformation', fn: typeof initTransformationGame !== 'undefined' ? initTransformationGame : null },
        { id: 'LinearSystem', fn: typeof initLinearSystemGame !== 'undefined' ? initLinearSystemGame : null },
        { id: 'FigureGrowth', fn: typeof initFigureGrowthGame !== 'undefined' ? initFigureGrowthGame : null },
        { id: 'SolveX', fn: typeof initSolveXGame !== 'undefined' ? initSolveXGame : null },
        { id: 'BoxPlot', fn: typeof initBoxPlotGame !== 'undefined' ? initBoxPlotGame : null }
    ].filter(s => s.fn !== null);

    if (window.targetLesson === 'C6Review' || window.targetLesson === '6.2.4') {
        
        if (!window.hasDonePrimaryLesson) {
            window.hasDonePrimaryLesson = true;
            window.skillsCompletedThisSession.push('C6Transformation');
            return initTransformationGame();
        }

        const { data: skillData } = await window.supabaseClient
            .from('assignment')
            .select('*')
            .eq('userName', window.currentUser)
            .eq('hour', currentHour)
            .maybeSingle(); 

        let availableSkills = skillMap.filter(s => !window.skillsCompletedThisSession.includes(s.id));
        if (availableSkills.length === 0) {
            window.skillsCompletedThisSession = [];
            availableSkills = skillMap;
        }

        availableSkills.sort((a, b) => (skillData ? (skillData[a.id] || 0) : 0) - (skillData ? (skillData[b.id] || 0) : 0));
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
    const currentHour = sessionStorage.getItem('target_hour') || "00";
    const dbColumn = window.targetLesson; 
    const timerCol = `${window.targetLesson}Timer`;

    const updateObj = {};
    updateObj[dbColumn] = true;
    updateObj[timerCol] = 720; // Ensure timer shows 0:00

    try {
        await window.supabaseClient
            .from('assignment')
            .update(updateObj)
            .eq('userName', window.currentUser)
            .eq('hour', currentHour);

        document.getElementById('work-area').innerHTML = `
            <div style="text-align: center; padding: 40px; background: #f8fafc; border-radius: 12px; border: 2px solid #22c55e;">
                <h1 style="color: #22c55e;">Goal Reached!</h1>
                <p>Your 12 minutes of practice for <strong>${window.targetLesson}</strong> are logged for Hour ${currentHour}.</p>
                <button onclick="location.reload()" class="primary-btn">Start New Session</button>
            </div>
        `;
    } catch (err) { 
        console.error("Error saving completion:", err); 
    }
}

window.onload = loadNextQuestion;
