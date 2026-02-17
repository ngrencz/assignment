var linearErrorCount = 0;
var currentStep = 1; 
var currentSystem = {};
var userPoints = [];

window.initLinearSystemGame = async function() {
    window.isCurrentQActive = true;
    window.currentQSeconds = 0;
    linearErrorCount = 0;
    currentStep = 1;
    userPoints = [];

    // 0 = One, 1 = None, 2 = Infinite
    const systemType = Math.floor(Math.random() * 3);
    
    // --- CONSTRAINED RANDOMIZER ---
    // We limit slopes and intercepts so lines ALWAYS fit on a 10x10 grid
    const possibleSlopes = [-2, -1, 1, 2]; 
    let m1 = possibleSlopes[Math.floor(Math.random() * possibleSlopes.length)];
    
    // Ensure b is between -4 and 4 so it's clearly visible
    let b1 = Math.floor(Math.random() * 9) - 4; 
    
    let m2, b2, correctCount;

    if (systemType === 0) { // One Solution
        do { m2 = possibleSlopes[Math.floor(Math.random() * possibleSlopes.length)]; } while (m1 === m2);
        // Calculate b2 so it intersects at an integer point within the grid
        let tx = Math.floor(Math.random() * 7) - 3; 
        let ty = m1 * tx + b1;
        b2 = ty - (m2 * tx);
        correctCount = 1;
    } else if (systemType === 1) { // No Solution
        m2 = m1;
        b2 = b1 + (b1 > 0 ? -3 : 3); // Shift intercept significantly
        correctCount = 0;
    } else { // Infinite
        m2 = m1;
        b2 = b1;
        correctCount = Infinity;
    }

    const formatLine = (m, b) => {
        let mPart = (m === 1) ? "x" : (m === -1) ? "-x" : m + "x";
        if (b === 0) return "y = " + mPart;
        return `y = ${mPart} ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)}`;
    };

    currentSystem = {
        m1, b1, m2, b2,
        correctCount: correctCount,
        girl: { name: "Elena", x: 0, y: b1, isCorrect: true }, // Simple y-intercept check
        boy: { name: "Liam", x: 1, y: m1 + b1 + 1, isCorrect: (systemType === 2) },
        eq1Disp: formatLine(m1, b1),
        eq2Disp: formatLine(m2, b2)
    };

    renderLinearUI();
};

function renderLinearUI() {
    const qContent = document.getElementById('q-content');
    document.getElementById('q-title').innerText = "System Analysis";

    let html = `
        <div style="background:#f8fafc; padding:15px; border-radius:12px; margin-bottom:15px; border: 1px solid #e2e8f0; text-align:center;">
            <p style="font-family:monospace; font-size:1.2rem; margin:0;">
                Line 1: <strong>${currentSystem.eq1Disp}</strong><br>
                Line 2: <strong>${currentSystem.eq2Disp}</strong>
            </p>
        </div>`;

    if (currentStep === 1) {
        html += `<p>Step 1: Elena thinks (0, ${currentSystem.b1}) is a solution. Correct?</p>
            <button class="primary-btn" onclick="checkPeer(true, 'girl')">Yes</button>
            <button class="secondary-btn" onclick="checkPeer(false, 'girl')">No</button>`;
    } else if (currentStep === 2) {
        html += `<p>Step 2: Liam thinks (1, ${currentSystem.m1 + currentSystem.b1 + 1}) is a solution. Correct?</p>
            <button class="primary-btn" onclick="checkPeer(true, 'boy')">Yes</button>
            <button class="secondary-btn" onclick="checkPeer(false, 'boy')">No</button>`;
    } else if (currentStep === 3) {
        html += `<p>Step 3: How many solutions?</p>
            <button class="primary-btn" onclick="checkSolutionCount(1)">One</button>
            <button class="primary-btn" onclick="checkSolutionCount(0)">None</button>
            <button class="primary-btn" onclick="checkSolutionCount(Infinity)">Infinite</button>`;
    } else {
        html += `<p>Step 4: Graph both lines.</p>
            <canvas id="systemCanvas" width="300" height="300" style="background:white; border:1px solid #333; cursor:crosshair; display:block; margin:0 auto;"></canvas>
            <div id="graph-status" style="margin-top:5px; text-align:center; color:#3b82f6; font-weight:bold;">Line 1: Plot Point 1</div>`;
    }

    qContent.innerHTML = html;
    if (currentStep === 4) initCanvas();
}

