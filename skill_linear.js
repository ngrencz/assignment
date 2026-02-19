/**
 * skill_linear.js - v2.2.8
 * FIXED: Mathematical guarantee that all points land on grid intersections.
 * FIXED: Equation hint explains logic instead of giving answer.
 */

console.log("%c [LinearMath] v2.2.8 - Grid-Perfect Logic ", "background: #1e293b; color: #3b82f6; font-weight: bold;");

var linearData = {
    version: "2.2.8",
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
            if (data) Object.assign(window.userMastery, data);
        }
    } catch (e) { console.log("Sync error", e); }

    generateLinearScenario();
    renderLinearStage();
};

function generateLinearScenario() {
    const templates = [
        { type: 'growth', prompt: "A botanist tracks a sunflower.", text: "The sunflower is {B} cm tall and grows {M} cm per day.", unitX: "days", unitY: "cm" },
        { type: 'growth', prompt: "A contractor charges a fee.", text: "There is a base fee of ${B} plus ${M} per hour.", unitX: "hours", unitY: "dollars" },
        { type: 'decay',  prompt: "A plane descends.", text: "The plane is at {B} thousand feet and descends {M} thousand feet per minute.", unitX: "minutes", unitY: "feet" },
        { type: 'decay',  prompt: "A tank empties.", text: "It holds {B} gallons and drains at {M} gallons per minute.", unitX: "minutes", unitY: "gallons" }
    ];

    const t = templates[Math.floor(Math.random() * templates.length)];
    
    // 1. Pick a Scale Step (1, 2, 5, or 10)
    const possibleScales = [1, 2, 5, 10];
    const scale = possibleScales[Math.floor(Math.random() * possibleScales.length)];
    const maxLimit = scale * 10;

    // 2. Force Math to align with Scale
    // Intercept must be a multiple of the scale to be clickable on Y-axis
    let b = Math.floor(Math.random() * 6) * scale; 
    
    // Slope must result in y-values that are multiples of the scale
    // If x is 1, y = m(1) + b. For y to be clickable, m must be a multiple of scale.
    let m = (Math.floor(Math.random() * 3) + 1) * scale;

    if (t.type === 'decay') {
        b = maxLimit - (Math.floor(Math.random() * 3) * scale);
        m = -m;
        // Ensure it doesn't drop off the grid too fast
        while (b + (m * 4) < 0) { m = Math.sign(m) * (Math.abs(m) - scale); }
        if (m === 0) m = -scale;
    } else {
        // Ensure growth doesn't exceed grid top within 10 units
        while (b + (m * 4) > maxLimit) { m = Math.max(scale, m - scale); }
    }

    linearData.gridConfig.scaleStep = scale;
    linearData.gridConfig.maxVal = maxLimit;

    linearData.scenario = {
        fullText: t.prompt + " " + t.text.replace("{B}", b).replace("{M}", Math.abs(m)),
        b: b, m: m, unitX: t.unitX, unitY: t.unitY
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
    html += `<div class="scenario-box"><h3>${s.fullText}</h3></div>`;

    if (stage === 'variables') {
        html += `<h4>Part 1: Variables</h4>
                 <div class="step-input">x = <select id="inp-x"><option value="">--</option><option value="correct">${s.unitX}</option><option value="wrong">${s.unitY}</option></select></div>
                 <div class="step-input">y = <select id="inp-y"><option value="">--</option><option value="wrong">${s.unitX}</option><option value="correct">${s.unitY}</option></select></div>
                 <button onclick="checkLinearVars()" class="btn-primary">Next</button>`;
    }
    else if (stage === 'slope') {
        html += `<h4>Part 2: Slope</h4><input type="number" id="inp-m" class="math-input"> <button onclick="checkLinearM()" class="btn-primary">Check</button>`;
    }
    else if (stage === 'intercept') {
        html += `<h4>Part 3: Intercept</h4><input type="number" id="inp-b" class="math-input"> <button onclick="checkLinearB()" class="btn-primary">Check</button>`;
    }
    else if (stage === 'eq') {
        html += `<h4>Part 4: Equation</h4><div style="font-size:22px;">y = <input type="text" id="inp-eq" placeholder="mx + b" style="width:160px;"></div>
                 <button onclick="checkLinearEq()" class="btn-primary" style="margin-top:10px;">Check</button>`;
    }
    else if (stage === 'graph') {
        html += `<h4>Part 5: Graphing</h4><div class="eq-highlight">Equation: ${displayEq}</div>
                 <p>Plot 3 points. Each grid line = ${linearData.gridConfig.scaleStep} units.</p>
                 <canvas id="linCanvas" width="400" height="400" style="border:1px solid #000; background:white; cursor:crosshair;"></canvas>`;
    }
    else if (stage === 'solve') {
        let tx = 5; 
        linearData.targetSolveX = tx;
        linearData.targetSolveY = s.m * tx + s.b;
        html += `<h4>Part 6: Predict</h4><div class="eq-highlight">Equation: ${displayEq}</div>
                 <p>What is y when x = ${tx}?</p>
                 <input type="number" id="inp-solve" class="math-input"> <button onclick="checkLinearD()" class="btn-primary">Submit</button>`;
    }

    html += `<div id="lin-feedback"></div></div>`;
    qContent.innerHTML = html;
    if (stage === 'graph') setupLinearGraph();
}

window.checkLinearEq = async function() {
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
        document.getElementById('lin-feedback').innerHTML = `<span style="color:red">Remember: Use your slope (m) and intercept (b) in the form y = mx + b.</span>`;
    }
};

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
        ctx.fillStyle = "#666"; ctx.font = "12px sans-serif";
        for(let i=0; i<=10; i+=2) {
            ctx.fillText(i, (i*pixelStep)+2, 395);
            ctx.fillText(i * cfg.scaleStep, 5, 400 - (i*pixelStep) - 2);
        }
        linearData.pointsClicked.forEach(p => {
            ctx.fillStyle = "#2563eb";
            ctx.beginPath(); ctx.arc(p.cx, p.cy, 6, 0, Math.PI*2); ctx.fill();
        });

        if (linearData.pointsClicked.length >= 3) {
            ctx.strokeStyle = "#3b82f6"; ctx.lineWidth = 3;
            const y0 = 400 - ((linearData.scenario.b / cfg.maxVal) * 400);
            const yMax = 400 - (((linearData.scenario.m * 10 + linearData.scenario.b) / cfg.maxVal) * 400);
            ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(400, yMax); ctx.stroke();
            setTimeout(async () => { await handleSubSuccess('LinearGraph'); linearData.stage = 'solve'; renderLinearStage(); }, 1200);
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

        if (Math.abs(valY - (linearData.scenario.m * valX + linearData.scenario.b)) < 0.001) {
            linearData.pointsClicked.push({cx: gx * pixelStep, cy: 400 - (gy * pixelStep)});
            draw();
            document.getElementById('lin-feedback').innerHTML = "";
        } else {
            linearData.errors++;
            document.getElementById('lin-feedback').innerHTML = `<span style="color:red">Point (${valX}, ${valY}) is not on the line!</span>`;
        }
    };
}

