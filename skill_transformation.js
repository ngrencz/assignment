/**
 * Transformation Geometry Game - V4
 * Fixes: Edit function, Undo logic, and Button Contrast.
 */

// Global State
var currentShape = [];
var targetShape = [];
var originalStartShape = [];
var transErrorCount = 0;
var currentRound = 1;
var editingIndex = -1;
var isAnimating = false;
var lastTargetJSON = "";
var moveSequence = [];
var sessionSkills = { translation: 0, reflection: 0, rotation: 0, dilation: 0 };
var roundResults = []; 

const SHAPES = {
    rightTriangle: [[0,0], [0,3], [3,0]],
    isoscelesTriangle: [[0,0], [2,4], [4,0]],
    rectangle: [[0,0], [0,2], [4,2], [4,0]],
    trapezoid: [[0,0], [1,2], [3,2], [4,0]],
    parallelogram: [[0,0], [3,0], [4,2], [1,2]],
    star: [[0,2], [0.5,0.5], [2,0.5], [0.8,-0.5], [1,-2], [0,-1], [-1,-2], [-0.8,-0.5], [-2,0.5], [-0.5,0.5]]
};

window.initTransformationGame = async function() {
    window.isCurrentQActive = true;
    window.currentQSeconds = 0;
    transErrorCount = 0;
    currentRound = 1;
    roundResults = [];
    sessionSkills = { translation: 0, reflection: 0, rotation: 0, dilation: 0 };

    try {
        const { data } = await window.supabaseClient
            .from('assignment')
            .select('C6Translation, C6Reflection, C6Rotation, C6Dilation, C6Transformation')
            .eq('userName', window.currentUser)
            .maybeSingle();
        window.userProgress = data || { C6Translation: 0, C6Reflection: 0, C6Rotation: 0, C6Dilation: 0, C6Transformation: 0 };
    } catch (e) {
        window.userProgress = { C6Translation: 0, C6Reflection: 0, C6Rotation: 0, C6Dilation: 0, C6Transformation: 0 };
    }
    startNewRound();
};

function startNewRound() {
    moveSequence = [];
    editingIndex = -1;
    isAnimating = false;
    
    let skills = [
        { name: 'translation', val: window.userProgress.C6Translation },
        { name: 'reflection', val: window.userProgress.C6Reflection },
        { name: 'rotation', val: window.userProgress.C6Rotation },
        { name: 'dilation', val: window.userProgress.C6Dilation }
    ].sort((a, b) => a.val - b.val);

    let validChallenge = false;
    while (!validChallenge) {
        const shapeKeys = Object.keys(SHAPES);
        const baseCoords = SHAPES[shapeKeys[Math.floor(Math.random() * shapeKeys.length)]];
        let offX = Math.floor(Math.random() * 5) - 2;
        let offY = Math.floor(Math.random() * 5) - 2;
        currentShape = baseCoords.map(p => [p[0] + offX, p[1] + offY]);
        originalStartShape = JSON.parse(JSON.stringify(currentShape));
        targetShape = JSON.parse(JSON.stringify(currentShape));

        let stepCount = Math.max(3, Math.floor(Math.random() * 2) + 3);
        for (let i = 0; i < stepCount; i++) {
            let typePool = Math.random() > 0.4 ? [skills[0].name] : ['translation', 'reflection', 'rotation', 'dilation'];
            let pickedType = typePool[Math.floor(Math.random() * typePool.length)];
            if (pickedType === 'reflection') pickedType = Math.random() > 0.5 ? 'reflectX' : 'reflectY';
            applyMoveToPoints(targetShape, generateMove(pickedType));
        }

        let isOnGrid = targetShape.every(p => Math.abs(p[0]) <= 10 && Math.abs(p[1]) <= 10);
        if (JSON.stringify(targetShape) !== JSON.stringify(originalStartShape) && isOnGrid) validChallenge = true;
    }
    renderUI();
}

function generateMove(type) {
    if (type === 'translation') return { type, dx: Math.floor(Math.random() * 5) - 2, dy: Math.floor(Math.random() * 5) - 2 };
    if (type === 'rotate') return { type, deg: [90, 180][Math.floor(Math.random() * 2)], dir: ['CW', 'CCW'][Math.floor(Math.random() * 2)] };
    if (type === 'dilation') return { type, factor: [0.25, 0.5, 0.75, 2, 3][Math.floor(Math.random() * 5)] };
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
        else if (m.type === 'dilation') { p[0] *= m.factor; p[1] *= m.factor; }
    });
}

