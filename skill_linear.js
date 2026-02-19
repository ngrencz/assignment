/**
 * skill_linear.js - v2.2.7
 * Full Production Version.
 * Fix: Ensures all scenarios are mathematically graphable within the 10x10 grid units.
 */

console.log("%c [LinearMath] v2.2.7 Build - Grid Sync Fix ", "background: #1e293b; color: #3b82f6; font-weight: bold;");

var linearData = {
    version: "2.2.7",
    scenario: {},      
    stage: 'variables', 
    errors: 0,         
    pointsClicked: [], 
    gridConfig: { maxVal: 20, scaleStep: 2 }, 
    targetSolveX: 0,
    targetSolveY: 0
};

window.initLinearMastery = async function() {
    if (!document.getElementById('q-content')) return;

    linearData.stage = 'variables';
    linearData.errors = 0;
    linearData.pointsClicked = [];
    
    if (!window.userMastery) window.userMastery = {};

    try {
        if (window.supabaseClient && window.currentUser) {
            const currentHour = sessionStorage.getItem('target_hour');
            const { data } = await window.supabaseClient
                .from('assignment')
                .select('LinearMastery, LinearEq, LinearGraph, LinearInt, LinearSolve')
                .eq('userName', window.currentUser)
                .eq('hour', currentHour)
                .maybeSingle();
            
            if (data) {
                window.userMastery.LinearMastery = data.LinearMastery || 0;
                window.userMastery.LinearEq = data.LinearEq || 0;
                window.userMastery.LinearGraph = data.LinearGraph || 0;
                window.userMastery.LinearInt = data.LinearInt || 0;
                window.userMastery.LinearSolve = data.LinearSolve || 0;
            }
        }
    } catch (e) { console.log("Sync error", e); }

    generateLinearScenario();
    renderLinearStage();
};

function generateLinearScenario() {
    const templates = [
        { type: 'growth', prompt: "A botanist is tracking a sunflower's growth.", text: "The sunflower is {B} cm tall and grows {M} cm per day.", unitX: "days", unitY: "cm", labelY: "Height", big: false },
        { type: 'growth', prompt: "A contractor is charging for a job.", text: "There is a base fee of ${B} plus ${M} per hour of labor.", unitX: "hours", unitY: "dollars", labelY: "Total Cost", big: true },
        { type: 'decay',  prompt: "A pilot is descending for landing.", text: "The plane is at {B} thousand feet and descends {M} thousand feet per minute.", unitX: "minutes", unitY: "feet", labelY: "Altitude", big: true },
        { type: 'decay',  prompt: "A phone battery is losing charge.", text: "The battery is at {B}% and drops {M}% every hour.", unitX: "hours", unitY: "percent", labelY: "Charge", big: false },
        { type: 'growth', prompt: "A pool is being filled.", text: "It already has {B} gallons and is filling at {M} gallons per minute.", unitX: "minutes", unitY: "gallons", labelY: "Volume", big: true }
    ];

    const t = templates[Math.floor(Math.random() * templates.length)];
    let b, m, scale;

    // Determine a clean scale (1, 2, 5, or 10) so the graph is readable
    if (t.big) {
        // Big scales: Max Y will be 50 or 100
        scale = Math.random() > 0.5 ? 5 : 10; 
        let maxLimit = scale * 10; 
        
        if (t.type === 'growth') {
            b = Math.floor(Math.random() * 4) * scale; // Start at 0, 5, 10...
            m = (Math.floor(Math.random() * 3) + 1) * (scale / 2 === 2.5 ? 5 : 5); 
            // Clamp m so that b + 10m <= maxLimit
            while (b + (m * 10) > maxLimit) { m -= 1; }
            if (m < 1) m = 1;
        } else {
            b = maxLimit - (Math.floor(Math.random() * 2) * scale); // Start near top
            m = -(Math.floor(Math.random() * 3) + 1) * (scale / 2 === 2.5 ? 5 : 5);
            // Clamp m so it doesn't drop below 0 too fast
            while (b + (m * 10) < 0) { m += 1; }
            if (m > -1) m = -1;
        }
    } else {
        // Standard scales: Max Y will be 10 or 20
        scale = Math.random() > 0.5 ? 1 : 2;
        let maxLimit = scale * 10;

        if (t.type === 'growth') {
            b = Math.floor(Math.random() * 5); 
            m = Math.floor(Math.random() * 2) + 1;
            while (b + (m * 10) > maxLimit) { b -= 1; }
            if (b < 0) b = 0;
        } else {
            b = maxLimit - Math.floor(Math.random() * 3);
            m = -(Math.floor(Math.random() * 2) + 1);
        }
    }

    linearData.gridConfig.scaleStep = scale;
    linearData.gridConfig.maxVal = scale * 10;

    linearData.scenario = {
        fullText: t.prompt + " " + t.text.replace("{B}", b).replace("{M}", Math.abs(m)),
        b: b, m: m, unitX: t.unitX, unitY: t.unitY, labelY: t.labelY
    };
}

