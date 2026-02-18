/**
 * skill_linear_system.js
 * - Step 1 & 2: Verify if a specific point is a solution to the equations.
 * - Step 3: Determine number of solutions (One, None, Infinite).
 * - Step 4: Graph both lines to confirm.
 */

var linearSystemData = {
    step: 1,           // 1: Check Pt 1, 2: Check Pt 2, 3: Count Solutions, 4: Graph
    errors: 0,
    system: {},        // Stores m1, b1, m2, b2, target solutions
    userPoints: [],    // Points clicked by user for graphing
    testPoints: [],    // Points used in Steps 1 & 2
    scale: 18          // Grid scale (pixels per unit)
};

window.initLinearSystemGame = async function() {
    if (!document.getElementById('q-content')) return;

    // Reset State
    linearSystemData.step = 1;
    linearSystemData.errors = 0;
    linearSystemData.userPoints = [];
    linearSystemData.testPoints = [];

    // Initialize Mastery
    if (!window.userMastery) window.userMastery = {};

    // Sync initial score
    try {
        if (window.supabaseClient && window.currentUser) {
            const h = sessionStorage.getItem('target_hour') || "00";
            const { data } = await window.supabaseClient
                .from('assignment')
                .select('LinearSystem')
                .eq('userName', window.currentUser)
                .eq('hour', h)
                .maybeSingle();
            
            if (data) window.userMastery.LinearSystem = data.LinearSystem || 0;
        }
    } catch (e) { console.log("Sync error", e); }

    generateLinearSystem();
    renderLinearSystemUI();
};

function generateLinearSystem() {
    // 0: One Sol, 1: None (Parallel), 2: Infinite
    const type = Math.floor(Math.random() * 3); 
    
    // Generate valid integer intersection (tx, ty) for display/logic
    const tx = Math.floor(Math.random() * 9) - 4; // -4 to 4
    const ty = Math.floor(Math.random() * 9) - 4;

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
        do { b2 = Math.floor(Math.random() * 10) - 5; } while (b2 === b1);
        correctCount = 0;
    } else { 
        // Infinite Solutions (Same Line)
        m2 = m1;
        b2 = b1;
        correctCount = Infinity;
    }

    // Generate Display Strings (Standard vs Slope-Intercept)
    let eq1Obj = generateEquationDisplay(m1, b1);
    let eq2Obj = generateEquationDisplay(m2, b2);

    // If infinite, ensure we don't show the exact same string twice (unless unlucky)
    if (type === 2 && eq1Obj.text === eq2Obj.text) {
        // Force Standard form for one of them to look different
        eq2Obj = generateEquationDisplay(m2, b2, true);
    }

    // Generate Test Points for Steps 1 & 2
    const truePoint = { x: tx, y: ty };
    // A pool of points that might or might not work
    const pool = [
        truePoint, 
        { x: tx + 1, y: ty }, 
        { x: tx, y: ty + 1 }, 
        { x: 0, y: 0 },
        { x: tx - 1, y: ty - 1 }
    ];

    linearSystemData.testPoints = [
        pool[Math.floor(Math.random() * pool.length)],
        pool[Math.floor(Math.random() * pool.length)]
    ];

    linearSystemData.system = {
        m1, b1, m2, b2, 
        tx, ty, 
        correctCount,
        eq1Disp: eq1Obj.text,
        eq2Disp: eq2Obj.text,
        type: type
    };
}

function generateEquationDisplay(m, b, forceStandard = false) {
    const isStandard = forceStandard || Math.random() > 0.5; 

    if (!isStandard) {
        // Slope Intercept Form: y = mx + b
        let mPart = (m === 1) ? "x" : (m === -1) ? "-x" : `${m}x`;
        let bPart = (b === 0) ? "" : (b > 0 ? ` + ${b}` : ` - ${Math.abs(b)}`);
        return { text: `y = ${mPart}${bPart}` };
    } else {
        // Standard Form: -mx + y = b  ->  Ax + By = C
        // y = mx + b  =>  -mx + y = b
        let A = -m;
        let B = 1;
        let C = b;

        // Make A positive if possible
        if (A < 0) { A *= -1; B *= -1; C *= -1; }

        let A_str = (A === 0) ? "" : (A === 1) ? "x" : (A === -1) ? "-x" : `${A}x`;
        let B_str = (B < 0) ? ` - ${Math.abs(B)}y` : ` + ${B}y`;
        if (Math.abs(B) === 1) B_str = (B < 0 ? " - y" : " + y");
        
        // Clean up leading + if A was 0
        if (A === 0 && B_str.trim().startsWith("+")) B_str = B_str.replace("+", "");

        return { text: `${A_str}${B_str} = ${C}` };
    }
}