function renderUI() {
    const qContent = document.getElementById('q-content');
    if (!qContent) return;
    document.getElementById('q-title').innerText = `Transformations (Round ${currentRound}/3)`;
    
    qContent.innerHTML = `
        <div style="display: flex; justify-content: center; margin-bottom: 10px; position:relative;">
            <canvas id="gridCanvas" width="440" height="440" style="background: white; border-radius: 8px; border: 1px solid #94a3b8; cursor: crosshair;"></canvas>
            <div id="coord-tip" style="position:absolute; bottom:10px; right:10px; background:rgba(15, 23, 42, 0.8); color:white; padding:4px 10px; border-radius:4px; font-family:monospace; font-size:11px; pointer-events:none;">(0, 0)</div>
        </div>
        
        <div id="user-sequence" style="min-height:45px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:8px; margin-bottom:12px; display:flex; flex-wrap:wrap; gap:6px;">
            ${moveSequence.map((m, i) => `
                <div style="display:flex; align-items:center; background:#334155; color:white; border-radius:4px; font-size:11px;">
                    <div onclick="${isAnimating ? '' : `editStep(${i})`}" style="padding:4px 8px; cursor:pointer;">${i+1}. ${formatMove(m)}</div>
                    <div onclick="${isAnimating ? '' : `undoTo(${i})`}" style="padding:4px 6px; background:rgba(255,255,255,0.1); cursor:pointer; border-left:1px solid rgba(255,255,255,0.1);">✕</div>
                </div>`).join('')}
            ${moveSequence.length === 0 ? '<span style="color:#94a3b8; font-size:12px;">Add a move...</span>' : ''}
        </div>

        <div id="control-panel" style="background:#fff; border:1px solid #e2e8f0; padding:12px; border-radius:10px; display:grid; grid-template-columns: 1fr 1fr; gap:10px; pointer-events: ${isAnimating ? 'none' : 'auto'}; opacity: ${isAnimating ? 0.7 : 1};">
            <select id="move-selector" onchange="updateSubInputs()" style="grid-column: span 2; height:35px; border-radius:6px;">
                <option value="translation">Translation</option>
                <option value="reflectX">Reflection (X-Axis)</option>
                <option value="reflectY">Reflection (Y-Axis)</option>
                <option value="rotate">Rotation (Origin)</option>
                <option value="dilation">Dilation (Origin)</option>
            </select>
            <div id="sub-inputs" style="grid-column: span 2; display:flex; gap:10px; align-items:center; justify-content:center; padding:5px;"></div>
            
            <button onclick="executeAction()" style="grid-column: span 2; height:40px; background:#22c55e; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">
                ${editingIndex === -1 ? 'APPLY MOVE' : 'UPDATE & REPLAY'}
            </button>
            <button onclick="checkWin()" style="grid-column: span 1; height:35px; background:#0f172a; color:white; border-radius:6px; font-size:12px; cursor:pointer;">CHECK MATCH</button>
            <button onclick="resetToStart()" style="grid-column: span 1; height:35px; background:#334155; color:white; border:none; border-radius:6px; font-size:12px; cursor:pointer; font-weight:bold;">RESET ALL</button>
            ${editingIndex !== -1 ? `<button onclick="cancelEdit()" style="grid-column: span 2; height:30px; background:#94a3b8; color:white; border:none; border-radius:6px; font-size:11px; cursor:pointer;">Cancel Edit</button>` : ''}
        </div>
    `;

    setupCanvas();
    updateSubInputs(); 
    draw(currentShape); 
}

function formatMove(m) {
    if (m.type === 'translation') return `T(${m.dx},${m.dy})`;
    if (m.type === 'reflectX') return `Ref-X`;
    if (m.type === 'reflectY') return `Ref-Y`;
    if (m.type === 'rotate') return `Rot ${m.deg}${m.dir}`;
    if (m.type === 'dilation') return `Dil x${m.factor}`;
}

