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
        let startX = Math.floor(Math.random() * 3) - 1; 
        let startY = Math.floor(Math.random() * 3) - 1;
        currentShape = [[startX, startY], [startX, startY + 1], [startX + 1, startY]];
        targetShape = JSON.parse(JSON.stringify(currentShape));

        for (let i = 0; i < stepCount; i++) {
            let moveType = ['translation', 'reflectX', 'reflectY', 'rotate'][Math.floor(Math.random() * 4)];
            applyMoveToPoints(targetShape, generateMove(moveType));
        }

        let targetJSON = JSON.stringify(targetShape);
        let isOnGrid = targetShape.every(p => Math.abs(p[0]) <= 5 && Math.abs(p[1]) <= 5);
        
        if (targetJSON !== lastTargetJSON && isOnGrid) {
            lastTargetJSON = targetJSON;
            validChallenge = true;
        }
    }
    renderUI();
}

function generateMove(type) {
    if (type === 'translation') {
        let dx = 0, dy = 0;
        while (dx === 0 && dy === 0) {
            dx = Math.floor(Math.random() * 5) - 2;
            dy = Math.floor(Math.random() * 5) - 2;
        }
        return { type, dx, dy };
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
        else if (m.type === 'dilate') { p[0] *= m.factor; p[1] *= m.factor; }
    });
}

function renderUI() {
    const qContent = document.getElementById('q-content');
    if (!qContent) return;
    document.getElementById('q-title').innerText = `Transformations (Round ${currentRound}/3)`;
    
    let html = `
        <div style="display: flex; justify-content: center; margin-bottom: 10px; position:relative;">
            <canvas id="gridCanvas" width="400" height="400" style="background: white; border-radius: 8px; border: 1px solid #94a3b8;"></canvas>
            <div id="playback-label" style="display:none; position:absolute; top:10px; left:10px; background:#ef4444; color:white; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:bold; z-index:10;">ANIMATING...</div>
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
            <select id="move-selector" onchange="updateSubInputs()" style="grid-column: span 2; height:45px; font-size:1rem; border-radius:8px; border:1px solid #cbd5e1;">
                <option value="translation">Translation</option>
                <option value="reflectX">Reflection (X-Axis)</option>
                <option value="reflectY">Reflection (Y-Axis)</option>
                <option value="rotate">Rotation</option>
                <option value="dilate">Dilation</option>
            </select>
            <div id="sub-inputs" style="grid-column: span 2; display:flex; gap:20px; align-items:center; justify-content:center; padding:10px;"></div>
            <button class="primary-btn" onclick="saveMove()" style="grid-column: span 1; height:50px; border-radius:8px; background:#22c55e;">${editingIndex === -1 ? 'Add Step' : 'Update'}</button>
            <button class="primary-btn" onclick="startPlayback()" style="grid-column: span 1; background:#000; color:white; height:50px; border-radius:8px;">RUN</button>
        </div>
    `;

    qContent.innerHTML = html;
    updateSubInputs(); 
    draw(currentShape); 
}

function formatMove(m) {
    if (m.type === 'translation') return `T(${m.dx},${m.dy})`;
    if (m.type === 'reflectX') return `Ref-X`;
    if (m.type === 'reflectY') return `Ref-Y`;
    if (m.type === 'rotate') return `Rot ${m.deg}${m.dir}`;
    if (m.type === 'dilate') return `Dil x${m.factor}`;
}

