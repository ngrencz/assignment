var linearErrorCount = 0;
var currentStep = 1; 
var currentSystem = {};
var userPoints = [];
var step1Point = {}; 
var step2Point = {}; 

window.initLinearSystemGame = async function() {
    window.isCurrentQActive = true;
    window.currentQSeconds = 0;
    linearErrorCount = 0;
    currentStep = 1;
    userPoints = [];

    // --- 1. GENERATE THE SYSTEM ---
    const type = Math.floor(Math.random() * 3); // 0: One Sol, 1: None (Parallel), 2: Infinite
    
    // Generate valid integer solution (tx, ty)
    const tx = Math.floor(Math.random() * 11) - 5; 
    const ty = Math.floor(Math.random() * 11) - 5;

    const slopes = [-3, -2, -1, 1, 2, 3];
    const m1 = slopes[Math.floor(Math.random() * slopes.length)];
    const b1 = ty - (m1 * tx); 

    let m2, b2, correctCount;

    if (type === 0) { 
        // One Solution
        do { m2 = slopes[Math.floor(Math.random() * slopes.length)]; } while (m1 === m2);
        b2 = ty - (m2 * tx);
        correctCount = 1;
    } else if (type === 1) { 
        // No Solution (Parallel)
        m2 = m1;
        b2 = b1 + (Math.random() > 0.5 ? 4 : -4); 
        correctCount = 0;
    } else { 
        // Infinite Solutions (Same Line)
        m2 = m1;
        b2 = b1;
        correctCount = Infinity;
    }

    // --- 2. GENERATE DISPLAY STRINGS ---
    let eq1Obj = generateEquationDisplay(m1, b1);
    let eq2Obj = generateEquationDisplay(m2, b2);

    // Prevent identical strings for Infinite Solutions (e.g. don't show "y=x+1" twice)
    let safety = 0;
    while (eq1Obj.text === eq2Obj.text && safety < 20) {
        eq2Obj = generateEquationDisplay(m2, b2);
        safety++;
    }

    // --- 3. GENERATE TEST POINTS ---
    const truePoint = { x: tx, y: ty };
    const pool = [
        truePoint, truePoint, 
        { x: tx + 1, y: ty }, 
        { x: tx, y: ty + 1 }, 
        { x: tx + 2, y: ty - 2 },
        { x: 0, y: 0 }
    ];

    // Select random test points
    step1Point = pool[Math.floor(Math.random() * pool.length)];
    do {
        step2Point = pool[Math.floor(Math.random() * pool.length)];
    } while (step1Point.x === step2Point.x && step1Point.y === step2Point.y);

    // --- 4. STORE STATE ---
    currentSystem = {
        m1, b1, m2, b2, 
        tx, ty, 
        correctCount,
        eq1Disp: eq1Obj.text,
        eq2Disp: eq2Obj.text,
        s1: `y = ${m1}x ${b1 >= 0 ? '+ ' + b1 : '- ' + Math.abs(b1)}`,
        s2: `y = ${m2}x ${b2 >= 0 ? '+ ' + b2 : '- ' + Math.abs(b2)}`
    };

    renderLinearUI();
};

function generateEquationDisplay(m, b) {
    const isStandard = Math.random() > 0.5; 

    if (!isStandard) {
        // Slope Intercept Form
        let mPart = (m === 1) ? "x" : (m === -1) ? "-x" : `${m}x`;
        let bPart = (b === 0) ? "" : (b > 0 ? ` + ${b}` : ` - ${Math.abs(b)}`);
        return { text: `y = ${mPart}${bPart}` };
    } else {
        // Standard Form: Ax + By = C
        let A = m;
        let B = -1;
        let C = -b;

        // Multiply by 1, 2, or 3
        let mult = Math.floor(Math.random() * 3) + 1; 
        A *= mult; B *= mult; C *= mult;

        let A_str = (A === 1) ? "x" : (A === -1) ? "-x" : `${A}x`;
        if (A === 0) A_str = ""; 

        let B_str = (B < 0) ? ` - ${Math.abs(B)}y` : ` + ${B}y`;
        if (Math.abs(B) === 1) B_str = (B < 0 ? " - y" : " + y");

        return { text: `${A_str}${B_str} = ${C}` };
    }
}