function setupCanvas() {
    const canvas = document.getElementById('gridCanvas');
    const tip = document.getElementById('coord-tip');
    if (!canvas) return;
    canvas.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const gridX = Math.round((e.clientX - rect.left - 220) / 20);
        const gridY = Math.round((220 - (e.clientY - rect.top)) / 20);
        if (Math.abs(gridX) <= 10 && Math.abs(gridY) <= 10) tip.innerText = `(${gridX}, ${gridY})`;
    };
}

window.updateSubInputs = function() {
    const val = document.getElementById('move-selector').value;
    const container = document.getElementById('sub-inputs');
    let existing = (editingIndex !== -1) ? moveSequence[editingIndex] : null;

    if (val === 'translation') {
        container.innerHTML = `
            X: <input type="number" id="dx" value="${existing?.dx || 0}" style="width:70px; height:35px; text-align:center;">
            Y: <input type="number" id="dy" value="${existing?.dy || 0}" style="width:70px; height:35px; text-align:center;">`;
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
    } else if (val === 'dilation') {
        container.innerHTML = `Scale: <input type="number" id="dil-factor" step="0.25" value="${existing?.factor || 1}" style="width:80px; height:35px; text-align:center;">`;
    } else container.innerHTML = "";
}

window.editStep = function(i) {
    editingIndex = i;
    const move = moveSequence[i];
    renderUI();
    document.getElementById('move-selector').value = move.type;
    updateSubInputs();
};

window.cancelEdit = function() {
    editingIndex = -1;
    renderUI();
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
    } else if (type === 'dilation') {
        m.factor = parseFloat(document.getElementById('dil-factor').value) || 1;
    }

    if (editingIndex === -1) {
        moveSequence.push(m);
        await animateMove(currentShape, m);
    } else {
        moveSequence[editingIndex] = m;
        editingIndex = -1;
        await replayAll();
    }
    renderUI();
};

async function animateMove(pts, m) {
    isAnimating = true;
    let startPoints = JSON.parse(JSON.stringify(pts));
    applyMoveToPoints(pts, m);
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
    // Remove selected step and everything after it
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

    // Ghost Target
    ctx.setLineDash([4,2]); ctx.strokeStyle="rgba(0,0,0,0.2)"; ctx.fillStyle="rgba(0,0,0,0.03)";
    drawShape(ctx, targetShape, center, step);

    // Current Shape
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
        roundResults.push(1);
        currentRound++;
        if (currentRound > 3) finishGame();
        else { alert("✅ Success!"); startNewRound(); }
    } else {
        transErrorCount++;
        roundResults.push(0);
        let lastMove = moveSequence[moveSequence.length - 1];
        if (lastMove) {
            let cat = lastMove.type.includes('reflect') ? 'reflection' : (lastMove.type === 'rotate' ? 'rotation' : (lastMove.type === 'dilation' ? 'dilation' : 'translation'));
            sessionSkills[cat]++;
        }
        alert("❌ Shapes do not match yet.");
    }
};

async function finishGame() {
    window.isCurrentQActive = false; 
    document.getElementById('q-content').innerHTML = `<div style="text-align:center; padding:40px;"><h3>Session Complete</h3><p>Saving progress...</p></div>`;

    if (window.supabaseClient && window.currentUser) {
        let updates = {};
        ['translation', 'reflection', 'rotation', 'dilation'].forEach(skill => {
            let errors = sessionSkills[skill];
            let key = `C6${skill.charAt(0).toUpperCase() + skill.slice(1)}`;
            let currentVal = window.userProgress[key] || 0;
            let change = (errors === 0) ? 1 : (errors >= 2 ? -1 : 0);
            updates[key] = Math.max(0, Math.min(10, currentVal + change));
        });

        let winCount = roundResults.filter(r => r === 1).length;
        let successRate = (winCount / roundResults.length) * 100;
        let aggChange = (successRate >= 70) ? 1 : (successRate <= 50 ? -1 : 0);
        updates.C6Transformation = Math.max(0, Math.min(10, (window.userProgress.C6Transformation || 0) + aggChange));

        await window.supabaseClient.from('assignment').update(updates).eq('userName', window.currentUser);
    }
    
    setTimeout(() => { if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion(); }, 1500);
}
