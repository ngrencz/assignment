let totalWorkSeconds = 0;
let lastActivity = Date.now();
const IDLE_LIMIT = 30000;
const SB_CLIENT = supabase.createClient(SB_URL, SB_KEY);

// Current Skill State (Modified by the 'Spoke' files)
let currentQActive = false;
let currentQSeconds = 0;
let currentQCap = 60; 

function updateGlobalTimer() {
    const isIdle = (Date.now() - lastActivity > IDLE_LIMIT);
    
    if (!isIdle && currentQActive && currentQSeconds < currentQCap) {
        totalWorkSeconds++;
        currentQSeconds++;
        document.getElementById('timer-display').innerText = formatTime(totalWorkSeconds);
    }
}

// Logic to decide which skill to load based on Supabase Data
async function loadSmartQuestion() {
    const { data } = await SB_CLIENT.from('assignment')
        .select('*').eq('userName', currentUser).single();

    // If C6Transformation score is low (< 5), prioritize that skill
    if (data.C6Transformation < 5) {
        loadTransformationSkill(); // This function lives in your spoke file
    } else {
        // Load other skills...
    }
}

setInterval(updateGlobalTimer, 1000);
