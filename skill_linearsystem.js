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

    const type = Math.floor(Math.random() * 3);
    const tx = Math.floor(Math.random() * 13) - 6; 
    const ty = Math.floor(Math.random() * 13) - 6;

    const slopes = [-3, -2, -1, 1, 2, 3];
    const m1 = slopes[Math.floor(Math.random() * slopes.length)];
    const b1 = ty - (m1 * tx);

    let m2, b2, correctCount;

    if (type === 0) { 
        do { m2 = slopes[Math.floor(Math.random() * slopes.length)]; } while (m1 === m2);
        b2 = ty - (m2 * tx);
        correctCount = 1;
    } else if (type === 1) { 
        m2 = m1;
        b2 = b1 + (b1 > 0 ? -4 : 4);
        correctCount = 0;
    } else { 
        m2 = m1;
        b2 = b1;
        correctCount = Infinity;
    }

    const formatComplex = (m, b, isSecond) => {
        const coeffOptions = [2, 3];
        const coeff = (type === 2 && isSecond) ? coeffOptions[Math.floor(Math.random() * coeffOptions.length)] : 1;
        let leftSide = coeff === 1 ? "y" : `${coeff}y`;
        let mVal = m * coeff;
        let bVal = b * coeff;
        let mPart = (mVal === 1) ? "x" : (mVal === -1) ? "-x" : mVal + "x";
        let bPart = bVal === 0 ? "" : (bVal > 0 ? " + " + bVal : " - " + Math.abs(bVal));
        return `${leftSide} = ${mPart}${bPart}`;
    };

    currentSystem = {
        m1, b1, m2, b2, tx, ty, correctCount,
        eq1Disp: formatComplex(m1, b1, false),
        eq2Disp: formatComplex(m2, b2, true),
        s1: `y = ${m1 === 1 ? '' : m1 === -1 ? '-' : m1}x ${b1 >= 0 ? '+ '+b1 : '- '+Math.abs(b1)}`,
        s2: `y = ${m2 === 1 ? '' : m2 === -1 ? '-' : m2}x ${b2 >= 0 ? '+ '+b2 : '- '+Math.abs(b2)}`
    };

    renderLinearUI();
};

function renderLinearUI() {
    const qContent = document.getElementById('q-content');
    if (!qContent) return;
    document.getElementById('q-title').innerText = "System Analysis";

    let html = `
        <div style="background:#f1f5f9; padding:15px; border-radius:12px; margin-bottom:10px; border: 1px solid #cbd5e1; text-align:center;">
            <p style="font-family:monospace; font-size:1.1rem; margin:0;">
                Eq 1: <strong>${currentSystem.eq1Disp}</strong><br>
                Eq 2: <strong>${currentSystem.eq2Disp}</strong>
            </p>
        </div>`;

    if (currentStep < 4) {
        const prompts = [
            `Is (${currentSystem.tx}, ${currentSystem.ty}) a solution to BOTH?`,
            `Is (${currentSystem.tx + 1}, ${currentSystem.ty - 1}) a solution to BOTH?`,
            `How many solutions exist?`
        ];
        html += `<p style="text-align:center; font-weight:bold; margin-bottom:15px;">${prompts[currentStep-1]}</p>
                 <div style="display:flex; justify-content:center; gap:10px; margin-bottom:20px;">`;
        if (currentStep < 3) {
            html += `<button class="primary-btn" onclick="handleStep(true)">Yes</button>
                     <button class="secondary-btn" onclick="handleStep(false)">No</button>`;
        } else {
            html += `<button class="primary-btn" onclick="handleCount(1)">One</button>
                     <button class="primary-btn" onclick="handleCount(0)">None</button>
                     <button class="primary-btn" onclick="handleCount(Infinity)">Infinite</button>`;
        }
        html += `</div>`;
    } else {
        html += `<div style="text-align:center; margin-bottom:5px; font-size:0.85rem; color:#64748b;">Hint: ${currentSystem.s1} | ${currentSystem.s2}</div>
                 <div style="position:relative; width:360px; margin:0 auto; background:white;">
                    <div id="coord-hover" style="position:absolute; top:5px; right:5px; background:white; padding:2px 8px; border:1px solid #333; border-radius:4px; font-family:monospace; font-weight:bold; z-index:100;">(0, 0)</div>
                    <canvas id="systemCanvas" width="360" height="360" style="border:2px solid #333; display:block; cursor:crosshair;"></canvas>
                 </div>
                 <div id="graph-status" style="text-align:center; color:#3b82f6; font-weight:bold; margin-top:8px;">Line 1: Plot Point 1</div>`;
    }

    qContent.innerHTML = html;
    if (currentStep === 4) initCanvas();
}