// Logic functions (checkLinearVars, checkLinearM, checkLinearB, checkLinearD, handleSubSuccess, updateSkill, showFinalLinearMessage)
// These are restored from the production master to maintain database and CSS compatibility.
window.checkLinearVars = function() {
    if (document.getElementById('inp-x').value === 'correct' && document.getElementById('inp-y').value === 'correct') {
        linearData.stage = 'slope'; renderLinearStage();
    } else {
        document.getElementById('lin-feedback').innerHTML = `<span style="color:red">Think: Which variable is the "timer" (x) and which is the "total" (y)?</span>`;
    }
};

window.checkLinearM = function() {
    if (parseFloat(document.getElementById('inp-m').value) === linearData.scenario.m) {
        linearData.stage = 'intercept'; renderLinearStage();
    } else {
        linearData.errors++;
        document.getElementById('lin-feedback').innerHTML = `<span style="color:red">Check the rate of change. (Use negative if decreasing).</span>`;
    }
};

window.checkLinearB = function() {
    if (parseFloat(document.getElementById('inp-b').value) === linearData.scenario.b) {
        linearData.stage = 'eq'; renderLinearStage();
    } else {
        linearData.errors++;
        document.getElementById('lin-feedback').innerHTML = `<span style="color:red">Check the starting value at time zero.</span>`;
    }
};

window.checkLinearD = async function() {
    let val = parseFloat(document.getElementById('inp-solve').value);
    if (Math.abs(val - linearData.targetSolveY) < 0.1) {
        await handleSubSuccess('LinearSolve');
        let inc = linearData.errors <= 1 ? 2 : (linearData.errors >= 4 ? -1 : 0);
        await updateSkill('LinearMastery', inc);
        showFinalLinearMessage(inc);
    } else {
        linearData.errors++;
        document.getElementById('lin-feedback').innerHTML = `<span style="color:red">Calculate y using the equation you created.</span>`;
    }
};

async function handleSubSuccess(col) { await updateSkill(col, 1); }

async function updateSkill(col, amt) {
    let curr = window.userMastery[col] || 0;
    let next = Math.max(0, Math.min(10, curr + amt));
    window.userMastery[col] = next;
    if (window.supabaseClient && window.currentUser) {
        const h = sessionStorage.getItem('target_hour') || "00";
        try { await window.supabaseClient.from('assignment').update({ [col]: next }).eq('userName', window.currentUser).eq('hour', h); } catch(e) {}
    }
}

function showFinalLinearMessage(inc) {
    const color = inc > 0 ? "green" : (inc < 0 ? "red" : "gray");
    document.getElementById('q-content').innerHTML = `<div style="text-align:center; padding:40px;"><h2>Task Complete</h2><p style="font-size:24px; color:${color}; font-weight:bold;">${inc > 0 ? '+2 Mastery' : 'Finished'}</p><button onclick="initLinearMastery()" class="btn-primary">Next</button></div>`;
}

const style = document.createElement('style');
style.innerHTML = `
    .scenario-box { background:#f8fafc; padding:15px; border-radius:8px; border-left:5px solid #3b82f6; margin-bottom:15px; }
    .eq-highlight { background:#eff6ff; padding:8px; border-radius:4px; margin-bottom:10px; font-weight:bold; color:#1d4ed8; border:1px solid #bfdbfe; }
    .btn-primary { background:#3b82f6; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer; }
    .math-input { font-size:18px; width:80px; padding:4px; }
    #lin-feedback { margin-top:10px; font-weight:bold; height:20px; }
`;
document.head.appendChild(style);
