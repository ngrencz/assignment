// --- Configuration & Supabase Init ---
const SB_URL = "https://khazeoycsjdqnmwodncw.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoYXplb3ljc2pkcW5td29kbmN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MDMwOTMsImV4cCI6MjA3ODQ3OTA5M30.h-WabaGcQZ968sO2ImetccUaRihRFmO2mUKCdPiAbEI";
const isAssignmentPage = window.location.pathname.includes('assignment.html');

// FIX: Use window.supabaseClient to avoid redeclaration errors in global scope
if (!window.supabaseClient) {
    window.supabaseClient = supabase.createClient(SB_URL, SB_KEY);
}

// --- Dynamic Time Requirements ---
const timeRequirements = {
    'C6Review': 35 * 60, // 35 minutes -> 2100s
    '6.2.4': 12 * 60,    // 12 minutes -> 720s
    'default': 12 * 60
};

// Global State
window.totalSecondsWorked = 0; 
window.isCurrentQActive = false;
window.currentQSeconds = 0;
window.currentUser = sessionStorage.getItem('target_user') || 'test_user';
window.targetLesson = sessionStorage.getItem('target_lesson') || 'C6Review';
window.lastActivity = Date.now();
window.isIdle = false;
window.hasDonePrimaryLesson = false;
window.skillsCompletedThisSession = []; 
window.canCount = false; 
window.resumeTimeout = null;
window.isWindowLargeEnough = true;
window.hasLoadedTime = false; 
// This "Bridge" pulls data from the login page and gives it to the math scripts
window.currentHour = sessionStorage.getItem('target_hour');

// Debug check to make sure the data arrived
console.log("Session Loaded:", window.currentUser, window.currentHour);
const GOAL_SECONDS = timeRequirements[window.targetLesson] || timeRequirements['default'];

// --- Window Size Checker Function (PURPLE OUT) ---
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

    // LOOSENED: Now triggers at 80% screen size instead of 90%
    if (winWidth < (screenWidth * 0.8) || winHeight < (screenHeight * 0.8)) {
        window.isWindowLargeEnough = false;
        if (overlay) overlay.classList.add('active');
    } else {
        window.isWindowLargeEnough = true;
        if (overlay) overlay.classList.remove('active');
    }
}

// --- Activity & Focus Listeners (RELAXED PENALTY) ---
window.onblur = () => {
    window.canCount = false;
    clearTimeout(window.resumeTimeout);
};
window.onfocus = () => {
    clearTimeout(window.resumeTimeout);
    if (isAssignmentPage) {
        // LOOSENED: 5 second wait instead of 15s
        window.resumeTimeout = setTimeout(() => { window.canCount = true; }, 5000);
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
    // LOOSENED: 5 second initial start wait instead of 20s
    window.resumeTimeout = setTimeout(() => { window.canCount = true; }, 5000);
}

// --- The Master Timer Loop ---
setInterval(() => {
    if (!isAssignmentPage || !window.hasLoadedTime) return;

    const statePill = document.getElementById('timer-state-pill');
    const totalDisplay = document.getElementById('debug-total-time');
    
    // LOOSENED: 60s idle check instead of 30s
    const secondsSinceLastActivity = (Date.now() - window.lastActivity) / 1000;
    if (secondsSinceLastActivity > 60) window.isIdle = true;

    const qContent = document.getElementById('q-content');
    const hasQuestion = qContent && qContent.innerHTML.length > 50 && !qContent.innerText.includes("Wait...");

    if (window.isCurrentQActive && window.canCount && hasQuestion && !window.isIdle && window.isWindowLargeEnough) {
        window.totalSecondsWorked++;
        window.currentQSeconds++;
        
        // --- COUNTDOWN DISPLAY LOGIC ---
        const remaining = Math.max(0, GOAL_SECONDS - window.totalSecondsWorked);
        let mins = Math.floor(remaining / 60);
        let secs = remaining % 60;
        
        if (totalDisplay) totalDisplay.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        
        // --- PERSISTENCE: Sync to Supabase every 10 seconds ---
        if (window.totalSecondsWorked % 10 === 0) {
            syncTimerToDB();
        }

        if (statePill) {
            statePill.innerText = "RUNNING";
            statePill.style.background = "#22c55e";
        }
        
        if (window.totalSecondsWorked >= GOAL_SECONDS) finishAssignment();
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
                statePill.innerText = "PLEASE WAIT..."; 
                statePill.style.background = "#3b82f6";
            } else {
                statePill.innerText = "PAUSED";
                statePill.style.background = "#ef4444";
            }
        }
    }
}, 1000);