function renderLinearUI() {
    const qContent = document.getElementById('q-content');
    if (!qContent) return;
    document.getElementById('q-title').innerText = "System Analysis";

    // Determine which equation to highlight during graphing
    const plottingEq1 = (currentStep === 4 && userPoints.length < 2);
    const plottingEq2 = (currentStep === 4 && userPoints.length >= 2);

    const style1 = plottingEq1 ? "color:#2563eb; font-weight:900; background:#dbeafe; padding:2px 8px; border-radius:4px;" : "color:#334155;";
    const style2 = plottingEq2 ? "color:#2563eb; font-weight:900; background:#dbeafe; padding:2px 8px; border-radius:4px;" : "color:#334155;";

    let html = `
        <div style="background:#f8fafc; padding:20px; border-radius:12px; margin-bottom:15px; border: 1px solid #e2e8f0; text-align:center;">
            <p style="font-family:monospace; font-size:1.4rem; margin:0; line-height:2;">
                <span style="${style1}">Eq 1: ${currentSystem.eq1Disp}</span><br>
                <span style="${style2}">Eq 2: ${currentSystem.eq2Disp}</span>
            </p>
        </div>`;

    if (currentStep < 4) {
        // ... (Same Step 1-3 Logic) ...
        let questionText = "";
        let pointToTest = (currentStep === 1) ? step1Point : step2Point;
        
        if (currentStep < 3) questionText = `Is (${pointToTest.x}, ${pointToTest.y}) a solution to BOTH?`;
        else questionText = "How many solutions exist?";

        html += `<p style="text-align:center; font-weight:bold; font-size:1.1rem; margin-bottom:15px;">${questionText}</p>
                 <div style="display:flex; justify-content:center; gap:15px; margin-bottom:20px;">`;
        
        if (currentStep < 3) {
            html += `<button class="primary-btn" onclick="handleStep(true)" style="min-width:80px;">Yes</button>
                     <button class="secondary-btn" onclick="handleStep(false)" style="min-width:80px;">No</button>`;
        } else {
            html += `<button class="primary-btn" onclick="handleCount(1)">One</button>
                     <button class="primary-btn" onclick="handleCount(0)">None</button>
                     <button class="primary-btn" onclick="handleCount(Infinity)">Infinite</button>`;
        }
        html += `</div>`;
    } else {
        html += `<div style="text-align:center; margin-bottom:5px; font-size:0.85rem; color:#64748b;">Hint: ${currentSystem.s1} | ${currentSystem.s2}</div>
                 <div style="position:relative; width:360px; margin:0 auto; background:white;">
                    <div id="coord-hover" style="position:absolute; top:5px; right:5px; background:rgba(255,255,255,0.9); padding:4px 8px; border:1px solid #333; border-radius:4px; font-family:monospace; font-weight:bold; z-index:100; pointer-events: none; opacity:0; transition:opacity 0.2s;">(0, 0)</div>
                    <canvas id="systemCanvas" width="360" height="360" style="border:2px solid #333; display:block; cursor:crosshair;"></canvas>
                 </div>
                 <div id="graph-status" style="text-align:center; color:#3b82f6; font-weight:bold; margin-top:8px;">
                    ${plottingEq1 ? "Graph Line 1" : "Graph Line 2"}
                 </div>`;
    }

    qContent.innerHTML = html;
    if (currentStep === 4) initCanvas();
}

// ... (handleStep and handleCount are unchanged) ...
window.handleStep = function(userSaidYes) {
    const p = (currentStep === 1) ? step1Point : step2Point;
    const val1 = (currentSystem.m1 * p.x) + currentSystem.b1;
    const val2 = (currentSystem.m2 * p.x) + currentSystem.b2;
    const works = (Math.abs(p.y - val1) < 0.001) && (Math.abs(p.y - val2) < 0.001);

    if (userSaidYes === works) { currentStep++; renderLinearUI(); } 
    else { linearErrorCount++; alert("Incorrect."); }
};

window.handleCount = function(val) {
    if (val === currentSystem.correctCount) { currentStep = 4; renderLinearUI(); }
    else { linearErrorCount++; alert("Check the slopes!"); }
};

