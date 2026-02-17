// Global State
var currentShape = [];
var targetShape = [];
var originalStartShape = []; // To allow "Reset to Start"
var transErrorCount = 0;
var currentMastery = 0;
var moveSequence = []; 
var currentRound = 1;
var editingIndex = -1; 
var isAnimating = false;
var lastTargetJSON = ""; 

window.initTransformationGame = async function() {
    window.isCurrentQActive = true;
    window.currentQSeconds = 0;
    transErrorCount = 0;
    currentRound = 1;
    editingIndex = -1;

    try {
        const { data } = await window.supabaseClient
            .from('assignment')
            .select('*')
            .eq('userName', window.currentUser)
            .maybeSingle();
        currentMastery = data?.C6Transformation || 0;
    } catch (e) {
        currentMastery = 0;
    }

    startNewRound();
};

function startNewRound() {
    moveSequence = [];
    editingIndex = -1;
    isAnimating = false;
    
    // Force a minimum of 3 steps, up to 6 based on mastery
    let minSteps = Math.max(3, currentMastery >= 5 ? 4 : 3);
    let stepCount = minSteps + Math.floor(Math.random() * 3);

    let validChallenge = false;
    while (!validChallenge) {
        let startX = Math.floor(Math.random() * 5) - 2; 
        let startY = Math.floor(Math.random() * 5) - 2;
        originalStartShape = [[startX, startY], [startX, startY + 2], [startX + 2, startY]];
        currentShape = JSON.parse(JSON.stringify(originalStartShape));
        targetShape = JSON.parse(JSON.stringify(currentShape));

        for (let i = 0; i < stepCount; i++) {
            let moveType = ['translation', 'reflectX', 'reflectY', 'rotate'][Math.floor(Math.random() * 4)];
            applyMoveToPoints(targetShape, generateMove(moveType));
        }

        let targetJSON = JSON.stringify(targetShape);
        let isOnGrid = targetShape.every(p => Math.abs(p[0]) <= 10 && Math.abs(p[1]) <= 10);
        let isDifferent = targetJSON !== JSON.stringify(originalStartShape);
        
        if (targetJSON !== lastTargetJSON && isOnGrid && isDifferent) {
            lastTargetJSON = targetJSON;
            validChallenge = true;
        }
    }
    renderUI();
}

function generateMove(type) {
    if (type === 'translation') {
        let dx = 0, dy = 0;
        while(dx === 0 && dy === 0) {
            dx = Math.floor(Math.random() * 7) - 3;
            dy = Math.floor(Math.random() * 7) - 3;
        }
        return { type, dx, dy };
    }
    if (type === 'rotate') {
        return { type, deg: [90, 180][Math.floor(Math.random() * 2)], dir: ['CW', 'CCW'][Math.floor(Math.random() * 2)] };
    }
    return { type };
}

function applyMoveToPoints(pts, m) {
    pts.forEach(p => {
        let x = p[0], y = p[1];
        if (m.type === 'translation') { p[0] += m.dx; p[1] += m.dy; }
        else if (m.type === 'reflectX') { p[1] = -y; }
        else if (m.type === 'reflectY') { p[0] = -x; }
        else if (m.type === 'rotate') {
            if (m.deg === 180) { p[0] = -x; p[1] = -y; }
            else if ((m.deg === 90 && m.dir === 'CW')) { p[0] = y; p[1] = -x; }
            else if ((m.deg === 90 && m.dir === 'CCW')) { p[0] = -y; p[1] = x; }
        }
    });
}