window.updateSubInputs = function() {
    const val = document.getElementById('move-selector')?.value;
    const container = document.getElementById('sub-inputs');
    if (val === 'translation') {
        container.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-weight:bold;">X:</span>
                <input type="number" id="dx" value="0" style="width:100px; height:55px; text-align:center; border-radius:8px; border:1px solid #cbd5e1; font-size:1.5rem;">
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-weight:bold;">Y:</span>
                <input type="number" id="dy" value="0" style="width:100px; height:55px; text-align:center; border-radius:8px; border:1px solid #cbd5e1; font-size:1.5rem;">
            </div>`;
    } else if (val === 'rotate') {
        container.innerHTML = `
            <select id="rot-deg" style="height:50px; width:90px; border-radius:8px; font-size:1.1rem;"><option value="90">90°</option><option value="180">180°</option></select>
            <select id="rot-dir" style="height:50px; width:90px; border-radius:8px; font-size:1.1rem;"><option value="CW">CW</option><option value="CCW">CCW</option></select>`;
    } else if (val === 'dilate') {
        container.innerHTML = `Scale: <input type="number" id="dil-factor" step="0.5" value="2" style="width:100px; height:55px; text-align:center; border-radius:8px; font-size:1.5rem;">`;
    } else container.innerHTML = "";
}

window.saveMove = function() {
    const type = document.getElementById('move-selector').value;
    let m = { type };
    if (type === 'translation') { m.dx = parseInt(document.getElementById('dx').value) || 0; m.dy = parseInt(document.getElementById('dy').value) || 0; }
    else if (type === 'rotate') { m.deg = parseInt(document.getElementById('rot-deg').value); m.dir = document.getElementById('rot-dir').value; }
    else if (type === 'dilate') { m.factor = parseFloat(document.getElementById('dil-factor').value) || 1; }
    
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
        applyMoveToPoints(currentPoints, m); // Calculate final destination for this step
        let endPoints = JSON.parse(JSON.stringify(currentPoints));

        // Slide animation: 20 frames over 500ms
        const frames = 20;
        for (let f = 1; f <= frames; f++) {
            let t = f / frames;
            let interpolatedPoints = startPoints.map((p, i) => [
                p[0] + (endPoints[i][0] - p[0]) * t,
                p[1] + (endPoints[i][1] - p[1]) * t
            ]);
            draw(interpolatedPoints);
            await new Promise(r => requestAnimationFrame(r));
            await new Promise(r => setTimeout(r, 20)); // Small delay for smoothness
        }
        await new Promise(r => setTimeout(r, 200)); // Pause slightly after each step
    }
    
    document.getElementById('playback-label').style.display = 'none';
    isAnimating = false;
    checkFinalMatch(currentPoints);
}

function draw(pts) {
    const canvas = document.getElementById('gridCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d'), size = 400, step = 40, center = size/2;
    ctx.clearRect(0,0,size,size);

    ctx.strokeStyle="#e2e8f0"; ctx.beginPath();
    for(let i=0; i<=size; i+=step){ ctx.moveTo(i,0); ctx.lineTo(i,size); ctx.moveTo(0,i); ctx.lineTo(size,i); } ctx.stroke();
    
    ctx.strokeStyle="#475569"; ctx.lineWidth=2; ctx.beginPath();
    ctx.moveTo(center,0); ctx.lineTo(center,size); ctx.moveTo(0,center); ctx.lineTo(size,center); ctx.stroke();

    ctx.fillStyle = "#64748b"; ctx.font = "10px Arial"; ctx.textAlign = "center";
    for(let i = -5; i <= 5; i++) {
        if(i === 0) continue;
        ctx.fillText(i, center + (i * step), center + 15);
        ctx.fillText(i, center - 12, center - (i * step) + 4);
    }

    ctx.setLineDash([5,3]); ctx.strokeStyle="rgba(0,0,0,0.2)"; ctx.fillStyle="rgba(0,0,0,0.05)";
    drawShape(ctx, targetShape, center, step);

    ctx.setLineDash([]); ctx.strokeStyle="#166534"; ctx.fillStyle="rgba(34, 197, 94, 0.6)"; 
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
        alert("❌ Mismatch. Check your coordinates.");
        renderUI();
    }
}

async function finishGame() {
    window.isCurrentQActive = false; 
    const qContent = document.getElementById('q-content');
    qContent.innerHTML = `<div style="text-align:center; padding:40px;"><h3>Great Job!</h3><p>Updating mastery level...</p></div>`;

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