function initCanvas() {
    const canvas = document.getElementById('systemCanvas');
    const hover = document.getElementById('coord-hover');
    const ctx = canvas.getContext('2d');
    const size = 360, gridMax = 10, step = size / (gridMax * 2);

    function drawGrid() {
        ctx.clearRect(0,0,size,size);
        ctx.strokeStyle = "#e5e7eb"; ctx.lineWidth = 1;
        ctx.font = "10px sans-serif"; ctx.fillStyle = "#94a3b8"; ctx.textAlign = "center";
        
        for(let i=-gridMax; i<=gridMax; i++) {
            let pos = size/2 + i*step;
            ctx.beginPath(); ctx.moveTo(pos, 0); ctx.lineTo(pos, size); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, pos); ctx.lineTo(size, pos); ctx.stroke();
            if(i !== 0) {
                ctx.fillText(i, pos, size/2 + 15);
                ctx.fillText(-i, size/2 - 15, pos + 4);
            }
        }
        ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(size/2, 0); ctx.lineTo(size/2, size); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, size/2); ctx.lineTo(size, size/2); ctx.stroke();
        
        userPoints.forEach((p, idx) => {
            ctx.fillStyle = idx < 2 ? "#2563eb" : "#dc2626"; // Blue for L1, Red for L2
            ctx.beginPath(); ctx.arc(size/2 + p.x*step, size/2 - p.y*step, 5, 0, Math.PI * 2); ctx.fill();
        });

        if (userPoints.length >= 2) renderLine(userPoints[0], userPoints[1], "#2563eb");
        if (userPoints.length === 4) renderLine(userPoints[2], userPoints[3], "#dc2626");
    }

    function renderLine(p1, p2, color) {
        if (p1.x === p2.x) { 
             ctx.strokeStyle = color; ctx.lineWidth = 3;
             ctx.beginPath(); ctx.moveTo(size/2 + p1.x*step, 0); ctx.lineTo(size/2 + p1.x*step, size); ctx.stroke();
             return;
        }
        const m = (p2.y - p1.y) / (p2.x - p1.x);
        ctx.strokeStyle = color; ctx.lineWidth = 3;
        ctx.beginPath();
        // Draw across full width
        ctx.moveTo(size/2 + (-15)*step, size/2 - (p1.y + m*(-15 - p1.x))*step);
        ctx.lineTo(size/2 + (15)*step, size/2 - (p1.y + m*(15 - p1.x))*step);
        ctx.stroke();
    }

    canvas.onmousemove = function(e) {
        const rect = canvas.getBoundingClientRect();
        const gx = Math.round((e.clientX - rect.left - size/2) / step);
        const gy = Math.round((size/2 - (e.clientY - rect.top)) / step);
        if(hover) {
            hover.style.opacity = 1;
            hover.innerText = `(${gx}, ${gy})`;
        }
    };

    canvas.onmouseleave = function() {
        if(hover) hover.style.opacity = 0;
    };

    canvas.onclick = function(e) {
        if (userPoints.length >= 4) return;
        const rect = canvas.getBoundingClientRect();
        
        // Use rect calculation for robust coordinate mapping
        const rawX = e.clientX - rect.left;
        const rawY = e.clientY - rect.top;
        
        const gx = Math.round((rawX - size/2) / step);
        const gy = Math.round((size/2 - rawY) / step);
        
        // Prevent duplicate points (clicking same spot twice)
        if (userPoints.length > 0) {
            const last = userPoints[userPoints.length - 1];
            if (last.x === gx && last.y === gy) return;
        }

        userPoints.push({x: gx, y: gy});
        drawGrid();

        if (userPoints.length === 2) {
            if (validate(1)) {
                renderLinearUI(); // Updates highlight to Eq 2
            } else {
                linearErrorCount++; 
                alert("Incorrect. That point is not on Eq 1."); 
                userPoints = []; // Reset Line 1
                drawGrid();
            }
        } else if (userPoints.length === 4) {
            if (validate(2)) {
                finishGame(); 
            } else {
                linearErrorCount++; 
                alert("Incorrect. That point is not on Eq 2."); 
                userPoints = [userPoints[0], userPoints[1]]; // Keep Line 1, Reset Line 2
                drawGrid();
            }
        }
    };

    function validate(n) {
        const p1 = userPoints[n===1?0:2], p2 = userPoints[n===1?1:3];
        const m = n===1?currentSystem.m1:currentSystem.m2;
        const b = n===1?currentSystem.b1:currentSystem.b2;
        
        if (p1.x === p2.x && p1.y === p2.y) return false; 
        
        // Strict Check: y = mx + b
        // Allow tiny float tolerance (0.01) but inputs are integers
        const check1 = Math.abs(p1.y - (m * p1.x + b)) < 0.01;
        const check2 = Math.abs(p2.y - (m * p2.x + b)) < 0.01;
        
        return (check1 && check2);
    }

    drawGrid();
}

async function finishGame() {
    // 1. STOP the timer immediately
    window.isCurrentQActive = false;

    // 2. Clear the UI so they know it's done (Consistent with SolveX)
    document.getElementById('q-content').innerHTML = `
        <div style="text-align:center; padding:50px; animation: fadeIn 0.5s;">
            <div style="font-size: 50px; margin-bottom: 20px;">📈</div>
            <h2 style="color: var(--black);">System Analyzed!</h2>
            <p style="color: var(--gray-text);">Graphing and Analysis Complete.</p>
            <p style="font-size: 0.9rem; color: var(--kelly-green); margin-top: 10px;">Loading next activity...</p>
        </div>
    `;

    // 3. Calculate Score Adjustment
    let adjustment = 0;
    if (linearErrorCount === 0) adjustment = 1;
    else if (linearErrorCount >= 2) adjustment = -1;

    // 4. Update Database
    if (window.supabaseClient && window.currentUser && adjustment !== 0) {
        try {
            const { data } = await window.supabaseClient
                .from('assignment')
                .select('LinearSystem')
                .eq('userName', window.currentUser)
                .maybeSingle();

            let currentScore = data ? (data.LinearSystem || 0) : 0;
            let newScore = Math.max(0, Math.min(10, currentScore + adjustment));

            await window.supabaseClient
                .from('assignment')
                .update({ LinearSystem: newScore })
                .eq('userName', window.currentUser);
                
        } catch(e) {
            console.error("Score update failed:", e);
        }
    }

    // 5. Hand over to Hub
    setTimeout(() => { 
        if (typeof window.loadNextQuestion === 'function') {
            window.loadNextQuestion(); 
        } else {
            location.reload();
        }
    }, 2000); // Give them 2 seconds to see the success message
}