function renderUI() {
    const qContent = document.getElementById('q-content');
    if (!qContent) return;
    document.getElementById('q-title').innerText = `Transformations (Round ${currentRound}/3)`;
    
    let html = `
        <div style="display: flex; justify-content: center; margin-bottom: 10px; position:relative;">
            <canvas id="gridCanvas" width="440" height="440" style="background: white; border-radius: 8px; border: 1px solid #94a3b8; cursor: crosshair;"></canvas>
            <div id="coord-tip" style="position:absolute; bottom:10px; right:10px; background:rgba(15, 23, 42, 0.8); color:white; padding:4px 10px; border-radius:4px; font-family:monospace; font-size:11px; pointer-events:none;">(0, 0)</div>
        </div>
        
        <div id="user-sequence" style="min-height:45px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:8px; margin-bottom:12px; display:flex; flex-wrap:wrap; gap:6px;">
            ${moveSequence.map((m, i) => `
                <div style="display:flex; align-items:center; background:#334155; color:white; border-radius:4px; font-size:11px;">
                    <div onclick="${isAnimating ? '' : `editStep(${i})`}" style="padding:4px 8px; cursor:pointer;">${i+1}. ${formatMove(m)}</div>
                    <div onclick="${isAnimating ? '' : `undoTo(${i})`}" style="padding:4px 6px; background:rgba(255,0,0,0.2); cursor:pointer; border-left:1px solid rgba(255,255,255,0.1);">✕</div>
                </div>`).join('')}
            ${moveSequence.length === 0 ? '<span style="color:#94a3b8; font-size:12px;">Add your first move...</span>' : ''}
        </div>

        <div id="control-panel" style="background:#fff; border:1px solid #e2e8f0; padding:12px; border-radius:10px; display:grid; grid-template-columns: 1fr 1fr; gap:10px; pointer-events: ${isAnimating ? 'none' : 'auto'}; opacity: ${isAnimating ? 0.7 : 1};">
            <select id="move-selector" onchange="updateSubInputs()" style="grid-column: span 2; height:35px; border-radius:6px;">
                <option value="translation">Translation</option>
                <option value="reflectX">Reflection (X-Axis)</option>
                <option value="reflectY">Reflection (Y-Axis)</option>
                <option value="rotate">Rotation</option>
            </select>
            <div id="sub-inputs" style="grid-column: span 2; display:flex; gap:10px; align-items:center; justify-content:center; padding:5px;"></div>
            
            <button onclick="executeAction()" style="grid-column: span 2; height:40px; background:#22c55e; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">
                ${editingIndex === -1 ? 'APPLY MOVE' : 'UPDATE & REPLAY'}
            </button>
            <button onclick="checkWin()" style="grid-column: span 1; height:35px; background:#0f172a; color:white; border-radius:6px; font-size:12px;">CHECK MATCH</button>
            <button onclick="resetToStart()" style="grid-column: span 1; height:35px; background:#f1f5f9; border:1px solid #cbd5e1; border-radius:6px; font-size:12px;">RESET ALL</button>
        </div>
    `;

    qContent.innerHTML = html;
    setupCanvas();
    updateSubInputs(); 
    draw(currentShape); 
}

function formatMove(m) {
    if (m.type === 'translation') return `T(${m.dx},${m.dy})`;
    if (m.type === 'reflectX') return `Ref-X`;
    if (m.type === 'reflectY') return `Ref-Y`;
    if (m.type === 'rotate') return `Rot ${m.deg}${m.dir}`;
}

function setupCanvas() {
    const canvas = document.getElementById('gridCanvas');
    const tip = document.getElementById('coord-tip');
    if (!canvas) return;
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const gridX = Math.round((e.clientX - rect.left - 220) / 20);
        const gridY = Math.round((220 - (e.clientY - rect.top)) / 20);
        if (Math.abs(gridX) <= 10 && Math.abs(gridY) <= 10) tip.innerText = `(${gridX}, ${gridY})`;
    });
}

window.updateSubInputs = function() {
    const val = document.getElementById('move-selector').value;
    const container = document.getElementById('sub-inputs');
    // If we are editing, pre-fill the values
    let existing = (editingIndex !== -1) ? moveSequence[editingIndex] : null;

    if (val === 'translation') {
        container.innerHTML = `
            X: <input type="number" id="dx" value="${existing?.dx || 0}" style="width:80px; height:35px; text-align:center;">
            Y: <input type="number" id="dy" value="${existing?.dy || 0}" style="width:80px; height:35px; text-align:center;">`;
    } else if (val === 'rotate') {
        container.innerHTML = `
            <select id="rot-deg" style="height:35px;">
                <option value="90" ${existing?.deg == 90 ? 'selected' : ''}>90°</option>
                <option value="180" ${existing?.deg == 180 ? 'selected' : ''}>180°</option>
            </select>
            <select id="rot-dir" style="height:35px;">
                <option value="CW" ${existing?.dir == 'CW' ? 'selected' : ''}>CW</option>
                <option value="CCW" ${existing?.dir == 'CCW' ? 'selected' : ''}>CCW</option>
            </select>`;
    } else container.innerHTML = "";
}

window.editStep = function(i) {
    editingIndex = i;
    const move = moveSequence[i];
    renderUI(); // Re-render to show edit mode
    document.getElementById('move-selector').value = move.type;
    updateSubInputs(); // Refresh inputs to show specific values
};

