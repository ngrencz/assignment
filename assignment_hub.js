// --- Configuration & Supabase Init ---
const SB_URL = "https://khazeoycsjdqnmwodncw.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoYXplb3ljc2pkcW5td29kbmN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MDMwOTMsImV4cCI6MjA3ODQ3OTA5M30.h-WabaGcQZ968sO2ImetccUaRihRFmO2mUKCdPiAbEI";
const supabaseClient = supabase.createClient(SB_URL, SB_KEY);

let totalWorkSeconds = 0;
let currentQSeconds = 0;
let currentQCap = 60; 
let isCurrentQActive = false;
let lastActivity = Date.now();
let currentUser = sessionStorage.getItem('current_user');
let targetLesson = sessionStorage.getItem('target_lesson');

const IDLE_LIMIT = 30000; // 30 seconds
const TARGET_MINUTES = 12;

// --- Global Timer Logic ---
setInterval(() => {
    const timerEl = document.getElementById('timer-display');
    const isIdle = (Date.now() - lastActivity > IDLE_LIMIT);

    if (!isIdle && isCurrentQActive && currentQSeconds < currentQCap) {
        totalWorkSeconds++;
        currentQSeconds++;
        timerEl.style.color = "#2d3748";
    } else {
        timerEl.style.color = "#e53e3e"; // Red when idle or cap hit
    }

    let mins = Math.floor(totalWorkSeconds / 60);
    let secs = totalWorkSeconds % 60;
    timerEl.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    if (mins >= TARGET_MINUTES) { finishAssignment(); }
}, 1000);

// Activity Tracking
['mousedown', 'keydown', 'mousemove', 'touchstart'].forEach(e => 
    window.addEventListener(e, () => lastActivity = Date.now())
);

// --- Navigation/Routing ---
async function loadNextQuestion() {
    document.getElementById('feedback-box').style.display = 'none';
    
    // Randomly select a module from the pool
    const pick = Math.floor(Math.random() * 4);
    
    switch(pick) {
        case 0: initTransformationGame(); break;
        case 1: initLinearSystemGame(); break;
        case 2: initFigureGrowthGame(); break;
        case 3: initSolveXGame(); break;
    }
}

async function finishAssignment() {
    isCurrentQActive = false;
    alert("Great work! You've completed your required practice time.");
    window.location.href = 'index.html';
}

// Kickoff
window.onload = loadNextQuestion;
