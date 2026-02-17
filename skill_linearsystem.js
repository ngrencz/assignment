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
    
    // 2. Expanded Range: -8 to 8 for more variety
    const tx = Math.floor(Math.random() * 17) - 8;
    const ty = Math.floor(Math.random() * 17) - 8;

    // 3. Slopes from -4 to 4 (excluding 0)
    const slopes = [-4, -3, -2, -1, 1, 2, 3, 4];
    const m1 = slopes[Math.floor(Math.random() * slopes.length)];
    const b1 = ty - (m1 * tx);

    let m2, b2, correctCount;

    if (type === 0) { // ONE SOLUTION
        do { m2 = slopes[Math.floor(Math.random() * slopes.length)]; } while (m1 === m2);
        b2 = ty - (m2 * tx);
        correctCount = 1;
    } else if (type === 1) { // NO SOLUTION
        m2 = m1;
        b2 = b1 + (b1 > 0 ? -4 : 4);
        correctCount = 0;
    } else { // INFINITE
        m2 = m1;
        b2 = b1;
        correctCount = Infinity;
    }

    // 4. EQUATION FORMATTER (Handles Coefficients for Simplification)
    const formatComplex = (m, b, isSecond) => {
        // Randomly apply a multiplier (2, 3, or 5) to the whole equation for variety
        const coeff = (type === 2 && isSecond) ? [2, 3, 5][Math.floor(Math.random()*3)] : 1;
        
        let leftSide = coeff === 1 ? "y" : `${coeff}y`;
        let mVal = m * coeff;
        let bVal = b * coeff;

        let mPart = (mVal === 1) ? "x" : (mVal === -1) ? "-x" : mVal + "x";
        let bPart = bVal === 0 ? "" : (bVal > 0 ? " + " + bVal : " - " + Math.abs(bVal));
        
        return `${leftSide} = ${mPart}${bPart}`;
    };

    currentSystem = {
        m1, b1, m2, b2,
        tx, ty,
        correctCount,
        girl: { name: "Elena", x: tx, y: ty, isCorrect: (type !== 1) },
        boy: { name: "Liam", x: tx + 1, y: ty + 1, isCorrect: (type === 2) },
        eq1Disp: formatComplex(m1, b1, false),
        eq2Disp: formatComplex(m2, b2, true)
    };

    renderLinearUI();
};

function renderLinearUI() {
    const qContent = document.getElementById('q-content');
    document.getElementById('q-title').innerText = "System Analysis";

    let html = `
        <div style="background:#f1f5f9; padding:15px; border-radius:12px; margin-bottom:15px; border: 1px solid #cbd5e1; text-align:center;">
            <p style="font-family:monospace; font-size:1.2rem; margin:0; line-height:1.6;">
                Eq 1: <strong>${currentSystem.eq1Disp}</strong><br>
                Eq 2: <strong>${currentSystem.eq2Disp}</strong>
            </p>
        </div>`;

    if (currentStep === 1) {
        html += `<p>Step 1: Is (${currentSystem.girl.x}, ${currentSystem.girl.y}) a solution to both?</p>
            <button class="primary-btn" onclick="checkPeer(true, 'girl')">Yes</button>
            <button class="secondary-btn" onclick="checkPeer(false, 'girl')">No</button>`;
    } else if (currentStep === 2) {
        html += `<p>Step 2: Is (${currentSystem.boy.x}, ${currentSystem.boy.y}) a solution to both?</p>
            <button class="primary-btn" onclick="checkPeer(true, 'boy')">Yes</button>
            <button class="secondary-btn" onclick="checkPeer(false, 'boy')">No</button>`;
    } else if (currentStep === 3) {
        html += `<p>Step 3: Solution count?</p>
            <button class="primary-btn" onclick="checkSolutionCount(1)">One</button>
            <button class="primary-btn" onclick="checkSolutionCount(0)">None</button>
            <button class="primary-btn" onclick="checkSolutionCount(Infinity)">Infinite</button>`;
    } else {
        html += `<p>Step 4: Graph the simplified lines (y = mx + b).</p>
            <canvas id="systemCanvas" width="340" height="340" style="background:white; border:2px solid #333; display:block; margin:0 auto; cursor:crosshair;"></canvas>
            <div id="graph-status" style="text-align:center; color:#3b82f6; font-weight:bold; margin-top:8px;">Line 1: Plot Point 1</div>`;
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
        alert("Incorrect. Simplify the equations and plug in the values!");
    }
};