window.executeAction = async function() {
    const type = document.getElementById('move-selector').value;
    let m = { type };
    if (type === 'translation') {
        m.dx = parseInt(document.getElementById('dx').value) || 0;
        m.dy = parseInt(document.getElementById('dy').value) || 0;
    } else if (type === 'rotate') {
        m.deg = parseInt(document.getElementById('rot-deg').value);
        m.dir = document.getElementById('rot-dir').value;
    }

    if (editingIndex === -1) {
        // Normal Step-by-Step behavior
        moveSequence.push(m);
        await animateMove(currentShape, m);
    } else {
        // Update specific step and REPLAY from start to show new outcome
        moveSequence[editingIndex] = m;
        editingIndex = -1;
        await replayAll();
    }
    renderUI();
};

async function animateMove(pts, m) {
    isAnimating = true;
    let startPoints = JSON.parse(JSON.stringify(pts));
    applyMoveToPoints(pts, m); // Update 'currentShape' state
    let endPoints = JSON.parse(JSON.stringify(pts));

    const frames = 15;
    for (let f = 1; f <= frames; f++) {
        let t = f / frames;
        let interp = startPoints.map((p, i) => [
            p[0] + (endPoints[i][0] - p[0]) * t,
            p[1] + (endPoints[i][1] - p[1]) * t
        ]);
        draw(interp);
        await new Promise(r => setTimeout(r, 20));
    }
    isAnimating = false;
}

async function replayAll() {
    currentShape = JSON.parse(JSON.stringify(originalStartShape));
    draw(currentShape);
    for (let m of moveSequence) {
        await animateMove(currentShape, m);
        await new Promise(r => setTimeout(r, 100));
    }
}

window.undoTo = function(i) {
    moveSequence.splice(i);
    replayAll().then(() => renderUI());
};

window.resetToStart = function() {
    moveSequence = [];
    currentShape = JSON.parse(JSON.stringify(originalStartShape));
    renderUI();
};

function draw(pts) {
    const canvas = document.getElementById('gridCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d'), step = 20, center = 220;
    ctx.clearRect(0,0,440,440);

    ctx.strokeStyle="#f1f5f9"; ctx.beginPath();
    for(let i=0; i<=440; i+=step){ ctx.moveTo(i,0); ctx.lineTo(i,440); ctx.moveTo(0,i); ctx.lineTo(440,i); } ctx.stroke();
    
    ctx.strokeStyle="#64748b"; ctx.lineWidth=2; ctx.beginPath();
    ctx.moveTo(center,0); ctx.lineTo(center,440); ctx.moveTo(0,center); ctx.lineTo(440,center); ctx.stroke();

    ctx.fillStyle = "#94a3b8"; ctx.font = "9px Arial"; ctx.textAlign = "center";
    for(let i = -10; i <= 10; i++) {
        if(i === 0) continue;
        ctx.fillText(i, center + (i * step), center + 12);
        ctx.fillText(i, center - 10, center - (i * step) + 3);
    }

    ctx.setLineDash([4,2]); ctx.strokeStyle="rgba(0,0,0,0.2)"; ctx.fillStyle="rgba(0,0,0,0.03)";
    drawShape(ctx, targetShape, center, step);

    ctx.setLineDash([]); ctx.strokeStyle="#15803d"; ctx.fillStyle="rgba(34, 197, 94, 0.6)"; 
    drawShape(ctx, pts, center, step);
}

function drawShape(ctx, pts, center, step) {
    ctx.beginPath();
    pts.forEach((p, i) => {
        let x = center + (p[0] * step), y = center - (p[1] * step);
        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.closePath(); ctx.fill(); ctx.stroke();
}

window.checkWin = function() {
    const isCorrect = currentShape.every((p, i) => 
        Math.abs(p[0] - targetShape[i][0]) < 0.1 && 
        Math.abs(p[1] - targetShape[i][1]) < 0.1
    );

    if (isCorrect) {
        currentRound++;
        if (currentRound > 3) finishGame();
        else { alert("✅ Target Reached!"); startNewRound(); }
    } else {
        transErrorCount++;
        alert("❌ Shapes do not match yet. Keep transforming!");
    }
};

async function finishGame() {
    window.isCurrentQActive = false; 
    document.getElementById('q-content').innerHTML = `<div style="text-align:center; padding:40px;"><h3>Perfect!</h3><p>Mastery levels updated.</p></div>`;
    if (window.supabaseClient && window.currentUser) {
        let adj = (transErrorCount === 0) ? 1 : (transErrorCount > 3 ? -1 : 0);
        let newScore = Math.max(0, Math.min(10, currentMastery + adj));
        await window.supabaseClient.from('assignment').update({ C6Transformation: newScore }).eq('userName', window.currentUser);
    }
    setTimeout(() => { if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion(); }, 1500);
}
