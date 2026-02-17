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

    // 1. Pick Type: 0=One, 1=None, 2=Infinite
    const type = Math.floor(Math.random() * 3);
    
    // 2. Target intersection point (always within -4 to 4)
    const tx = Math.floor(Math.random() * 9) - 4;
    const ty = Math.floor(Math.random() * 9) - 4;

    // 3. Generate Line 1
    const slopes = [-2, -1, 1, 2];
    const m1 = slopes[Math.floor(Math.random() * slopes.length)];
    const b1 = ty - (m1 * tx);

    let m2, b2, correctCount;

    if (type === 0) { // ONE SOLUTION
        do { m2 = slopes[Math.floor(Math.random() * slopes.length)]; } while (m1 === m2);
        b2 = ty - (m2 * tx);
        correctCount = 1;
    } else if (type === 1) { // NO SOLUTION
        m2 = m1;
        b2 = b1 + (b1 > 0 ? -3 : 3);
        correctCount = 0;
    } else { // INFINITE
        m2 = m1;
        b2 = b1;
        correctCount = Infinity;
    }

    // Formatting (No 1x)
    const formatLine = (m, b) => {
        let mPart = (m === 1) ? "x" : (m === -1) ? "-x" : m + "x";
        if (b === 0) return "y = " + mPart;
        return `y = ${mPart} ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)}`;
    };

    // PEER LOGIC: Physically verify if point works in BOTH equations
    const verify = (x, y) => {
        const check1 = (y === (m1 * x + b1));
        const check2 = (y === (m2 * x + b2));
        return check1 && check2;
    };

    const girlCoords = { x: tx, y: ty };
    const boyCoords = { x: tx + 1, y: ty + 1 };

    currentSystem = {
        m1, b1, m2, b2,
        correctCount,
        girl: { name: "Elena", x: girlCoords.x, y: girlCoords.y, isCorrect: verify(girlCoords.x, girlCoords.y) },
        boy: { name: "Liam", x: boyCoords.x, y: boyCoords.y, isCorrect: verify(boyCoords.x, boyCoords.y) },
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
        html += `<p>Step 1: ${currentSystem.girl.name} thinks (${currentSystem.girl.x}, ${currentSystem.girl.y}) is a solution. Correct?</p>
            <button class="primary-btn" onclick="checkPeer(true, 'girl')">Yes</button>
            <button class="secondary-btn" onclick="checkPeer(false, 'girl')">No</button>`;
    } else if (currentStep === 2) {
        html += `<p>Step 2: ${currentSystem.boy.name} thinks (${currentSystem.boy.x}, ${currentSystem.boy.y}) is a solution. Correct?</p>
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
        alert("Incorrect. To be a solution, it must work in BOTH equations!");
    }
};

window.checkSolutionCount = function(count) {
    if (count === currentSystem.correctCount) {
        currentStep = 4;
        renderLinearUI();
    } else {
        linearErrorCount++;
        alert("Check your slopes and intercepts!");
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
        
        if (userPoints.length >= 2) renderStoredLine(userPoints[0], userPoints[1], "blue");
    }

    function renderStoredLine(p1, p2, color) {
        const um = (p2.y - p1.y) / (p2.x - p1.x);
        ctx.strokeStyle = color; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(150 + (p1.x-10)*step, 150 - (p1.y + um*(p1.x-10 - p1.x))*step);
        ctx.lineTo(150 + (p1.x+10)*step, 150 - (p1.y + um*(p1.x+10 - p1.x))*step);
        ctx.stroke();
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
            drawGrid();
            if (num === 2) finalize();
        } else {
            linearErrorCount++;
            alert("Incorrect line.");
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
