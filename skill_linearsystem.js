/**
 * skill_linearsystem.js
 * Comprehensive Linear Systems module.
 */

var linearErrorCount = 0;
var linearStep = 1; 
var currentSystem = {};
var userPoints = [];

// --- Initialization ---

window.initLinearSystemGame = async function() {
    window.isCurrentQActive = true;
    window.currentQSeconds = 0;
    linearErrorCount = 0;
    linearStep = 1;
    userPoints = [];

    // 1. INCREASED VARIETY: Type 0 = One, 1 = None, 2 = Infinite
    const type = Math.floor(Math.random() * 3); 
    
    // Expanded coordinate and slope ranges to prevent duplicate problems
    const tx = Math.floor(Math.random() * 9) - 4; // -4 to 4
    const ty = Math.floor(Math.random() * 9) - 4; // -4 to 4
    
    // Random slopes from -3 to 3 (excluding 0)
    const possibleSlopes = [-3, -2, -1, 1, 2, 3];
    let m1 = possibleSlopes[Math.floor(Math.random() * possibleSlopes.length)];
    let b1 = ty - (m1 * tx);
    
    let m2, b2, correctCount;

    if (type === 0) { 
        // ONE SOLUTION: Slopes must be different
        do { 
            m2 = possibleSlopes[Math.floor(Math.random() * possibleSlopes.length)];
        } while (m1 === m2);
        b2 = ty - (m2 * tx);
        correctCount = 1;
    } else if (type === 1) { 
        // NO SOLUTION: Same slope, different intercept
        m2 = m1;
        b2 = b1 + (Math.random() > 0.5 ? (Math.floor(Math.random()*3)+1) : -(Math.floor(Math.random()*3)+1)); 
        correctCount = 0;
    } else { 
        // INFINITE: Same slope, same intercept
        m2 = m1;
        b2 = b1;
        correctCount = Infinity;
    }

    const girls = ["Maya", "Elena", "Amara", "Sarah", "Jasmine", "Zoe"];
    const boys = ["Liam", "Caleb", "Isaac", "Noah", "Leo", "Ethan"];
    
    currentSystem = {
        m1, b1, m2, b2,
        correctCount,
        girl: { 
            name: girls[Math.floor(Math.random() * girls.length)], 
            x: tx, y: ty, 
            isCorrect: (type !== 1) 
        },
        boy: { 
            name: boys[Math.floor(Math.random() * boys.length)], 
            x: tx + (Math.random() > 0.5 ? 1 : -1), 
            y: ty + (Math.random() > 0.5 ? 1 : -1), 
            isCorrect: (type === 2) // Highly unlikely to be correct by accident
        },
        eq1Disp: `y = ${m1}x ${b1 >= 0 ? '+ ' + b1 : '- ' + Math.abs(b1)}`,
        eq2Disp: `y = ${m2}x ${b2 >= 0 ? '+ ' + b2 : '- ' + Math.abs(b2)}`
    };

    renderLinearUI();
};

// --- UI Rendering ---

function renderLinearUI() {
    const qContent = document.getElementById('q-content');
    if (!qContent) return;
    
    document.getElementById('q-title').innerText = "System Analysis";

    let header = `
        <div style="background:#f1f5f9; padding:15px; border-radius:12px; margin-bottom:15px; border: 1px solid #cbd5e1; text-align:center;">
            <p style="font-family:monospace; font-size:1.2rem; margin:0;">
                Line A: <strong>${currentSystem.eq1Disp}</strong><br>
                Line B: <strong>${currentSystem.eq2Disp}</strong>
            </p>
        </div>
        <div id="linear-feedback" style="display:none; padding:10px; border-radius:8px; margin-bottom:10px; text-align:center; font-weight:bold;"></div>`;

    let body = "";
    if (linearStep === 1) {
        body = `<p>Step 1: ${currentSystem.girl.name} says (${currentSystem.girl.x}, ${currentSystem.girl.y}) is a solution. Correct?</p>
                <div style="display:flex; gap:10px; justify-content:center;">
                    <button class="primary-btn" onclick="checkStep(true, 'girl')">Yes</button>
                    <button class="secondary-btn" onclick="checkStep(false, 'girl')">No</button>
                </div>`;
    } else if (linearStep === 2) {
        body = `<p>Step 2: ${currentSystem.boy.name} says (${currentSystem.boy.x}, ${currentSystem.boy.y}) is a solution. Correct?</p>
                <div style="display:flex; gap:10px; justify-content:center;">
                    <button class="primary-btn" onclick="checkStep(true, 'boy')">Yes</button>
                    <button class="secondary-btn" onclick="checkStep(false, 'boy')">No</button>
                </div>`;
    } else if (linearStep === 3) {
        body = `<p>Step 3: How many solutions?</p>
                <div style="display:grid; gap:8px;">
                    <button class="primary-btn" onclick="checkCount(1)">Exactly One</button>
                    <button class="primary-btn" onclick="checkCount(0)">No Solution</button>
                    <button class="primary-btn" onclick="checkCount(Infinity)">Infinite Solutions</button>
                </div>`;
    } else {
        body = `<p>Step 4: Graph Line A (Blue) then Line B (Red).</p>
                <canvas id="systemCanvas" width="300" height="300" style="background:white; border:2px solid #333; display:block; margin:0 auto; cursor:crosshair;"></canvas>
                <div id="graph-status" style="text-align:center; margin-top:10px; font-weight:bold; color:#3b82f6;">Line A: Plot Point 1</div>`;
    }

    qContent.innerHTML = header + body;
    if (linearStep === 4) initCanvas(); 
}

