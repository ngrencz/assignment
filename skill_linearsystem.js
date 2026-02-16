let errorCount = 0;
let pointsChecked = { hannah: false, wirt: false };

function initLinearSystemGame() {
    // CurrentSkill for Hub/Supabase tracking
    currentSkill = "LinearSystem";
    currentQCap = 180;
    currentQSeconds = 0;
    isCurrentQActive = true;
    errorCount = 0;
    pointsChecked = { hannah: false, wirt: false };

    // Problem Data (Matching your image)
    // Eq 1: 2x - 3y = 10
    // Eq 2: 6y = 4x - 20 (Simplified: 4x - 6y = 20 -> 2x - 3y = 10)
    currentSystem = {
        eq1: "2x - 3y = 10",
        eq2: "6y = 4x - 20",
        hannah: { x: -4, y: -6, name: "Hannah" },
        wirt: { x: 20, y: 10, name: "Wirt" }
    };

    renderLinearUI();
}

function renderLinearUI() {
    document.getElementById('q-title').innerText = "Systems: Infinite Solutions?";
    document.getElementById('q-content').innerHTML = `
        <div style="text-align:center; margin-bottom:15px;">
            <canvas id="linearCanvas" width="300" height="200" style="border:1px solid #ccc; background:white;"></canvas>
        </div>
        <div style="background: #edf2f7; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 14px; margin-bottom:10px;">
            1: ${currentSystem.eq1}<br>2: ${currentSystem.eq2}
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <button id="btn-hannah" onclick="checkPoint('hannah')">Check Hannah<br>(-4, -6)</button>
            <button id="btn-wirt" onclick="checkPoint('wirt')">Check Wirt<br>(20, 10)</button>
        </div>
        <div id="linear-msg" style="margin-top:10px; font-weight:bold; text-align:center; min-height:20px;"></div>
    `;
    drawSystem();
}

function drawSystem() {
    const canvas = document.getElementById('linearCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,300,200);
    
    // Draw Simple Axis
    ctx.strokeStyle = "#e2e8f0";
    ctx.beginPath(); ctx.moveTo(150,0); ctx.lineTo(150,200); ctx.moveTo(0,100); ctx.lineTo(300,100); ctx.stroke();

    // Draw the Line (Both eq are same, so we draw one line)
    // y = (2/3)x - 10/3
    ctx.strokeStyle = "#3182ce";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 100 - (-10/3 * 10)); // Simple scaling for viz
    ctx.lineTo(300, 100 - (10 * 2)); 
    ctx.stroke();
}

async function checkPoint(person) {
    const p = currentSystem[person];
    const msg = document.getElementById('linear-msg');
    
    // Verification logic: 2x - 3y = 10
    const val = (2 * p.x) - (3 * p.y);
    
    if (val === 10) {
        msg.innerHTML = `<span style="color:green;">${p.name} is Correct!</span>`;
        pointsChecked[person] = true;
        document.getElementById(`btn-${person}`).style.background = "#c6f6d5";
    } else {
        errorCount++;
        msg.innerHTML = `<span style="color:red;">${p.name} is Incorrect.</span>`;
    }

    if (pointsChecked.hannah && pointsChecked.wirt) {
        setTimeout(finalizeLinear, 1500);
    }
}

async function finalizeLinear() {
    alert("Both Hannah and Wirt are correct! This confirms that the two equations describe the same line.");
    
    let score = Math.max(1, 10 - (errorCount * 2));
    await supabaseClient.from('assignment').update({ LinearSystem: score }).eq('userName', currentUser);
    
    loadNextQuestion(); // Hub takes back control
}
