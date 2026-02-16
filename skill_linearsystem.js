let errorCount = 0;
let pointsChecked = { hannah: false, wirt: false };

function initLinearSystemGame() {
    isCurrentQActive = true;
    currentQCap = 180;
    currentQSeconds = 0;
    errorCount = 0;
    pointsChecked = { hannah: false, wirt: false };

    // Problem Data: 2x - 3y = 10 and 6y = 4x - 20 (Coincident Lines)
    currentSystem = {
        eq1: "2x - 3y = 10",
        eq2: "6y = 4x - 20",
        hannah: { x: -4, y: -6, name: "Hannah" },
        wirt: { x: 20, y: 10, name: "Wirt" }
    };

    renderLinearUI();
}

function renderLinearUI() {
    document.getElementById('q-title').innerText = "Systems: Infinite Solutions";
    document.getElementById('q-content').innerHTML = `
        <canvas id="linearCanvas" width="300" height="200"></canvas>
        
        <div style="background: var(--gray-light); padding: 15px; border-radius: 12px; font-family: monospace; font-size: 1.1rem; margin-bottom: 20px; border: 1px solid var(--gray-med);">
            1: ${currentSystem.eq1}<br>
            2: ${currentSystem.eq2}
        </div>

        <p>Check if both students found valid solutions for this system:</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <button id="btn-hannah" onclick="checkPoint('hannah')">
                Check Hannah<br><small>(-4, -6)</small>
            </button>
            <button id="btn-wirt" onclick="checkPoint('wirt')">
                Check Wirt<br><small>(20, 10)</small>
            </button>
        </div>
    `;
    drawSystem();
}

function drawSystem() {
    const canvas = document.getElementById('linearCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 300, 200);
    
    // Draw Simple Axis
    ctx.strokeStyle = "var(--gray-med)";
    ctx.lineWidth = 1;
    ctx.beginPath(); 
    ctx.moveTo(150, 0); ctx.lineTo(150, 200); // Y-axis
    ctx.moveTo(0, 100); ctx.lineTo(300, 100); // X-axis
    ctx.stroke();

    // Draw the Line (Since they are the same line, we draw once)
    ctx.strokeStyle = "var(--kelly-green)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    // Scaling points for visualization (-10/3 intercept, 2/3 slope)
    ctx.moveTo(0, 100 + 33); 
    ctx.lineTo(300, 100 - 66); 
    ctx.stroke();
}

async function checkPoint(person) {
    const p = currentSystem[person];
    const feedback = document.getElementById('feedback-box');
    feedback.style.display = "block";
    
    // Verification logic: 2x - 3y = 10
    const val = (2 * p.x) - (3 * p.y);
    
    if (val === 10) {
        pointsChecked[person] = true;
        feedback.className = "correct";
        feedback.innerText = `${p.name}'s point is on the line!`;
        
        // Visual feedback on the button itself
        const btn = document.getElementById(`btn-${person}`);
        btn.style.opacity = "0.6";
        btn.innerText = `✓ ${p.name} Verified`;
        btn.disabled = true;
    } else {
        errorCount++;
        feedback.className = "incorrect";
        feedback.innerText = `${p.name}'s point does not satisfy the equations.`;
    }

    if (pointsChecked.hannah && pointsChecked.wirt) {
        feedback.innerText = "Both verified! Since two different points work for both equations, the lines are coincident (Infinite Solutions).";
        setTimeout(finalizeLinear, 2500);
    }
}

async function finalizeLinear() {
    let score = Math.max(1, 10 - (errorCount * 2));
    await supabaseClient.from('assignment').update({ LinearSystem: score }).eq('userName', currentUser);
    loadNextQuestion();
}