// --- Logic Checks ---

window.showLinearFeedback = function(msg, isCorrect) {
    const fb = document.getElementById('linear-feedback');
    if(!fb) return;
    fb.style.display = "block";
    fb.style.background = isCorrect ? "#dcfce7" : "#fee2e2";
    fb.style.color = isCorrect ? "#166534" : "#991b1b";
    fb.innerText = msg;
};

window.checkStep = function(userChoice, peerKey) {
    // Safety check: ensure currentSystem exists
    if (!currentSystem[peerKey]) return;

    const actual = currentSystem[peerKey].isCorrect;
    if (userChoice === actual) {
        showLinearFeedback("Correct!", true);
        setTimeout(() => { linearStep++; renderLinearUI(); }, 600);
    } else {
        linearErrorCount++;
        showLinearFeedback("Incorrect. Check both equations!", false);
    }
};

window.checkCount = function(val) {
    if (val === currentSystem.correctCount) {
        showLinearFeedback("Correct!", true);
        setTimeout(() => { linearStep = 4; renderLinearUI(); }, 600);
    } else {
        linearErrorCount++;
        showLinearFeedback("Look at the slopes and intercepts!", false);
    }
};

// --- Canvas Helper ---

function initCanvas() {
    const canvas = document.getElementById('systemCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const stepSize = 30;

    function drawGrid() {
        ctx.clearRect(0,0,300,300);
        ctx.strokeStyle = "#e2e8f0";
        for(let i=0; i<=300; i+=stepSize) {
            ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,300); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(300,i); ctx.stroke();
        }
        ctx.strokeStyle = "#000"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(150,0); ctx.lineTo(150,300); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,150); ctx.lineTo(300,150); ctx.stroke();
    }

    drawGrid();

    canvas.onclick = function(e) {
        const rect = canvas.getBoundingClientRect();
        const gx = Math.round((e.clientX - rect.left - 150) / stepSize);
        const gy = Math.round((150 - (e.clientY - rect.top)) / stepSize);
        
        userPoints.push({x: gx, y: gy});
        
        // Visual feedback
        ctx.fillStyle = userPoints.length <= 2 ? "#3b82f6" : "#ef4444";
        ctx.beginPath(); ctx.arc(150 + gx*stepSize, 150 - gy*stepSize, 5, 0, 7); ctx.fill();

        if (userPoints.length === 2) validateLine(1);
        if (userPoints.length === 4) validateLine(2);
        
        const status = document.getElementById('graph-status');
        if(status) {
            const msgs = ["Line A: Pt 1", "Line A: Pt 2", "Line B: Pt 1", "Line B: Pt 2", "Success!"];
            status.innerText = msgs[userPoints.length] || "Success!";
        }
    };

    function validateLine(num) {
        const p1 = userPoints[num === 1 ? 0 : 2];
        const p2 = userPoints[num === 1 ? 1 : 3];
        const m = num === 1 ? currentSystem.m1 : currentSystem.m2;
        const b = num === 1 ? currentSystem.b1 : currentSystem.b2;
        
        const um = (p2.y - p1.y) / (p2.x - p1.x);
        const ub = p1.y - (um * p1.x);

        if (um === m && Math.abs(ub - b) < 0.1) {
            ctx.strokeStyle = num === 1 ? "#3b82f6" : "#ef4444";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(150 + (p1.x-10)*stepSize, 150 - (p1.y + um*(p1.x-10 - p1.x))*stepSize);
            ctx.lineTo(150 + (p1.x+10)*stepSize, 150 - (p1.y + um*(p1.x+10 - p1.x))*stepSize);
            ctx.stroke();
            if (num === 2) finalize();
        } else {
            linearErrorCount++;
            showLinearFeedback("Line incorrect!", false);
            userPoints = (num === 1) ? [] : [userPoints[0], userPoints[1]];
            setTimeout(() => { drawGrid(); userPoints.forEach(p => { /* redraw existing */ }); }, 1000);
        }
    }
}

async function finalize() {
    const sessionPoints = Math.max(1, 10 - linearErrorCount);
    
    if (window.supabaseClient) {
        const { data } = await window.supabaseClient.from('assignment').select('LinearSystem').eq('userName', window.currentUser).single();
        const currentM = data?.LinearSystem || 0;
        const newM = Math.min(10, currentM + (sessionPoints / 5));
        await window.supabaseClient.from('assignment').update({ LinearSystem: newM }).eq('userName', window.currentUser);
    }
    
    setTimeout(() => { if(window.loadNextQuestion) window.loadNextQuestion(); }, 1200);
}