window.checkPeer = function(choice, peerKey) {
    if (choice === currentSystem[peerKey].isCorrect) {
        currentStep++;
        renderLinearUI();
    } else {
        linearErrorCount++;
        alert("Check the math! Plug the x into the equation.");
    }
};

window.checkSolutionCount = function(count) {
    if (count === currentSystem.correctCount) {
        currentStep = 4;
        renderLinearUI();
    } else {
        linearErrorCount++;
        alert("Look at the slopes!");
    }
};

function initCanvas() {
    const canvas = document.getElementById('systemCanvas');
    const ctx = canvas.getContext('2d');
    const step = 30;

    function drawGrid() {
        ctx.clearRect(0,0,300,300);
        ctx.strokeStyle = "#eee";
        for(let i=0; i<=300; i+=step) {
            ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,300); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(300,i); ctx.stroke();
        }
        ctx.strokeStyle = "#000"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(150,0); ctx.lineTo(150,300); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,150); ctx.lineTo(300,150); ctx.stroke();
        
        // --- REDRAW PERSISTENT LINE 1 ---
        if (userPoints.length >= 2) {
            renderStoredLine(userPoints[0], userPoints[1], "blue");
        }
    }

    function renderStoredLine(p1, p2, color) {
        const um = (p2.y - p1.y) / (p2.x - p1.x);
        ctx.strokeStyle = color; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(150 + (p1.x-10)*step, 150 - (p1.y + um*(p1.x-10 - p1.x))*step);
        ctx.lineTo(150 + (p1.x+10)*step, 150 - (p1.y + um*(p1.x+10 - p1.x))*step);
        ctx.stroke();
        // Dots
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(150+p1.x*step, 150-p1.y*step, 5, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(150+p2.x*step, 150-p2.y*step, 5, 0, 7); ctx.fill();
    }

    drawGrid();

    canvas.onclick = function(e) {
        const rect = canvas.getBoundingClientRect();
        const gx = Math.round((e.clientX - rect.left - 150) / step);
        const gy = Math.round((150 - (e.clientY - rect.top)) / step);
        
        userPoints.push({x: gx, y: gy});
        
        // Temporary dot for current action
        ctx.fillStyle = userPoints.length <= 2 ? "blue" : "red";
        ctx.beginPath(); ctx.arc(150 + gx*step, 150 - gy*step, 5, 0, 7); ctx.fill();

        if (userPoints.length === 2) validateLine(1);
        if (userPoints.length === 4) validateLine(2);
        
        const status = document.getElementById('graph-status');
        const msgs = ["Line 1: Pt 1", "Line 1: Pt 2", "Line 2: Pt 1", "Line 2: Pt 2", "Success!"];
        if(status) status.innerText = msgs[userPoints.length] || "Success!";
    };

    function validateLine(num) {
        const p1 = userPoints[num === 1 ? 0 : 2];
        const p2 = userPoints[num === 1 ? 1 : 3];
        const m = num === 1 ? currentSystem.m1 : currentSystem.m2;
        const b = num === 1 ? currentSystem.b1 : currentSystem.b2;
        
        const um = (p2.y - p1.y) / (p2.x - p1.x);
        const ub = p1.y - (um * p1.x);

        if (um === m && Math.abs(ub - b) < 0.1) {
            drawGrid(); // This will now persistently draw Line 1
            if (num === 2) finalize();
        } else {
            linearErrorCount++;
            alert("Line " + num + " is incorrect. Check your slope and intercept.");
            // If line 2 fails, keep points 0 and 1 (Line 1) but clear points 2 and 3
            userPoints = (num === 1) ? [] : [userPoints[0], userPoints[1]];
            drawGrid();
        }
    }
}

async function finalize() {
    const sessionScore = Math.max(1, 10 - linearErrorCount);
    const { data } = await window.supabaseClient.from('assignment').select('LinearSystem').eq('userName', window.currentUser).single();
    const currentM = data?.LinearSystem || 0;
    await window.supabaseClient.from('assignment').update({ LinearSystem: Math.min(10, currentM + (sessionScore / 5)) }).eq('userName', window.currentUser);
    if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion();
}
