// Global State
var currentShape = [];
var targetShape = [];
var transErrorCount = 0;
var currentMastery = 0;
var moveSequence = []; 
var currentRound = 1;
var editingIndex = -1; 
var isAnimating = false;
var lastTargetJSON = ""; 
var mousePos = { x: 0, y: 0 };

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
    
    let minSteps = currentMastery >= 8 ? 4 : (currentMastery >= 5 ? 3 : 2);
    let maxSteps = minSteps + 2;
    let stepCount = Math.floor(Math.random() * (maxSteps - minSteps + 1)) + minSteps;

    let validChallenge = false;
    while (!validChallenge) {
        // Start shape near center
        let startX = Math.floor(Math.random() * 5) - 2; 
        let startY = Math.floor(Math.random() * 5) - 2;
        currentShape = [[startX, startY], [startX, startY + 2], [startX + 2, startY]];
        targetShape = JSON.parse(JSON.stringify(currentShape));

        for (let i = 0; i < stepCount; i++) {
            let moveType = ['translation', 'reflectX', 'reflectY', 'rotate'][Math.floor(Math.random() * 4)];
            applyMoveToPoints(targetShape, generateMove(moveType));
        }

        let targetJSON = JSON.stringify(targetShape);
        // Ensure all points are within -10 to 10
        let isOnGrid = targetShape.every(p => Math.abs(p[0]) <= 10 && Math.abs(p[1]) <= 10);
        
        if (targetJSON !== lastTargetJSON && isOnGrid) {
            lastTargetJSON = targetJSON;
            validChallenge = true;
        }
    }
    renderUI();
}

function generateMove(type) {
    if (type === 'translation') {
        return { type, dx: Math.floor(Math.random() * 7) - 3, dy: Math.floor(Math.random() * 7) - 3 };
    }
    if (type === 'reflectX' || type === 'reflectY') return { type };
    if (type === 'rotate') {
        return { type, deg: [90, 180][Math.floor(Math.random() * 2)], dir: ['CW', 'CCW'][Math.floor(Math.random() * 2)] };
    }
    return { type: 'translation', dx: 1, dy: 1 };
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
            <div id="playback-label" style="display:none; position:absolute; top:10px; left:10px; background:#ef4444; color:white; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:bold; z-index:10;">ANIMATING...</div>
            <div id="coord-tip" style="position:absolute; bottom:10px; right:10px; background:rgba(15, 23, 42, 0.8); color:white; padding:4px 10px; border-radius:4px; font-family:monospace; font-size:12px; pointer-events:none;">(0, 0)</div>
        </div>
        
        <div id="user-sequence" style="min-height:50px; background:#f1f5f9; border:2px dashed #cbd5e1; border-radius:12px; padding:10px; margin-bottom:15px; display:flex; flex-wrap:wrap; gap:8px;">
            ${moveSequence.length === 0 ? '<span style="color:#64748b; font-size:0.85rem; padding:5px;">Steps:</span>' : 
                moveSequence.map((m, i) => `
                <div style="display:flex; align-items:center; background:${editingIndex === i ? '#2563eb' : '#334155'}; color:white; border-radius:6px; overflow:hidden; font-size:11px; font-weight:bold;">
                    <div onclick="${isAnimating ? '' : `editStep(${i})`}" style="padding:6px 10px; cursor:pointer;">${formatMove(m)}</div>
                    <div onclick="${isAnimating ? '' : `deleteStep(${i})`}" style="padding:6px 8px; background:rgba(255,0,0,0.2); cursor:pointer; border-left:1px solid rgba(255,255,255,0.1);">×</div>
                </div>`).join('')}
        </div>

        <div id="control-panel" style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; pointer-events: ${isAnimating ? 'none' : 'auto'}; opacity: ${isAnimating ? 0.5 : 1};">
            <select id="move-selector" onchange="updateSubInputs()" style="grid-column: span 2; height:38px; font-size:0.95rem; border-radius:6px; border:1px solid #cbd5e1;">
                <option value="translation">Translation</option>
                <option value="reflectX">Reflection (X-Axis)</option>
                <option value="reflectY">Reflection (Y-Axis)</option>
                <option value="rotate">Rotation</option>
            </select>
            <div id="sub-inputs" style="grid-column: span 2; display:flex; gap:15px; align-items:center; justify-content:center; padding:5px;"></div>
            <button class="primary-btn" onclick="saveMove()" style="grid-column: span 1; height:42px; border-radius:6px; background:#22c55e;">${editingIndex === -1 ? 'Add Step' : 'Update'}</button>
            <button class="primary-btn" onclick="startPlayback()" style="grid-column: span 1; background:#000; color:white; height:42px; border-radius:6px;">RUN</button>
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
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Convert to grid coords (20x20 grid, 440px canvas, 20px offset/border each side = 20px steps)
        const gridX = Math.round((x - 220) / 20);
        const gridY = Math.round((220 - y) / 20);
        
        if (Math.abs(gridX) <= 10 && Math.abs(gridY) <= 10) {
            tip.innerText = `(${gridX}, ${gridY})`;
        }
    });
}

