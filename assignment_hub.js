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

const IDLE_LIMIT = 30000;

// Timer Loop
setInterval(() => {
    const timerEl = document.getElementById('timer-display');
    if (Date.now() - lastActivity < IDLE_LIMIT && isCurrentQActive && currentQSeconds < currentQCap) {
        totalWorkSeconds++;
        currentQSeconds++;
        timerEl.style.color = "black";
    } else {
        timerEl.style.color = "red";
    }
    let mins = Math.floor(totalWorkSeconds / 60);
    let secs = totalWorkSeconds % 60;
    timerEl.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}, 1000);

['mousedown', 'keydown', 'mousemove'].forEach(e => window.addEventListener(e, () => lastActivity = Date.now()));

// The "Switcher" - This loads the correct skill logic
async function loadQuestion() {
    document.getElementById('feedback-box').style.display = 'none';
    
    switch(targetLesson) {
        case '6.2.4':
            initTransformationGame(); // Lives in skill_transformation.js
            break;
        case '6.2.5':
            // initSimilarityGame(); 
            break;
    }
}