function renderLinearStage() {
    const qContent = document.getElementById('q-content');
    const s = linearData.scenario;
    const stage = linearData.stage;

    let mPart = (s.m === 1 ? "x" : (s.m === -1 ? "-x" : s.m + "x"));
    let bPart = (s.b === 0 ? "" : (s.b > 0 ? "+" + s.b : s.b));
    let displayEq = "y = " + mPart + bPart;

    let html = `<div style="max-width:600px; margin:0 auto;">`;
    html += `<div style="background:#f1f5f9; padding:15px; border-radius:8px; border-left:5px solid #3b82f6; margin-bottom:20px;">
                <h3 style="margin:0; color:#1e293b;">${s.fullText}</h3>
             </div>`;

    if (stage === 'variables') {
        html += `<h4>Part 1: Variables</h4>
                 <div class="step-input">x = <select id="inp-x"><option value="">--select--</option><option value="correct">${s.unitX}</option><option value="wrong">${s.unitY}</option></select></div>
                 <div class="step-input">y = <select id="inp-y"><option value="">--select--</option><option value="wrong">${s.unitX}</option><option value="correct">${s.unitY}</option></select></div>
                 <button onclick="checkLinearVars()" class="btn-primary">Next Step</button>`;
    }
    else if (stage === 'slope') {
        html += `<h4>Part 2: Rate of Change</h4>
                 <p>What is the <b>slope (m)</b>?</p>
                 <input type="number" id="inp-m" class="math-input">
                 <button onclick="checkLinearM()" class="btn-primary">Check Slope</button>`;
    }
    else if (stage === 'intercept') {
        html += `<h4>Part 3: Starting Value</h4>
                 <p>What is the <b>y-intercept (b)</b>?</p>
                 <input type="number" id="inp-b" class="math-input">
                 <button onclick="checkLinearB()" class="btn-primary">Check Intercept</button>`;
    }
    else if (stage === 'eq') {
        html += `<h4>Part 4: The Equation</h4>
                 <div style="font-size:22px;">y = <input type="text" id="inp-eq" placeholder="mx + b" style="width:160px;"></div>
                 <button onclick="checkLinearEq()" class="btn-primary" style="margin-top:10px;">Check Equation</button>`;
    }
    else if (stage === 'graph') {
        html += `<h4>Part 5: Graphing</h4>
                 <div style="background:#e0f2fe; padding:10px; border-radius:4px; margin-bottom:10px; font-weight:bold; color:#0369a1;">Equation: ${displayEq}</div>
                 <p>Plot 3 points on the grid. (The y-axis counts by ${linearData.gridConfig.scaleStep}s)</p>
                 <canvas id="linCanvas" width="400" height="400" style="background:white; border:1px solid #000; cursor:crosshair;"></canvas>`;
    }
    else if (stage === 'solve') {
        let tx = 8; 
        linearData.targetSolveX = tx;
        linearData.targetSolveY = s.m * tx + s.b;
        html += `<h4>Part 6: Predict</h4>
                 <div style="background:#e0f2fe; padding:10px; border-radius:4px; margin-bottom:10px; font-weight:bold; color:#0369a1;">Equation: ${displayEq}</div>
                 <p>What is the value of y when x = ${tx} ${s.unitX}?</p>
                 <input type="number" id="inp-solve" class="math-input"> ${s.unitY}
                 <button onclick="checkLinearD()" class="btn-primary">Submit Answer</button>`;
    }

    html += `<div id="lin-feedback" style="margin-top:15px; min-height:30px; font-weight:bold;"></div></div>`;
    qContent.innerHTML = html;
    if (stage === 'graph') setupLinearGraph();
}

// Logic functions (checkLinearVars, checkLinearM, checkLinearB, checkLinearEq, checkLinearD) 
// and updateSkill / handleSubSuccess remain identical to ensure database integrity.

window.checkLinearVars = function() {
    if (document.getElementById('inp-x').value === 'correct' && document.getElementById('inp-y').value === 'correct') {
        linearData.stage = 'slope'; renderLinearStage();
    } else {
        document.getElementById('lin-feedback').innerHTML = `<span style="color:red">Think: x is the input (time), and y is the result (total).</span>`;
    }
}

window.checkLinearM = function() {
    if (parseFloat(document.getElementById('inp-m').value) === linearData.scenario.m) {
        linearData.stage = 'intercept'; renderLinearStage();
    } else {
        linearData.errors++;
        document.getElementById('lin-feedback').innerHTML = `<span style="color:red">Slope is the rate of change (+ for growth, - for decay).</span>`;
    }
}

window.checkLinearB = function() {
    if (parseFloat(document.getElementById('inp-b').value) === linearData.scenario.b) {
        linearData.stage = 'eq'; renderLinearStage();
    } else {
        linearData.errors++;
        document.getElementById('lin-feedback').innerHTML = `<span style="color:red">The y-intercept is the starting value.</span>`;
    }
}