function renderLinearSystemUI() {
    const qContent = document.getElementById('q-content');
    if (!qContent) return;
    
    const s = linearSystemData.system;
    const step = linearSystemData.step;

    // --- Header ---
    let html = `
        <div style="max-width:500px; margin:0 auto;">
            <div style="background:#f8fafc; padding:15px; border-radius:12px; margin-bottom:20px; border:1px solid #e2e8f0; text-align:center;">
                <div style="font-family:monospace; font-size:18px; color:#1e293b; line-height:1.6;">
                    <div id="eq1-disp" style="padding:4px; border-radius:4px;">${s.eq1Disp}</div>
                    <div id="eq2-disp" style="padding:4px; border-radius:4px;">${s.eq2Disp}</div>
                </div>
            </div>
    `;

    // --- Steps 1 & 2: Point Verification ---
    if (step < 3) {
        const p = linearSystemData.testPoints[step - 1];
        html += `
            <h4 style="color:#475569; text-align:center;">Step ${step}: Test a Point</h4>
            <p style="text-align:center; font-size:16px;">
                Is the point <strong>(${p.x}, ${p.y})</strong> a solution to the <strong>entire system</strong>?
            </p>
            <div style="display:flex; justify-content:center; gap:20px; margin-top:20px;">
                <button onclick="handleSysStep(true)" class="btn-primary" style="width:100px;">Yes</button>
                <button onclick="handleSysStep(false)" class="btn-secondary" style="width:100px;">No</button>
            </div>
        `;
    } 
    // --- Step 3: Count Solutions ---
    else if (step === 3) {
        html += `
            <h4 style="color:#475569; text-align:center;">Step 3: Analyze</h4>
            <p style="text-align:center;">Based on the slopes and intercepts, how many solutions does this system have?</p>
            <div style="display:flex; justify-content:center; gap:10px; margin-top:20px;">
                <button onclick="handleSysCount(1)" class="btn-primary">One Solution</button>
                <button onclick="handleSysCount(0)" class="btn-primary">No Solution</button>
                <button onclick="handleSysCount(Infinity)" class="btn-primary">Infinite</button>
            </div>
        `;
    }
    // --- Step 4: Graphing ---
    else if (step === 4) {
        // Highlight active equation
        const plottingEq2 = linearSystemData.userPoints.length >= 2;
        
        setTimeout(() => {
            document.getElementById('eq1-disp').style.background = plottingEq2 ? "transparent" : "#dbeafe";
            document.getElementById('eq1-disp').style.fontWeight = plottingEq2 ? "normal" : "bold";
            document.getElementById('eq2-disp').style.background = plottingEq2 ? "#fecaca" : "transparent";
            document.getElementById('eq2-disp').style.fontWeight = plottingEq2 ? "bold" : "normal";
        }, 50);

        html += `
            <h4 style="color:#475569; text-align:center;">Step 4: Graph the System</h4>
            <p style="text-align:center; font-size:14px; color:#64748b;">
                ${plottingEq2 ? "Plot 2 points for the <strong>second</strong> equation." : "Plot 2 points for the <strong>first</strong> equation."}
            </p>
            
            <div style="position:relative; width:360px; margin:0 auto; user-select:none;">
                <div id="coord-hover" style="position:absolute; top:5px; right:5px; background:rgba(255,255,255,0.9); padding:2px 6px; border-radius:4px; font-size:12px; pointer-events:none; opacity:0;">0,0</div>
                <canvas id="sysCanvas" width="360" height="360" style="border:2px solid #333; background:white; cursor:crosshair; display:block;"></canvas>
            </div>
            <div id="sys-feedback" style="text-align:center; height:20px; color:#ef4444; margin-top:10px; font-weight:bold;"></div>
            <div style="text-align:center; margin-top:10px;">
                <button onclick="resetSysGraph()" class="btn-secondary" style="font-size:12px; padding:5px 10px;">Reset Graph</button>
            </div>
        `;
    }

    html += `</div>`; // End container
    qContent.innerHTML = html;

    if (step === 4) initSysCanvas();
}