// --- DB Persistence Sync ---
async function syncTimerToDB() {
    const currentHour = sessionStorage.getItem('target_hour') || "00";
    const timerCol = `${window.targetLesson}Timer`;
    const update = { [timerCol]: window.totalSecondsWorked };
    try {
        await window.supabaseClient.from('assignment').update(update).eq('userName', window.currentUser).eq('hour', currentHour);
    } catch (e) { console.error("Sync error", e); }
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

    // Get the exact hour string from session storage
    const currentHour = sessionStorage.getItem('target_hour') || "00";

    // 1. DYNAMIC DATABASE CHECK/CREATE LOGIC (RESTORED FULL VERSION)
    try {
        let { data, error } = await window.supabaseClient
            .from('assignment')
            .select('*')
            .eq('userName', window.currentUser)
            .eq('hour', currentHour)
            .maybeSingle();

        // Create record if missing using the correct hour string
        if (!data && !error) {
            console.warn(`User ${window.currentUser} not found for Hour ${currentHour}. Creating record...`);
            await window.supabaseClient
                .from('assignment')
                .insert([{ 
                    userName: window.currentUser, 
                    hour: currentHour, 
                    [window.targetLesson]: false,
                    [`${window.targetLesson}Timer`]: 0
                }]);
            
            // Re-fetch using the correct hour string
            const { data: refreshed } = await window.supabaseClient
                .from('assignment')
                .select('*')
                .eq('userName', window.currentUser)
                .eq('hour', currentHour)
                .maybeSingle();
            data = refreshed;
        }

        if (data) {
            const timerCol = `${window.targetLesson}Timer`;
            const savedTime = data[timerCol] || 0;
            // Apply 30s penalty on load
            window.totalSecondsWorked = Math.max(0, savedTime - 30);
            
            if (data[window.targetLesson] === true) {
                window.totalSecondsWorked = GOAL_SECONDS;
            }
        }
        window.hasLoadedTime = true;

    } catch (err) {
        console.error("DB Initialization Error:", err);
    }

    // --- Skill Mapping Logic (RESTORED FULL VERSION) ---
    const skillMap = [
        { id: 'C6Transformation', fn: typeof initTransformationGame !== 'undefined' ? initTransformationGame : null },
        { id: 'LinearSystem', fn: typeof initLinearSystemGame !== 'undefined' ? initLinearSystemGame : null },
        { id: 'FigureGrowth', fn: typeof initFigureGrowthGame !== 'undefined' ? initFigureGrowthGame : null },
        { id: 'SolveX', fn: typeof initSolveXGame !== 'undefined' ? initSolveXGame : null },
        { id: 'BoxPlot', fn: typeof initBoxPlotGame !== 'undefined' ? initBoxPlotGame : null }
    ].filter(s => s.fn !== null);

    if (window.targetLesson === '6.2.4' || window.targetLesson === 'C6Review') {
        
        if (!window.hasDonePrimaryLesson) {
            window.hasDonePrimaryLesson = true;
            window.skillsCompletedThisSession.push('C6Transformation');
            return initTransformationGame();
        }

        // Fixed the fetch here to use currentHour
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

        // Sort by completion count
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
    const timerCol = `${window.targetLesson}Timer`;

    const updateObj = {
        [window.targetLesson]: true,
        [timerCol]: GOAL_SECONDS
    };

    try {
        await window.supabaseClient
            .from('assignment')
            .update(updateObj)
            .eq('userName', window.currentUser)
            .eq('hour', currentHour);

        document.getElementById('work-area').innerHTML = `
            <div style="text-align: center; padding: 40px; background: #f8fafc; border-radius: 12px; border: 2px solid #22c55e;">
                <h1 style="color: #22c55e;">Goal Reached!</h1>
                <p>Your ${GOAL_SECONDS / 60} minutes of practice for <strong>${window.targetLesson}</strong> are complete.</p>
                <button onclick="location.reload()" class="primary-btn">Start New Session</button>
            </div>
        `;
    } catch (err) { 
        console.error("Error saving completion:", err); 
    }
}

window.onload = loadNextQuestion;