window.handleStep = function(choice) {
    const isCorrect = (currentStep === 1) ? (currentSystem.correctCount !== 0) : false; 
    if (choice === isCorrect) { currentStep++; renderLinearUI(); }
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
            ctx.fillStyle = idx < 2 ? "#3b82f6" : "#ef4444";
            ctx.beginPath(); ctx.arc(size/2 + p.x*step, size/2 - p.y*step, 5, 0, Math.PI * 2); ctx.fill();
        });

        if (userPoints.length >= 2) renderLine(userPoints[0], userPoints[1], "#3b82f6");
        if (userPoints.length === 4) renderLine(userPoints[2], userPoints[3], "#ef4444");
    }

    function renderLine(p1, p2, color) {
        const m = (p2.y - p1.y) / (p2.x - p1.x);
        ctx.strokeStyle = color; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(size/2 + (p1.x-15)*step, size/2 - (p1.y + m*(p1.x-15 - p1.x))*step);
        ctx.lineTo(size/2 + (p1.x+15)*step, size/2 - (p1.y + m*(p1.x+15 - p1.x))*step);
        ctx.stroke();
    }

    canvas.onmousemove = function(e) {
        const rect = canvas.getBoundingClientRect();
        const gx = Math.round((e.clientX - rect.left - size/2) / step);
        const gy = Math.round((size/2 - (e.clientY - rect.top)) / step);
        if(hover) hover.innerText = `(${gx}, ${gy})`;
    };

    canvas.onclick = function(e) {
        if (userPoints.length >= 4) return;
        const rect = canvas.getBoundingClientRect();
        const gx = Math.round((e.clientX - rect.left - size/2) / step);
        const gy = Math.round((size/2 - (e.clientY - rect.top)) / step);
        
        userPoints.push({x: gx, y: gy});
        drawGrid();

        const status = document.getElementById('graph-status');
        if (userPoints.length === 2) {
            if (validate(1)) {
                if(status) status.innerText = "Line 1 Saved. Line 2: Point 1";
            } else {
                alert("Incorrect. Point not on Eq 1."); userPoints = []; drawGrid();
            }
        } else if (userPoints.length === 4) {
            if (validate(2)) {
                if(status) status.innerText = "Correct! Set Complete.";
                finishGame(); 
            } else {
                alert("Incorrect. Point not on Eq 2."); userPoints = [userPoints[0], userPoints[1]]; drawGrid();
            }
        } else {
            if(status) status.innerText = userPoints.length === 1 ? "Line 1: Point 2" : "Line 2: Point 2";
        }
    };

    function validate(n) {
        const p1 = userPoints[n===1?0:2], p2 = userPoints[n===1?1:3];
        const m = n===1?currentSystem.m1:currentSystem.m2;
        const b = n===1?currentSystem.b1:currentSystem.b2;
        if (p1.x === p2.x && p1.y === p2.y) return false;
        return (p1.y === m * p1.x + b && p2.y === m * p2.x + b);
    }

    drawGrid();
}

async function finishGame() {
    window.isCurrentQActive = false; // Stop the timer like in SolveX

    if (window.supabaseClient && window.currentUser) {
        try {
            // Get current score
            const { data } = await window.supabaseClient
                .from('assignment')
                .select('LinearSystem')
                .eq('userName', window.currentUser)
                .maybeSingle();

            let currentScore = data ? (data.LinearSystem || 0) : 0;
            let adjustment = (linearErrorCount === 0) ? 1 : 0;
            let newScore = Math.max(0, Math.min(10, currentScore + adjustment));

            // Perform Update
            await window.supabaseClient
                .from('assignment')
                .update({ LinearSystem: newScore })
                .eq('userName', window.currentUser);
            
        } catch(e) { 
            console.error("Database sync failed:", e); 
        }
    }
    
    // Exact delay and call style from the working SolveX module
    setTimeout(() => { 
        if (typeof loadNextQuestion === 'function') {
            loadNextQuestion(); 
        } else {
            location.reload();
        }
    }, 1500);
}