async function checkLinearEq() {
    let userVal = document.getElementById('inp-eq').value.replace(/\s/g, '').toLowerCase();
    const { m, b } = linearData.scenario;
    let mPart = (m === 1 ? "x" : (m === -1 ? "-x" : m + "x"));
    let bPart = (b === 0 ? "" : (b > 0 ? "+" + b : b));
    let correct = mPart + bPart;
    if (userVal === correct || userVal === "y=" + correct) {
        await handleSubSuccess('LinearEq');
        linearData.stage = 'graph'; renderLinearStage();
    } else {
        linearData.errors++;
        document.getElementById('lin-feedback').innerHTML = `<span style="color:red">Format: y = ${m}x + ${b}</span>`;
    }
}

function setupLinearGraph() {
    const canvas = document.getElementById('linCanvas');
    const ctx = canvas.getContext('2d');
    const cfg = linearData.gridConfig;
    const pixelStep = 40; 

    const draw = () => {
        ctx.clearRect(0,0,400,400);
        ctx.strokeStyle = "#e2e8f0";
        for(let i=0; i<=10; i++) {
            ctx.beginPath(); ctx.moveTo(i*pixelStep,0); ctx.lineTo(i*pixelStep,400); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0,i*pixelStep); ctx.lineTo(400,i*pixelStep); ctx.stroke();
        }
        ctx.strokeStyle = "#000"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(2,0); ctx.lineTo(2,400); ctx.lineTo(400,400); ctx.stroke();
        ctx.fillStyle = "#666"; ctx.font = "10px Arial";
        for(let i=0; i<=10; i+=2) {
            ctx.fillText(i, (i*pixelStep)+2, 395);
            ctx.fillText(i * cfg.scaleStep, 5, 400 - (i*pixelStep) - 2);
        }
        linearData.pointsClicked.forEach(p => {
            ctx.fillStyle = "#2563eb";
            ctx.beginPath(); ctx.arc(p.cx, p.cy, 5, 0, Math.PI*2); ctx.fill();
        });
        if (linearData.pointsClicked.length >= 3) {
            ctx.strokeStyle = "#3b82f6"; ctx.lineWidth = 3;
            const y0 = 400 - ((linearData.scenario.b / cfg.maxVal) * 400);
            const yFinal = 400 - (((linearData.scenario.m * 10 + linearData.scenario.b) / cfg.maxVal) * 400);
            ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(400, yFinal); ctx.stroke();
            setTimeout(async () => { await handleSubSuccess('LinearGraph'); linearData.stage = 'solve'; renderLinearStage(); }, 1500);
        }
    };
    draw();

    canvas.onclick = (e) => {
        if (linearData.pointsClicked.length >= 3) return;
        const rect = canvas.getBoundingClientRect();
        const gx = Math.round((e.clientX - rect.left) / pixelStep);
        const gy = Math.round((400 - (e.clientY - rect.top)) / pixelStep);
        let valX = gx; 
        let valY = gy * cfg.scaleStep;
        if (Math.abs(valY - (linearData.scenario.m * valX + linearData.scenario.b)) < 0.01) {
            linearData.pointsClicked.push({cx: gx * pixelStep, cy: 400 - (gy * pixelStep)});
            draw();
        } else {
            linearData.errors++;
            document.getElementById('lin-feedback').innerHTML = `<span style="color:red">Point (${valX}, ${valY}) is not on the line!</span>`;
        }
    };
}

async function checkLinearD() {
    let val = parseFloat(document.getElementById('inp-solve').value);
    if (Math.abs(val - linearData.targetSolveY) < 0.1) {
        await handleSubSuccess('LinearSolve');
        let inc = linearData.errors <= 1 ? 2 : (linearData.errors >= 4 ? -1 : 0);
        await updateSkill('LinearMastery', inc);
        showFinalLinearMessage(inc);
    } else {
        linearData.errors++;
        document.getElementById('lin-feedback').innerHTML = `<span style="color:red">Plug x=${linearData.targetSolveX} into your equation.</span>`;
    }
}

async function handleSubSuccess(colName) { await updateSkill(colName, 1); }

async function updateSkill(colName, amount) {
    let current = window.userMastery[colName] || 0;
    let next = Math.max(0, Math.min(10, current + amount));
    window.userMastery[colName] = next;
    if (window.supabaseClient && window.currentUser) {
        const h = sessionStorage.getItem('target_hour') || "00";
        try { await window.supabaseClient.from('assignment').update({ [colName]: next }).eq('userName', window.currentUser).eq('hour', h); } catch(e) {}
    }
}

function showFinalLinearMessage(inc) {
    const color = inc > 0 ? "green" : (inc < 0 ? "red" : "gray");
    document.getElementById('q-content').innerHTML = `<div style="text-align:center; padding:40px;"><h2>Challenge Complete</h2><p style="font-size:24px; color:${color}; font-weight:bold;">${inc > 0 ? '+2 Mastery' : 'Complete'}</p><button onclick="initLinearMastery()" class="btn-primary">Next Scenario</button></div>`;
}

const style = document.createElement('style');
style.innerHTML = `.btn-primary { background:#3b82f6; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; } .step-input { margin: 15px 0; font-size: 18px; } .math-input { font-size: 18px; padding: 5px; width: 80px; }`;
document.head.appendChild(style);
