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

    // --- BETTER RANDOMIZATION ENGINE ---
    // 0 = One, 1 = None, 2 = Infinite
    const systemType = Math.floor(Math.random() * 3);
    
    // Wider range for variety: -5 to 5
    const tx = Math.floor(Math.random() * 11) - 5; 
    const ty = Math.floor(Math.random() * 11) - 5; 
    
    const possibleSlopes = [-4, -3, -2, -1, 1, 2, 3, 4];
    let m1 = possibleSlopes[Math.floor(Math.random() * possibleSlopes.length)];
    let b1 = ty - (m1 * tx);
    
    let m2, b2, correctCount;

    if (systemType === 0) { // One Solution
        do { m2 = possibleSlopes[Math.floor(Math.random() * possibleSlopes.length)]; } while (m1 === m2);
        b2 = ty - (m2 * tx);
        correctCount = 1;
    } else if (systemType === 1) { // No Solution
        m2 = m1;
        b2 = b1 + (Math.random() > 0.5 ? 2 : -2);
        correctCount = 0;
    } else { // Infinite
        m2 = m1;
        b2 = b1;
        correctCount = Infinity;
    }

    // --- THE "NO 1x" FORMATTING LOGIC ---
    const formatLine = (m, b) => {
        let mPart = "";
        if (m === 1) mPart = "x";
        else if (m === -1) mPart = "-x";
        else mPart = m + "x";

        if (b === 0) return "y = " + mPart;
        let bPart = b > 0 ? " + " + b : " - " + Math.abs(b);
        return "y = " + mPart + bPart;
    };

    const femaleNames = ["Maya", "Sarah", "Elena", "Chloe", "Amara", "Jasmine"];
    const maleNames = ["Liam", "Noah", "Caleb", "Ethan", "Leo", "Isaac"];

    currentSystem = {
        m1, b1, m2, b2,
        targetX: tx, targetY: ty,
        correctCount: correctCount,
        girl: { name: femaleNames[Math.floor(Math.random() * 6)], x: tx, y: ty, isCorrect: (systemType !== 1) },
        boy: { name: maleNames[Math.floor(Math.random() * 6)], x: tx + 1, y: ty - 1, isCorrect: (systemType === 2) },
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
                1: <strong>${currentSystem.eq1Disp}</strong><br>
                2: <strong>${currentSystem.eq2Disp}</strong>
            </p>
        </div>`;

    if (currentStep === 1) {
        html += `<p>Step 1: ${currentSystem.girl.name} thinks the solution is (${currentSystem.girl.x}, ${currentSystem.girl.y}). Correct?</p>
            <button class="primary-btn" onclick="checkPeer(true, 'girl')">Yes</button>
            <button class="secondary-btn" onclick="checkPeer(false, 'girl')">No</button>`;
    } else if (currentStep === 2) {
        html += `<p>Step 2: ${currentSystem.boy.name} thinks the solution is (${currentSystem.boy.x}, ${currentSystem.boy.y}). Correct?</p>
            <button class="primary-btn" onclick="checkPeer(true, 'boy')">Yes</button>
            <button class="secondary-btn" onclick="checkPeer(false, 'boy')">No</button>`;
    } else if (currentStep === 3) {
        html += `<p>Step 3: How many solutions does this system have?</p>
            <div style="display: flex; flex-direction: column; gap: 5px;">
                <button class="primary-btn" onclick="checkSolutionCount(1)">Exactly One</button>
                <button class="primary-btn" onclick="checkSolutionCount(0)">Zero (Parallel)</button>
                <button class="primary-btn" onclick="checkSolutionCount(Infinity)">Infinite (Same Line)</button>
            </div>`;
    } else {
        html += `<p>Step 4: Graph the lines. Click twice for each line.</p>
            <canvas id="systemCanvas" width="300" height="300" style="background:white; border:1px solid #ccc; cursor:crosshair;"></canvas>
            <div id="graph-status" style="margin-top:5px; color:#3b82f6; font-weight:bold;">Line 1: Plot Point 1</div>`;
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
        alert("Incorrect check. Verify the coordinates in both equations!");
    }
};

window.checkSolutionCount = function(count) {
    if (count === currentSystem.correctCount) {
        currentStep = 4;
        renderLinearUI();
    } else {
        linearErrorCount++;
        alert("Check your slopes! If slopes are equal, it's either 0 or Infinite.");
    }
};

// --- CANVAS & FINALIZE (Standard Long Version) ---

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
        ctx.strokeStyle = "#000";
        ctx.beginPath(); ctx.moveTo(150,0); ctx.lineTo(150,300); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,150); ctx.lineTo(300,150); ctx.stroke();
    }
    drawGrid();

    canvas.onclick = function(e) {
        const rect = canvas.getBoundingClientRect();
        const x = Math.round((e.clientX - rect.left - 150) / step);
        const y = Math.round((150 - (e.clientY - rect.top)) / step);
        
        userPoints.push({x, y});
        ctx.fillStyle = userPoints.length <= 2 ? "blue" : "red";
        ctx.beginPath(); ctx.arc(150 + x*step, 150 - y*step, 5, 0, 7); ctx.fill();

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
            ctx.strokeStyle = num === 1 ? "blue" : "red";
            ctx.beginPath();
            ctx.moveTo(150 + (p1.x-10)*step, 150 - (p1.y + um*(p1.x-10 - p1.x))*step);
            ctx.lineTo(150 + (p1.x+10)*step, 150 - (p1.y + um*(p1.x+10 - p1.x))*step);
            ctx.stroke();
            if (num === 2) finalize();
        } else {
            linearErrorCount++;
            alert("Incorrect line. Check your slope and intercept.");
            userPoints = num === 1 ? [] : [userPoints[0], userPoints[1]];
            drawGrid();
        }
    }
}

async function finalize() {
    const sessionScore = Math.max(1, 10 - linearErrorCount);
    
    // Fetch and Increment Mastery (Gradual)
    const { data } = await window.supabaseClient.from('assignment').select('LinearSystem').eq('userName', window.currentUser).single();
    const currentM = data?.LinearSystem || 0;
    const newM = Math.min(10, currentM + (sessionScore / 5));

    await window.supabaseClient.from('assignment').update({ LinearSystem: newM }).eq('userName', window.currentUser);
    
    if (typeof window.loadNextQuestion === 'function') {
        window.loadNextQuestion();
    }
}
