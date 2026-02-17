// Use 'var' to prevent redeclaration crashes in the debugger
var linearErrorCount = 0;
var linearStep = 1; 
var currentSystem = {};
var userPoints = [];

window.initLinearSystemGame = async function() {
    window.isCurrentQActive = true;
    window.currentQSeconds = 0;
    linearErrorCount = 0;
    linearStep = 1;
    userPoints = [];

    // 1. Pick a System Type: 0 = One, 1 = None, 2 = Infinite
    const systemType = Math.floor(Math.random() * 3); 
    
    const targetX = Math.floor(Math.random() * 5) - 2; 
    const targetY = Math.floor(Math.random() * 5) - 2; 
    let m1 = Math.floor(Math.random() * 3) + 1;
    let b1 = targetY - (m1 * targetX);
    
    let m2, b2, correctCount;

    if (systemType === 0) { // Exactly One
        do { m2 = Math.floor(Math.random() * 5) - 2; } while (m1 === m2 || m2 === 0);
        b2 = targetY - (m2 * targetX);
        correctCount = 1;
    } else if (systemType === 1) { // No Solution (Parallel)
        m2 = m1;
        b2 = b1 + (Math.random() > 0.5 ? 2 : -2); // Same slope, different intercept
        correctCount = 0;
    } else { // Infinite (Same Line)
        m2 = m1;
        b2 = b1;
        correctCount = Infinity;
    }

    const femaleNames = ["Maya", "Sarah", "Elena", "Amara"];
    const maleNames = ["Liam", "Noah", "Caleb", "Leo"];
    const girl = femaleNames[Math.floor(Math.random() * femaleNames.length)];
    const boy = maleNames[Math.floor(Math.random() * maleNames.length)];

    currentSystem = {
        m1, b1, m2, b2,
        targetX, targetY,
        correctCount,
        girl: { name: girl, x: targetX, y: targetY, isCorrect: (systemType !== 1) },
        boy: { name: boy, x: targetX + 1, y: targetY + 1, isCorrect: false },
        eq1Disp: `y = ${m1}x ${b1 >= 0 ? '+ ' + b1 : '- ' + Math.abs(b1)}`,
        eq2Disp: `y = ${m2}x ${b2 >= 0 ? '+ ' + b2 : '- ' + Math.abs(b2)}`
    };

    renderLinearUI();
};

function renderLinearUI() {
    const qContent = document.getElementById('q-content');
    document.getElementById('q-title').innerText = "System Analysis";

    let html = `
        <div style="background:#f1f5f9; padding:15px; border-radius:12px; margin-bottom:15px; border: 1px solid #cbd5e1; text-align:center;">
            <p style="font-family:monospace; font-size:1.2rem; margin:0;">
                Line A: <strong>${currentSystem.eq1Disp}</strong><br>
                Line B: <strong>${currentSystem.eq2Disp}</strong>
            </p>
        </div>
        <div id="linear-feedback" style="display:none; padding:10px; border-radius:8px; margin-bottom:10px; text-align:center; font-weight:bold;"></div>`;

    if (linearStep === 1) {
        html += `<p><strong>Step 1:</strong> ${currentSystem.girl.name} thinks (${currentSystem.girl.x}, ${currentSystem.girl.y}) is a solution. Is she correct?</p>
                 <button class="primary-btn" style="background:#4CBB17; color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer;" onclick="checkPeer(true, 'girl')">Yes</button>
                 <button class="secondary-btn" style="background:#64748b; color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer;" onclick="checkPeer(false, 'girl')">No</button>`;
    } else if (linearStep === 2) {
        html += `<p><strong>Step 2:</strong> How many solutions does this system have?</p>
                 <div style="display:grid; gap:8px;">
                    <button class="primary-btn" onclick="checkSolutionCount(1)">Exactly One</button>
                    <button class="primary-btn" onclick="checkSolutionCount(0)">No Solution (Parallel)</button>
                    <button class="primary-btn" onclick="checkSolutionCount(Infinity)">Infinite Solutions</button>
                 </div>`;
    } else {
        html += `<p><strong>Final Step:</strong> Graph Line A (Blue) then Line B (Red).</p>
                 <canvas id="systemCanvas" width="300" height="300" style="background:white; border:2px solid #cbd5e1; display:block; margin:0 auto; cursor:crosshair;"></canvas>
                 <div id="graph-status" style="margin-top:10px; color:#3b82f6; font-weight:bold; text-align:center;">Line A: Plot Point 1</div>`;
    }

    qContent.innerHTML = html;
    if (linearStep === 3) initCanvas();
}

