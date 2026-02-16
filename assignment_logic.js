const SB_URL = "https://khazeoycsjdqnmwodncw.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoYXplb3ljc2pkcW5td29kbmN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MDMwOTMsImV4cCI6MjA3ODQ3OTA5M30.h-WabaGcQZ968sO2ImetccUaRihRFmO2mUKCdPiAbEI";
const supabase = supabase.createClient(SB_URL, SB_KEY);

// Session State
let currentUser = sessionStorage.getItem('current_user');
let targetLesson = sessionStorage.getItem('target_lesson');
let workSeconds = 0;
let lastActivity = Date.now();
const IDLE_LIMIT = 30000; // 30 seconds of no input = Idle
const TARGET_WORK_MINUTES = 12; // Complete after 12 mins of real work

if (!currentUser) window.location.href = 'index.html';

document.getElementById('user-display').innerText = currentUser.toUpperCase();
document.getElementById('lesson-display').innerText = targetLesson;

// --- Timer Logic ---
function updateTimer() {
    const now = Date.now();
    const timerEl = document.getElementById('timer-display');

    // Only count if last activity was within the limit
    if (now - lastActivity < IDLE_LIMIT) {
        workSeconds++;
        timerEl.classList.remove('idle');
    } else {
        timerEl.classList.add('idle');
    }

    // Format display
    let mins = Math.floor(workSeconds / 60);
    let secs = workSeconds % 60;
    timerEl.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    // Completion Check
    if (mins >= TARGET_WORK_MINUTES) {
        finishAssignment();
    }
}

// Activity Listeners
['mousedown', 'keydown', 'touchstart', 'mousemove'].forEach(evt => {
    window.addEventListener(evt, () => {
        lastActivity = Date.now();
    });
});

setInterval(updateTimer, 1000);

// --- Question Engine Placeholder ---
function loadNextQuestion() {
    // We will build the random generation logic here based on targetLesson
    console.log("Generating next question for:", targetLesson);
}

async function finishAssignment() {
    alert("Assignment Complete! You've put in enough work time.");
    // Update Supabase progress here
    window.location.href = 'index.html'; 
}

// Start
loadNextQuestion();