// --- LOGIC HANDLERS ---

window.handleSysStep = function(userSaidYes) {
    const p = linearSystemData.testPoints[linearSystemData.step - 1];
    const s = linearSystemData.system;
    
    // Check Eq 1
    const val1 = (s.m1 * p.x) + s.b1;
    const works1 = Math.abs(p.y - val1) < 0.001;

    // Check Eq 2
    const val2 = (s.m2 * p.x) + s.b2;
    const works2 = Math.abs(p.y - val2) < 0.001;

    const actuallyWorks = works1 && works2;

    if (userSaidYes === actuallyWorks) {
        linearSystemData.step++;
        renderLinearSystemUI();
    } else {
        linearSystemData.errors++;
        alert("Incorrect. Check if the point works for BOTH equations.");
    }
};

window.handleSysCount = function(val) {
    if (val === linearSystemData.system.correctCount) {
        linearSystemData.step = 4;
        renderLinearSystemUI();
    } else {
        linearSystemData.errors++;
        alert("Incorrect. Look at the slopes. Are they the same? If so, are the intercepts different?");
    }
};

// --- GRAPHING ---

function initSysCanvas() {
    const canvas = document.getElementById('sysCanvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const hover = document.getElementById('coord-hover');
    const size = 360;
    const scale = linearSystemData.scale; // 18px per unit => 20 units total (-10 to 10)

    function draw() {
        ctx.clearRect(0,0,size,size);
        
        // Grid
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#e2e8f0";
        for(let i=0; i<=size; i+=scale) {
            ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,size); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(size,i); ctx.stroke();
        }

        // Axes
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#475569";
        ctx.beginPath(); ctx.moveTo(size/2, 0); ctx.lineTo(size/2, size); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, size/2); ctx.lineTo(size, size/2); ctx.stroke();

        // User Points
        linearSystemData.userPoints.forEach((p, idx) => {
            // First 2 points = Line 1 (Blue), Next 2 = Line 2 (Red)
            ctx.fillStyle = idx < 2 ? "#2563eb" : "#dc2626"; 
            
            let px = size/2 + (p.x * scale);
            let py = size/2 - (p.y * scale);
            
            ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI*2); ctx.fill();
        });

        // Draw Lines
        if (linearSystemData.userPoints.length >= 2) {
            drawLine(linearSystemData.userPoints[0], linearSystemData.userPoints[1], "#2563eb");
        }
        if (linearSystemData.userPoints.length === 4) {
            drawLine(linearSystemData.userPoints[2], linearSystemData.userPoints[3], "#dc2626");
        }
    }

    function drawLine(p1, p2, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        if (p1.x === p2.x) { // Vertical
             let x = size/2 + (p1.x * scale);
             ctx.moveTo(x, 0); ctx.lineTo(x, size);
        } else {
            // Extend line to edges
            let m = (p2.y - p1.y) / (p2.x - p1.x);
            let b = p1.y - (m * p1.x); // internal logic b, not necessarily system b
            
            // Calculate Y at x=-10 and x=10
            let yLeft = m * -10 + b;
            let yRight = m * 10 + b;
            
            ctx.moveTo(size/2 + (-10*scale), size/2 - (yLeft*scale));
            ctx.lineTo(size/2 + (10*scale), size/2 - (yRight*scale));
        }
        ctx.stroke();
    }

    draw();

    // Interaction
    canvas.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const gx = Math.round((e.clientX - rect.left - size/2) / scale);
        const gy = Math.round((size/2 - (e.clientY - rect.top)) / scale);
        if(hover) {
            hover.style.opacity = 1;
            hover.innerText = `(${gx}, ${gy})`;
        }
    };
    
    canvas.onmouseleave = () => { if(hover) hover.style.opacity = 0; };

    canvas.onclick = (e) => {
        if (linearSystemData.userPoints.length >= 4) return;
        
        const rect = canvas.getBoundingClientRect();
        const gx = Math.round((e.clientX - rect.left - size/2) / scale);
        const gy = Math.round((size/2 - (e.clientY - rect.top)) / scale);

        // Prevent duplicates in current pair
        const currentLen = linearSystemData.userPoints.length;
        if ((currentLen === 1 || currentLen === 3) && 
            linearSystemData.userPoints[currentLen-1].x === gx && 
            linearSystemData.userPoints[currentLen-1].y === gy) {
            return;
        }

        linearSystemData.userPoints.push({x: gx, y: gy});
        draw();

        // Logic check after pair completion
        if (linearSystemData.userPoints.length === 2) {
            if (checkLineValid(0, 1, 1)) {
                renderLinearSystemUI(); // Refresh for Line 2
            } else {
                document.getElementById('sys-feedback').innerText = "Incorrect points for Equation 1.";
                linearSystemData.errors++;
                linearSystemData.userPoints = []; // Wipe Line 1
                setTimeout(() => { 
                    document.getElementById('sys-feedback').innerText = ""; 
                    draw(); 
                }, 1500);
            }
        } else if (linearSystemData.userPoints.length === 4) {
            if (checkLineValid(2, 3, 2)) {
                finishSysGame();
            } else {
                document.getElementById('sys-feedback').innerText = "Incorrect points for Equation 2.";
                linearSystemData.errors++;
                linearSystemData.userPoints.pop(); // Remove last two
                linearSystemData.userPoints.pop();
                setTimeout(() => { 
                    document.getElementById('sys-feedback').innerText = ""; 
                    draw(); 
                }, 1500);
            }
        }
    };
}