window.checkSolutionCount = function(val) {
    if (val === currentSystem.correctCount) {
        currentStep = 4;
        renderLinearUI();
    } else {
        linearErrorCount++;
        alert("Check the slopes of the simplified equations!");
    }
};

function initCanvas() {
    const canvas = document.getElementById('systemCanvas');
    const ctx = canvas.getContext('2d');
    const size = 340;
    const gridMax = 10; // -10 to 10
    const step = size / (gridMax * 2); // 17px per unit

    function drawGrid() {
        ctx.clearRect(0,0,size,size);
        ctx.strokeStyle = "#e5e7eb"; ctx.lineWidth = 1;
        for(let i=0; i<=size; i+=step) {
            ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,size); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(size,i); ctx.stroke();
        }
        ctx.strokeStyle = "#000"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(size/2, 0); ctx.lineTo(size/2, size); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, size/2); ctx.lineTo(size, size/2); ctx.stroke();
        
        if (userPoints.length >= 2) renderLine(userPoints[0], userPoints[1], "blue");
    }

    function renderLine(p1, p2, color) {
        const m = (p2.y - p1.y) / (p2.x - p1.x);
        ctx.strokeStyle = color; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(size/2 + (p1.x-20)*step, size/2 - (p1.y + m*(p1.x-20 - p1.x))*step);
        ctx.lineTo(size/2 + (p1.x+20)*step, size/2 - (p1.y + m*(p1.x+20 - p1.x))*step);
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(size/2 + p1.x*step, size/2 - p1.y*step, 4, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(size/2 + p2.x*step, size/2 - p2.y*step, 4, 0, 7); ctx.fill();
    }

    drawGrid();

    canvas.onclick = function(e) {
        const rect = canvas.getBoundingClientRect();
        const gx = Math.round((e.clientX - rect.left - size/2) / step);
        const gy = Math.round((size/2 - (e.clientY - rect.top)) / step);
        
        userPoints.push({x: gx, y: gy});
        
        ctx.fillStyle = userPoints.length <= 2 ? "blue" : "red";
        ctx.beginPath(); ctx.arc(size/2 + gx*step, size/2 - gy*step, 4, 0, 7); ctx.fill();

        if (userPoints.length === 2) {
            if (validate(1)) drawGrid();
            else { userPoints = []; drawGrid(); alert("Line 1 incorrect."); }
        }
        if (userPoints.length === 4) {
            if (validate(2)) finalize();
            else { userPoints = [userPoints[0], userPoints[1]]; drawGrid(); alert("Line 2 incorrect."); }
        }
        
        const status = document.getElementById('graph-status');
        const msgs = ["Line 1: Pt 1", "Line 1: Pt 2", "Line 2: Pt 1", "Line 2: Pt 2", "Checking..."];
        if(status) status.innerText = msgs[userPoints.length] || "";
    };

    function validate(n) {
        const p1 = userPoints[n===1?0:2]; const p2 = userPoints[n===1?1:3];
        const m = n===1?currentSystem.m1:currentSystem.m2;
        const b = n===1?currentSystem.b1:currentSystem.b2;
        const um = (p2.y-p1.y)/(p2.x-p1.x);
        const ub = p1.y - (um*p1.x);
        return (um === m && Math.abs(ub - b) < 0.1);
    }
}

async function finalize() {
    const pts = Math.max(1, 10 - linearErrorCount);
    if (window.supabaseClient) {
        const { data } = await window.supabaseClient.from('assignment').select('LinearSystem').eq('userName', window.currentUser).single();
        const cur = data?.LinearSystem || 0;
        await window.supabaseClient.from('assignment').update({ LinearSystem: Math.min(10, cur + (pts/5)) }).eq('userName', window.currentUser);
    }
    setTimeout(() => { if(window.loadNextQuestion) window.loadNextQuestion(); }, 1000);
}