window.showLinearFeedback = function(msg, isCorrect) {
    const fb = document.getElementById('linear-feedback');
    fb.style.display = "block";
    fb.style.background = isCorrect ? "#dcfce7" : "#fee2e2";
    fb.style.color = isCorrect ? "#166534" : "#991b1b";
    fb.innerText = msg;
};

window.checkPeer = function(choice, peerKey) {
    if (choice === currentSystem[peerKey].isCorrect) {
        showLinearFeedback("Correct! They checked the equations.", true);
        setTimeout(() => { linearStep++; renderLinearUI(); }, 1000);
    } else {
        linearErrorCount++;
        showLinearFeedback("Not quite. Plug the x and y into both lines!", false);
    }
};

window.checkSolutionCount = function(count) {
    if (count === currentSystem.correctCount) {
        showLinearFeedback("Correct! Look at those slopes and intercepts.", true);
        setTimeout(() => { linearStep = 3; renderLinearUI(); }, 1000);
    } else {
        linearErrorCount++;
        showLinearFeedback("Check the slopes. If they are the same, it's 0 or infinite!", false);
    }
};

function initCanvas() {
    const canvas = document.getElementById('systemCanvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const step = 30;

    function drawGrid() {
        ctx.clearRect(0,0,300,300);
        ctx.strokeStyle = "#e2e8f0";
        for(let i=0; i<=300; i+=step) {
            ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,300); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(300,i); ctx.stroke();
        }
        ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(150,0); ctx.lineTo(150,300); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,150); ctx.lineTo(300,150); ctx.stroke();
    }

    drawGrid();

    canvas.onclick = function(e) {
        const rect = canvas.getBoundingClientRect();
        const x = Math.round((e.clientX - rect.left - 150) / step);
        const y = Math.round((150 - (e.clientY - rect.top)) / step);
        
        userPoints.push({x, y});
        ctx.fillStyle = userPoints.length <= 2 ? "#3b82f6" : "#ef4444";
        ctx.beginPath(); ctx.arc(150 + x*step, 150 - y*step, 5, 0, Math.PI*2); ctx.fill();

        const status = document.getElementById('graph-status');
        const msgs = ["Line A: Pt 1", "Line A: Pt 2", "Line B: Pt 1", "Line B: Pt 2", "Done!"];
        if(status) status.innerText = msgs[userPoints.length] || "Done!";

        if (userPoints.length === 2) validateLine(1);
        if (userPoints.length === 4) validateLine(2);
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
            ctx.moveTo(150 + (p1.x-10)*step, 150 - (p1.y + um*(p1.x-10 - p1.x))*step);
            ctx.lineTo(150 + (p1.x+10)*step, 150 - (p1.y + um*(p1.x+10 - p1.x))*step);
            ctx.stroke();
            if (num === 2) finalize();
        } else {
            linearErrorCount++;
            showLinearFeedback("Line " + (num===1?"A":"B") + " is wrong. Check slope/intercept!", false);
            userPoints = num === 1 ? [] : [userPoints[0], userPoints[1]];
            setTimeout(drawGrid, 1000);
        }
    }
}

async function finalize() {
    const score = Math.max(1, 10 - linearErrorCount);
    showLinearFeedback("System Decoded! Mastery + " + score, true);
    
    if (window.supabaseClient) {
        await window.supabaseClient.from('assignment').update({ LinearSystem: score }).eq('userName', window.currentUser);
    }
    
    setTimeout(() => {
        if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion();
    }, 1500);
}