function checkLineValid(idx1, idx2, eqNum) {
    const p1 = linearSystemData.userPoints[idx1];
    const p2 = linearSystemData.userPoints[idx2];
    const s = linearSystemData.system;
    
    const m = (eqNum === 1) ? s.m1 : s.m2;
    const b = (eqNum === 1) ? s.b1 : s.b2;

    // Check if points satisfy y = mx + b
    const check1 = Math.abs(p1.y - (m * p1.x + b)) < 0.1;
    const check2 = Math.abs(p2.y - (m * p2.x + b)) < 0.1;

    return check1 && check2;
}

window.resetSysGraph = function() {
    linearSystemData.userPoints = [];
    renderLinearSystemUI();
};

async function finishSysGame() {
    const qContent = document.getElementById('q-content');
    qContent.innerHTML = `
        <div style="text-align:center; padding:40px;">
            <h2 style="color:#1e293b;">System Solved!</h2>
            <p style="font-size:20px; color:green;">Great Job.</p>
            <p>Total Errors: ${linearSystemData.errors}</p>
        </div>
    `;

    // Score Update
    let adjustment = 0;
    if (linearSystemData.errors === 0) adjustment = 1;
    else if (linearSystemData.errors >= 2) adjustment = -1;

    await updateSysScore(adjustment);

    setTimeout(() => {
        if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion();
    }, 2500);
}

async function updateSysScore(amount) {
    if (amount === 0) return;
    
    let current = window.userMastery.LinearSystem || 0;
    let next = Math.max(0, Math.min(10, current + amount));
    window.userMastery.LinearSystem = next;

    if (window.supabaseClient && window.currentUser) {
        try {
            const h = sessionStorage.getItem('target_hour') || "00";
            await window.supabaseClient.from('assignment')
                .update({ LinearSystem: next })
                .eq('userName', window.currentUser)
                .eq('hour', h);
        } catch(e) { console.error(e); }
    }
}

// CSS Injection
const sysStyle = document.createElement('style');
sysStyle.innerHTML = `
    .btn-primary { background:#3b82f6; color:white; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-size:14px; transition:0.2s; }
    .btn-primary:hover { background:#2563eb; }
    .btn-secondary { background:#e2e8f0; color:#334155; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-size:14px; transition:0.2s; }
    .btn-secondary:hover { background:#cbd5e1; }
`;
document.head.appendChild(sysStyle);
