/**
 * skill_linear.js - v2.3.2
 * FIXED: Resolved scope and async initialization issues that prevented loading.
 * Added: Explicit error logging for easier debugging.
 */

(function() {
    console.log("%c [LinearMath] v2.3.2 Initializing... ", "background: #1e293b; color: #3b82f6; font-weight: bold;");

    var linearData = {
        version: "2.3.2",
        scenario: {},      
        stage: 'variables', 
        errors: 0,         
        pointsClicked: [], 
        gridConfig: { maxVal: 20, scaleStep: 2 }, 
        targetSolveX: 6,
        targetSolveY: 0
    };

    window.initLinearMastery = async function() {
        const qContent = document.getElementById('q-content');
        if (!qContent) {
            console.error("[LinearMath] Error: Element 'q-content' not found.");
            return;
        }

        // Reset local state
        linearData.stage = 'variables';
        linearData.errors = 0;
        linearData.pointsClicked = [];
        
        if (!window.userMastery) window.userMastery = {};

        // Sync with Supabase Database
        try {
            if (window.supabaseClient && window.currentUser) {
                const currentHour = sessionStorage.getItem('target_hour') || "00";
                const { data, error } = await window.supabaseClient
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
        } catch (e) { console.warn("[LinearMath] Supabase sync skipped/failed:", e); }

        generateLinearScenario();
        renderLinearStage();
    };

    function generateLinearScenario() {
        const templates = [
            { type: 'growth', prompt: "A botanist tracks a sunflower's growth.", text: "The sunflower is {B} cm tall and grows {M} cm per day.", unitX: "days", unitY: "cm", labelX: "time", labelY: "height" },
            { type: 'growth', prompt: "A contractor charges for a job.", text: "There is a base fee of ${B} plus ${M} per hour of labor.", unitX: "hours", unitY: "dollars", labelX: "labor time", labelY: "total cost" },
            { type: 'decay',  prompt: "A pilot is descending for landing.", text: "The plane is at {B} thousand feet and descends {M} thousand feet per minute.", unitX: "minutes", unitY: "thousand feet", labelX: "time", labelY: "altitude" },
            { type: 'decay',  prompt: "A phone battery is losing charge.", text: "The battery is at {B}% and drops {M}% every hour.", unitX: "hours", unitY: "percent", labelX: "time", labelY: "remaining charge" }
        ];

        const t = templates[Math.floor(Math.random() * templates.length)];
        const scales = [1, 2, 5, 10];
        const scale = scales[Math.floor(Math.random() * scales.length)];
        const maxLimit = scale * 10;

        let b = (Math.floor(Math.random() * 5) + 1) * scale; 
        let m = (Math.floor(Math.random() * 2) + 1) * scale;
        let tx = 6; 

        if (t.type === 'decay') {
            b = maxLimit - (Math.floor(Math.random() * 2) * scale);
            m = -m;
            while (b + (m * tx) < 0 && tx > 2) {
                if (Math.abs(m) > scale) m += scale; 
                else tx -= 1; 
            }
        } else {
            while (b + (m * tx) > maxLimit) { m = Math.max(scale, m - scale); }
        }

        linearData.gridConfig.scaleStep = scale;
        linearData.gridConfig.maxVal = maxLimit;
        linearData.targetSolveX = tx;

        linearData.scenario = {
            fullText: t.prompt + " " + t.text.replace("{B}", b).replace("{M}", Math.abs(m)),
            b: b, m: m, unitX: t.unitX, unitY: t.unitY, labelX: t.labelX, labelY: t.labelY
        };
    }

    function renderLinearStage() {
        const qContent = document.getElementById('q-content');
        const s = linearData.scenario;
        const stage = linearData.stage;

        let mPart = (s.m === 1 ? "x" : (s.m === -1 ? "-x" : s.m + "x"));
        let bPart = (s.b === 0 ? "" : (s.b > 0 ? " + " + s.b : " - " + Math.abs(s.b)));
        let displayEq = "y = " + mPart + bPart;

        let html = `<div style="max-width:600px; margin:0 auto; font-family: sans-serif;">`;
        html += `<div class="scenario-box"><h3>${s.fullText}</h3></div>`;

        if (stage === 'variables') {
            html += `<h4>Part 1: Variables</h4>
                     <p>Define what <b>x</b> and <b>y</b> represent in this story:</p>
                     <div class="step-input"><b>x</b> (Independent) = <select id="inp-x"><option value="">--</option><option value="correct">${s.unitX}</option><option value="wrong">${s.unitY}</option></select></div>
                     <div class="step-input"><b>y</b> (Dependent) = <select id="inp-y"><option value="">--</option><option value="wrong">${s.unitX}</option><option value="correct">${s.unitY}</option></select></div>
                     <button onclick="checkLinearVars()" class="btn-primary">Next Step</button>`;
        }
        else if (stage === 'slope') {
            html += `<h4>Part 2: Slope</h4><p>What is the <b>slope (m)</b>?</p>
                     <input type="number" id="inp-m" class="math-input"> <button onclick="checkLinearM()" class="btn-primary">Check</button>`;
        }
        else if (stage === 'intercept') {
            html += `<h4>Part 3: Intercept</h4><p>What is the <b>y-intercept (b)</b>?</p>
                     <input type="number" id="inp-b" class="math-input"> <button onclick="checkLinearB()" class="btn-primary">Check</button>`;
        }
        else if (stage === 'eq') {
            html += `<h4>Part 4: Equation</h4><div style="font-size:22px;">y = <input type="text" id="inp-eq" placeholder="mx + b" style="width:160px;"></div>
                     <button onclick="checkLinearEq()" class="btn-primary" style="margin-top:10px;">Check Equation</button>`;
        }
        else if (stage === 'graph') {
            html += `<h4>Part 5: Graphing</h4><div class="eq-highlight">Equation: ${displayEq}</div>
                     <p>Plot 3 points on the grid. Each line = ${linearData.gridConfig.scaleStep} units.</p>
                     <canvas id="linCanvas" width="400" height="400" style="border:1px solid #000; background:white; cursor:crosshair;"></canvas>`;
        }
        else if (stage === 'solve') {
            let tx = linearData.targetSolveX;
            linearData.targetSolveY = (s.m * tx) + s.b;
            html += `<h4>Part 6: Final Prediction</h4><div class="eq-highlight">Equation: ${displayEq}</div>
                     <p>Using your equation, what will the <b>${s.labelY}</b> be after <b>${tx} ${s.unitX}</b>?</p>
                     <input type="number" id="inp-solve" class="math-input"> ${s.unitY}
                     <button onclick="checkLinearD()" class="btn-primary">Submit</button>`;
        }

        html += `<div id="lin-feedback" style="margin-top:15px; min-height:30px; font-weight:bold;"></div></div>`;
        qContent.innerHTML = html;

        if (stage === 'graph') setupLinearGraph();
    }

    // Global wrappers for internal logic
    window.checkLinearVars = function() {
        if (document.getElementById('inp-x').value === 'correct' && document.getElementById('inp-y').value === 'correct') {
            linearData.stage = 'slope'; renderLinearStage();
        } else {
            document.getElementById('lin-feedback').innerHTML = `<span style="color:red">Hint: x is your "timer" (like ${linearData.scenario.unitX}).</span>`;
        }
    };

    window.checkLinearM = function() {
        if (parseFloat(document.getElementById('inp-m').value) === linearData.scenario.m) {
            linearData.stage = 'intercept'; renderLinearStage();
        } else {
            linearData.errors++;
            document.getElementById('lin-feedback').innerHTML = `<span style="color:red">Incorrect. Look for the "rate" per unit.</span>`;
        }
    };

    window.checkLinearB = function() {
        if (parseFloat(document.getElementById('inp-b').value) === linearData.scenario.b) {
            linearData.stage = 'eq'; renderLinearStage();
        } else {
            linearData.errors++;
            document.getElementById('lin-feedback').innerHTML = `<span style="color:red">Incorrect. This is the starting amount.</span>`;
        }
    };

    window.checkLinearEq = async function() {
        let userVal = document.getElementById('inp-eq').value.replace(/\s/g, '').toLowerCase();
        const { m, b } = linearData.scenario;
        let mPart = (m === 1 ? "x" : (m === -1 ? "-x" : m + "x"));
        let bPart = (b === 0 ? "" : (b > 0 ? "+" + b : b));
        let correct = mPart + bPart;

        if (userVal === correct || userVal === "y=" + correct) {
            await updateSkill('LinearEq', 1);
            linearData.stage = 'graph'; renderLinearStage();
        } else {
            linearData.errors++;
            document.getElementById('lin-feedback').innerHTML = `<span style="color:red">Use y = mx + b formatting.</span>`;
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
            ctx.strokeStyle = "#000"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(2,0); ctx.lineTo(2,400); ctx.lineTo(400,400); ctx.stroke();

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
                const yStart = 400 - ((linearData.scenario.b / cfg.maxVal) * 400);
                const yEnd = 400 - (((linearData.scenario.m * 10 + linearData.scenario.b) / cfg.maxVal) * 400);
                ctx.beginPath(); ctx.moveTo(0, yStart); ctx.lineTo(400, yEnd); ctx.stroke();
                setTimeout(async () => { 
                    await updateSkill('LinearGraph', 1); 
                    linearData.stage = 'solve'; 
                    renderLinearStage(); 
                }, 1000);
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

            if (Math.abs(valY - (linearData.scenario.m * valX + linearData.scenario.b)) < 0.1) {
                linearData.pointsClicked.push({cx: gx * pixelStep, cy: 400 - (gy * pixelStep)});
                draw();
                document.getElementById('lin-feedback').innerHTML = "";
            } else {
                linearData.errors++;
                document.getElementById('lin-feedback').innerHTML = `<span style="color:red">Point (${valX}, ${valY}) is not correct.</span>`;
            }
        };
    }

    window.checkLinearD = async function() {
        let val = parseFloat(document.getElementById('inp-solve').value);
        if (Math.abs(val - linearData.targetSolveY) < 0.1) {
            await updateSkill('LinearSolve', 1);
            let inc = (linearData.errors <= 1) ? 2 : 1;
            await updateSkill('LinearMastery', inc);
            showFinalLinearMessage(inc);
        } else {
            linearData.errors++;
            document.getElementById('lin-feedback').innerHTML = `<span style="color:red">Incorrect. Plug x=${linearData.targetSolveX} into your equation.</span>`;
        }
    };

    async function updateSkill(col, amt) {
        let curr = window.userMastery[col] || 0;
        let next = Math.max(0, Math.min(10, curr + amt));
        window.userMastery[col] = next;
        if (window.supabaseClient && window.currentUser) {
            const h = sessionStorage.getItem('target_hour') || "00";
            try { 
                await window.supabaseClient.from('assignment').update({ [col]: next }).eq('userName', window.currentUser).eq('hour', h); 
            } catch(e) { console.error("Database Update Error:", e); }
        }
    }

    function showFinalLinearMessage(inc) {
        document.getElementById('q-content').innerHTML = `
            <div style="text-align:center; padding:40px;">
                <h2>Scenario Mastery!</h2>
                <p style="font-size:24px; color:green; font-weight:bold;">+${inc} Mastery Points</p>
                <button onclick="initLinearMastery()" class="btn-primary">Try Another Scenario</button>
            </div>`;
    }

    // Load styles
    const styleId = 'linear-math-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            .scenario-box { background:#f1f5f9; padding:15px; border-radius:8px; border-left:6px solid #3b82f6; margin-bottom:15px; }
            .eq-highlight { background:#eff6ff; padding:10px; border-radius:4px; margin-bottom:12px; font-weight:bold; color:#1e40af; border:1px solid #bfdbfe; }
            .btn-primary { background:#2563eb; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:bold; }
            .btn-primary:hover { background:#1d4ed8; }
            .math-input { font-size:18px; width:90px; padding:6px; border:1px solid #cbd5e1; border-radius:4px; }
            .step-input { margin-bottom:10px; font-size:16px; }
            select { padding:5px; border-radius:4px; border:1px solid #cbd5e1; }
        `;
        document.head.appendChild(style);
    }

    console.log("[LinearMath] Script Loaded Successfully.");
})();
