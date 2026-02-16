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
    if (!timerEl) return;

    const isIdle = (Date.now() - lastActivity > IDLE_LIMIT);

    // Only increment time if active, not idle, and under the per-question cap
    if (!isIdle && isCurrentQActive && currentQSeconds < currentQCap) {
        totalWorkSeconds++;
        currentQSeconds++;
        timerEl.classList.remove('idle');
    } else {
        timerEl.classList.add('idle'); // CSS handles the red color
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
    // Reset UI State
    const feedback = document.getElementById('feedback-box');
    if(feedback) {
        feedback.style.display = 'none';
        feedback.className = ''; // Clear correct/incorrect classes
    }
    
    window.scrollTo(0,0); // Reset scroll for mobile users

    // Check if the user is specifically in the 6.2.4 path
    if (targetLesson === '6.2.4') {
        const lesson624Skills = [
            initTransformationGame,
            initLinearSystemGame,
            initFigureGrowthGame,
            initSolveXGame,
            initBoxPlotGame
        ];

        // Pick a random skill from the 6.2.4 bank
        const randomSkillInitializer = lesson624Skills[Math.floor(Math.random() * lesson624Skills.length)];
        
        // Ensure the function exists before calling
        if (typeof randomSkillInitializer === 'function') {
            randomSkillInitializer();
        } else {
            console.error("Skill initializer not found. Check script loading order.");
        }
    } else {
        document.getElementById('q-title').innerText = "Under Construction";
        document.getElementById('q-content').innerHTML = `Lesson ${targetLesson} is not yet available.`;
    }
}

async function finishAssignment() {
    isCurrentQActive = false;
    alert("Time complete! Redirecting to your dashboard.");
    window.location.href = 'index.html';
}

// Kickoff
window.onload = loadNextQuestion;