window.updateSubInputs = function() {
    const val = document.getElementById('move-selector')?.value;
    const container = document.getElementById('sub-inputs');
    if (val === 'translation') {
        container.innerHTML = `
            <div style="display:flex; align-items:center; gap:5px;">
                <span>X:</span>
                <input type="number" id="dx" value="0" style="width:90px; height:35px; text-align:center; border-radius:4px; border:1px solid #cbd5e1; font-size:1rem;">
            </div>
            <div style="display:flex; align-items:center; gap:5px;">
                <span>Y:</span>
                <input type="number" id="dy" value="0" style="width:90px; height:35px; text-align:center; border-radius:4px; border:1px solid #cbd5e1; font-size:1rem;">
            </div>`;
    } else if (val === 'rotate') {
        container.innerHTML = `
            <select id="rot-deg" style="height:35px;"><option value="90">90°</option><option value="180">180°</option></select>
            <select id="rot-dir" style="height:35px;"><option value="CW">CW</option><option value="CCW">CCW</option></select>`;
    } else container.innerHTML = "";
}

window.saveMove = function() {
    const type = document.getElementById('move-selector').value;
    let m = { type };
    if (type === 'translation') { 
        m.dx = parseInt(document.getElementById('dx').value) || 0; 
        m.dy = parseInt(document.getElementById('dy').value) || 0; 
    }
    else if (type === 'rotate') { 
        m.deg = parseInt(document.getElementById('rot-deg').value); 
        m.dir = document.getElementById('rot-dir').value; 
    }
    
    if (editingIndex === -1) moveSequence.push(m);
    else { moveSequence[editingIndex] = m; editingIndex = -1; }
    renderUI();
};

window.editStep = function(i) { editingIndex = i; renderUI(); };
window.deleteStep = function(i) { moveSequence.splice(i, 1); editingIndex = -1; renderUI(); };

async function startPlayback() {
    if (moveSequence.length === 0 || isAnimating) return;
    isAnimating = true; renderUI();
    document.getElementById('playback-label').style.display = 'block';

    let currentPoints = JSON.parse(JSON.stringify(currentShape));
    
    for (let m of moveSequence) {
        let startPoints = JSON.parse(JSON.stringify(currentPoints));
        applyMoveToPoints(currentPoints, m);
        let endPoints = JSON.parse(JSON.stringify(currentPoints));

        const frames = 15;
        for (let f = 1; f <= frames; f++) {
            let t = f / frames;
            let interpolatedPoints = startPoints.map((p, i) => [
                p[0] + (endPoints[i][0] - p[0]) * t,
                p[1] + (endPoints[i][1] - p[1]) * t
            ]);
            draw(interpolatedPoints);
            await new Promise(r => setTimeout(r, 25));
        }
        await new Promise(r => setTimeout(r, 150));
    }
    
    document.getElementById('playback-label').style.display = 'none';
    isAnimating = false;
    checkFinalMatch(currentPoints);
}

function draw(pts) {
    const canvas = document.getElementById('gridCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d'), size = 440, step = 20, center = size/2;
    ctx.clearRect(0,0,size,size);

    // Grid Lines
    ctx.strokeStyle="#f1f5f9"; ctx.lineWidth=1;
    ctx.beginPath();
    for(let i=0; i<=size; i+=step){ ctx.moveTo(i,0); ctx.lineTo(i,size); ctx.moveTo(0,i); ctx.lineTo(size,i); } ctx.stroke();
    
    // Main Axes
    ctx.strokeStyle="#64748b"; ctx.lineWidth=2; ctx.beginPath();
    ctx.moveTo(center,0); ctx.lineTo(center,size); ctx.moveTo(0,center); ctx.lineTo(size,center); ctx.stroke();

    // Axis Labels
    ctx.fillStyle = "#94a3b8"; ctx.font = "9px Arial"; ctx.textAlign = "center";
    for(let i = -10; i <= 10; i++) {
        if(i === 0) continue;
        ctx.fillText(i, center + (i * step), center + 12);
        ctx.fillText(i, center - 10, center - (i * step) + 3);
    }

    // Ghost (Target)
    ctx.setLineDash([4,2]); ctx.strokeStyle="rgba(0,0,0,0.25)"; ctx.fillStyle="rgba(0,0,0,0.05)";
    drawShape(ctx, targetShape, center, step);

    // Active Shape
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

function checkFinalMatch(finalPts) {
    const isCorrect = finalPts.every((p, i) => 
        Math.abs(p[0] - targetShape[i][0]) < 0.1 && 
        Math.abs(p[1] - targetShape[i][1]) < 0.1
    );

    if (isCorrect) {
        currentRound++;
        if (currentRound > 3) finishGame();
        else { alert("✅ Success!"); startNewRound(); }
    } else {
        transErrorCount++;
        alert("❌ Mismatch. Check your coordinates and try again.");
        renderUI();
    }
}

async function finishGame() {
    window.isCurrentQActive = false; 
    const qContent = document.getElementById('q-content');
    qContent.innerHTML = `<div style="text-align:center; padding:40px;"><h3>Great Job!</h3><p>Saving progress...</p></div>`;

    if (window.supabaseClient && window.currentUser) {
        try {
            let adj = (transErrorCount === 0) ? 1 : (transErrorCount > 3 ? -1 : 0);
            let newScore = Math.max(0, Math.min(10, currentMastery + adj));
            await window.supabaseClient.from('assignment').update({ C6Transformation: newScore }).eq('userName', window.currentUser);
        } catch(e) { console.error(e); }
    }
    
    setTimeout(() => { 
        if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion(); 
        else location.reload(); 
    }, 1500);
}
