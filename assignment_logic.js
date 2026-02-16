const SB_URL = "https://khazeoycsjdqnmwodncw.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoYXplb3ljc2pkcW5td29kbmN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MDMwOTMsImV4cCI6MjA3ODQ3OTA5M30.h-WabaGcQZ968sO2ImetccUaRihRFmO2mUKCdPiAbEI";
const supabaseClient = supabase.createClient(SB_URL, SB_KEY);

// --- Session State ---
let currentUser = sessionStorage.getItem('current_user');
let targetLesson = sessionStorage.getItem('target_lesson');

// --- Progress Tracking ---
let totalWorkSeconds = 0;
let currentQSeconds = 0;
let questionsCompleted = 0;

// --- Configurable Logic ---
let currentQCap = 60; 
let isCurrentQActive = true;
let lastActivity = Date.now();

const IDLE_LIMIT = 30000; // 30s
const TARGET_TOTAL_MINUTES = 12;
const MIN_QUESTIONS = 5;

if (!currentUser) window.location.href = 'index.html';

document.getElementById('user-display').innerText = currentUser.toUpperCase();
document.getElementById('lesson-display').innerText = targetLesson;

// --- Timer Loop ---
function updateTimer() {
    const now = Date.now();
    const timerEl = document.getElementById('timer-display');
    const isIdle = (now - lastActivity > IDLE_LIMIT);

    if (!isIdle && isCurrentQActive) {
        if (currentQSeconds < currentQCap) {
            totalWorkSeconds++;
            currentQSeconds++;
            timerEl.classList.remove('idle');
            timerEl.style.color = "black";
        } else {
            // Reached cap for this specific question
            isCurrentQActive = false;
            timerEl.classList.add('idle');
            timerEl.style.color = "red";
        }
    } else {
        timerEl.classList.add('idle');
        timerEl.style.color = "red";
    }

    // Display update
    let mins = Math.floor(totalWorkSeconds / 60);
    let secs = totalWorkSeconds % 60;
    timerEl.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    if (mins >= TARGET_TOTAL_MINUTES && questionsCompleted >= MIN_QUESTIONS) {
        finishAssignment();
    }
}

// --- Activity Listeners ---
['mousedown', 'keydown', 'touchstart', 'mousemove'].forEach(evt => {
    window.addEventListener(evt, () => { lastActivity = Date.now(); });
});

setInterval(updateTimer, 1000);

// --- Question Handling ---
function loadNextQuestion() {
    // Reset Q tracking
    currentQSeconds = 0;
    isCurrentQActive = true;
    
    // Logic for 6.2.4 (Placeholder for your first question type)
    const qData = {
        title: "Starting 6.2.4",
        content: "Wait for teacher to provide first question logic...",
        cap: 90 // Default 90 seconds of credit for this Q
    };
    
    currentQCap = qData.cap;
    document.getElementById('q-title').innerText = qData.title;
    document.getElementById('q-content').innerHTML = qData.content;
}

async function finishAssignment() {
    alert("Assignment Complete! Syncing data...");
    // Update Supabase (Logic to update C6Transformation or similar)
    const { error } = await supabaseClient
        .from('assignment')
        .update({ C6Transformation: 100 }) // Example update
        .eq('userName', currentUser);
        
    window.location.href = 'index.html';
}

// Initial Kickoff
loadNextQuestion();
