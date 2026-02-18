/**
 * skill_transformation.js
 * - Interactive Transformation Game (Translation, Reflection, Rotation, Dilation).
 * - Features "Strict Scoring": Detects if user splits a diagonal translation into two steps.
 * - Adaptive: Weights specific transformation types based on sub-skill mastery.
 * - Updates specific columns: C6Translation, C6ReflectionX, C6ReflectionY, C6Rotation, C6Dilation.
 */

var transformData = {
    currentShape: [],
    targetShape: [],
    startShape: [], // The state at the beginning of the round (for Reset)
    round: 1,
    maxRounds: 3,
    editingIndex: -1,
    isAnimating: false,
    userMoves: [],
    optimalMoves: [], // The computer generated path
    activeSkills: [], // List of skill keys used in this problem
    mastery: {}       // Local cache of user scores
};

const TF_SHAPES = {
    rightTriangle: [[0,0], [0,3], [3,0]],
    isoscelesTriangle: [[0,0], [2,4], [4,0]],
    rectangle: [[0,0], [0,2], [4,2], [4,0]],
    trapezoid: [[0,0], [1,2], [3,2], [4,0]],
    parallelogram: [[0,0], [3,0], [4,2], [1,2]],
    L_shape: [[0,0], [0,4], [2,4], [2,2], [4,2], [4,0]]
};

window.initTransformationGame = async function() {
    if (!document.getElementById('q-content')) return;

    // Reset State
    transformData.round = 1;
    transformData.userMoves = [];
    transformData.isAnimating = false;
    
    // Init Mastery Cache
    transformData.mastery = { 
        C6Translation: 0, C6ReflectionX: 0, C6ReflectionY: 0, 
        C6Rotation: 0, C6Dilation: 0, C6Transformation: 0 
    };

    if (!window.userMastery) window.userMastery = {};

    // Sync from Supabase
    try {
        if (window.supabaseClient && window.currentUser) {
            const h = sessionStorage.getItem('target_hour') || "00";
            const { data } = await window.supabaseClient
                .from('assignment')
                .select('C6Translation, C6ReflectionX, C6ReflectionY, C6Rotation, C6Dilation, C6Transformation')
                .eq('userName', window.currentUser)
                .eq('hour', h)
                .maybeSingle();
            
            if (data) {
                Object.assign(transformData.mastery, data);
                Object.assign(window.userMastery, data); // Sync global
            }
        }
    } catch (e) { console.log("Sync error", e); }
    
    startTransformRound();
};

function startTransformRound() {
    transformData.userMoves = [];
    transformData.optimalMoves = [];
    transformData.activeSkills = [];
    transformData.editingIndex = -1;
    transformData.isAnimating = false;
    
    // 1. Adaptive Weighting
    let skills = [
        { type: 'translation', key: 'C6Translation', score: transformData.mastery.C6Translation },
        { type: 'reflectX', key: 'C6ReflectionX', score: transformData.mastery.C6ReflectionX },
        { type: 'reflectY', key: 'C6ReflectionY', score: transformData.mastery.C6ReflectionY },
        { type: 'rotate', key: 'C6Rotation', score: transformData.mastery.C6Rotation },
        { type: 'dilation', key: 'C6Dilation', score: transformData.mastery.C6Dilation }
    ];
    
    // Prioritize lower scores
    skills.sort((a, b) => a.score - b.score);
    
    let typePool = [];
    skills.forEach((s, i) => {
        let weight = (i < 2) ? 4 : 1; // Heavy weight for lowest 2 skills
        for(let k=0; k<weight; k++) typePool.push(s);
    });

    // 2. Generate Challenge
    let valid = false;
    let attempts = 0;

    while (!valid && attempts < 50) {
        attempts++;
        const keys = Object.keys(TF_SHAPES);
        const template = TF_SHAPES[keys[Math.floor(Math.random() * keys.length)]];
        
        // Random offset
        let offX = Math.floor(Math.random() * 4) - 2;
        let offY = Math.floor(Math.random() * 4) - 2;
        
        transformData.currentShape = template.map(p => [p[0] + offX, p[1] + offY]);
        transformData.startShape = JSON.parse(JSON.stringify(transformData.currentShape));
        transformData.targetShape = JSON.parse(JSON.stringify(transformData.currentShape));

        let stepCount = Math.floor(Math.random() * 3) + 3; // 3 to 5 steps
        let tempMoves = [];
        let tempSkills = [];

        for (let i = 0; i < stepCount; i++) {
            let picked = typePool[Math.floor(Math.random() * typePool.length)];
            let move = generateTransformMove(picked.type);
            
            applyTransform(transformData.targetShape, move);
            tempMoves.push(move);
            if (!tempSkills.includes(picked.key)) tempSkills.push(picked.key);
        }

        // Validation: Must be on grid, visible, and actually moved
        let isOnGrid = transformData.targetShape.every(p => Math.abs(p[0]) <= 10 && Math.abs(p[1]) <= 10);
        let isVisible = transformData.targetShape.some(p => Math.abs(p[0]) > 0.1 || Math.abs(p[1]) > 0.1); // Avoid collapsing to 0,0 completely
        let moved = JSON.stringify(transformData.targetShape) !== JSON.stringify(transformData.startShape);

        if (moved && isOnGrid && isVisible) {
            valid = true;
            transformData.optimalMoves = tempMoves;
            transformData.activeSkills = tempSkills;
        }
    }

    renderTransformUI();
}

function generateTransformMove(type) {
    if (type === 'translation') {
        let range = Math.random() > 0.5 ? 5 : 3;
        // Ensure strictly integer moves for generation
        return { 
            type, 
            dx: Math.floor(Math.random() * (range * 2 + 1)) - range, 
            dy: Math.floor(Math.random() * (range * 2 + 1)) - range 
        };
    }
    if (type === 'rotate') return { type, deg: [90, 180][Math.floor(Math.random() * 2)], dir: ['CW', 'CCW'][Math.floor(Math.random() * 2)] };
    if (type === 'dilation') return { type, factor: [0.5, 2][Math.floor(Math.random() * 2)] };
    return { type }; // Reflections need no params
}

function applyTransform(pts, m) {
    pts.forEach(p => {
        let x = p[0], y = p[1];
        if (m.type === 'translation') { 
            p[0] += m.dx; 
            p[1] += m.dy; 
        }
        else if (m.type === 'reflectX') { p[1] = -y; }
        else if (m.type === 'reflectY') { p[0] = -x; }
        else if (m.type === 'rotate') {
            if (m.deg === 180) { p[0] = -x; p[1] = -y; }
            else if ((m.deg === 90 && m.dir === 'CW')) { p[0] = y; p[1] = -x; }
            else if ((m.deg === 90 && m.dir === 'CCW')) { p[0] = -y; p[1] = x; }
        }
        else if (m.type === 'dilation') { 
            p[0] *= m.factor; 
            p[1] *= m.factor; 
        }
    });
}

function renderTransformUI() {
    const qContent = document.getElementById('q-content');
    if (!qContent) return;

    const d = transformData;
    document.getElementById('q-title').innerText = `Transformations (Round ${d.round}/${d.maxRounds})`;

    qContent.innerHTML = `
        <div class="tf-layout">
            <div class="tf-canvas-wrapper">
                <canvas id="gridCanvas" width="440" height="440"></canvas>
                <div id="coord-tip">(0, 0)</div>
                
                <div class="tf-coord-list">
                   <div style="font-weight:bold; color:#15803d;">Current: <span id="cur-coords-text"></span></div>
                   <div style="font-weight:bold; color:#94a3b8;">Target: <span id="tar-coords-text"></span></div>
                </div>
            </div>

            <div class="tf-controls">
                <div id="move-list" class="tf-move-list">
                    ${d.userMoves.length === 0 ? '<div style="color:#cbd5e1; text-align:center; padding:10px;">Add moves to match the ghost shape.</div>' : ''}
                    ${d.userMoves.map((m, i) => `
                        <div class="tf-move-item ${d.editingIndex === i ? 'editing' : ''}">
                            <div onclick="${d.isAnimating ? '' : `editTransformStep(${i})`}" style="flex:1; cursor:pointer;">
                                <strong>${i+1}.</strong> ${formatTransformLabel(m)}
                            </div>
                            <div onclick="${d.isAnimating ? '' : `undoTransformTo(${i})`}" class="tf-delete-btn">&times;</div>
                        </div>
                    `).join('')}
                </div>

                <div class="tf-input-panel">
                    <select id="move-type" onchange="updateTransformInputs()" class="tf-select">
                        <option value="translation">Translation</option>
                        <option value="reflectX">Reflection (X-Axis)</option>
                        <option value="reflectY">Reflection (Y-Axis)</option>
                        <option value="rotate">Rotation (Origin)</option>
                        <option value="dilation">Dilation (Origin)</option>
                    </select>

                    <div id="dynamic-inputs" class="tf-dynamic-inputs"></div>

                    <div style="display:flex; gap:10px;">
                        <button onclick="executeTransform()" class="tf-btn tf-btn-primary">
                            ${d.editingIndex === -1 ? 'ADD MOVE' : 'UPDATE MOVE'}
                        </button>
                        ${d.editingIndex !== -1 ? `<button onclick="cancelTransformEdit()" class="tf-btn tf-btn-cancel">CANCEL</button>` : ''}
                    </div>
                </div>

                <div style="display:flex; gap:10px; margin-top:10px;">
                     <button onclick="checkTransformWin()" class="tf-btn tf-btn-dark">CHECK ANSWER</button>
                     <button onclick="resetTransformBoard()" class="tf-btn tf-btn-subtle">RESET</button>
                </div>
            </div>
        </div>
        <div id="tf-feedback"></div>
    `;

    setupTransformCanvas();
    updateTransformInputs();
    updateCoordsText();
    drawTransformCanvas(d.currentShape);
}

function setupTransformCanvas() {
    const canvas = document.getElementById('gridCanvas');
    const tip = document.getElementById('coord-tip');
    if (!canvas) return;

    canvas.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect();
        // Canvas is 440px, Center is 220, Grid size 20
        const gridX = Math.round((e.clientX - rect.left - 220) / 20);
        const gridY = Math.round((220 - (e.clientY - rect.top)) / 20);
        if (Math.abs(gridX) <= 10 && Math.abs(gridY) <= 10) tip.innerText = `(${gridX}, ${gridY})`;
    };
}

function updateCoordsText() {
    const cur = transformData.currentShape.map(p => `(${p[0].toFixed(2)},${p[1].toFixed(2)})`).join(' ');
    const tar = transformData.targetShape.map(p => `(${p[0].toFixed(2)},${p[1].toFixed(2)})`).join(' ');
    
    const cEl = document.getElementById('cur-coords-text');
    const tEl = document.getElementById('tar-coords-text');
    if(cEl) cEl.innerText = cur;
    if(tEl) tEl.innerText = tar;
}

window.updateTransformInputs = function() {
    const type = document.getElementById('move-type').value;
    const container = document.getElementById('dynamic-inputs');
    const existing = (transformData.editingIndex !== -1) ? transformData.userMoves[transformData.editingIndex] : null;

    // Logic: If decimals exist in current shape, allow 0.25 steps. Otherwise integer steps.
    const hasDecimals = transformData.currentShape.some(p => !Number.isInteger(p[0]) || !Number.isInteger(p[1]));
    const step = hasDecimals ? "0.25" : "1";

    let html = '';
    if (type === 'translation') {
        html = `
            <div class="tf-field-group">
                <label>x:</label>
                <input type="number" id="inp-dx" step="${step}" value="${existing?.dx || 0}">
                <label>y:</label>
                <input type="number" id="inp-dy" step="${step}" value="${existing?.dy || 0}">
            </div>`;
    } else if (type === 'rotate') {
        html = `
            <div class="tf-field-group">
                <select id="inp-deg">
                    <option value="90" ${existing?.deg == 90 ? 'selected' : ''}>90°</option>
                    <option value="180" ${existing?.deg == 180 ? 'selected' : ''}>180°</option>
                </select>
                <select id="inp-dir">
                    <option value="CW" ${existing?.dir == 'CW' ? 'selected' : ''}>CW</option>
                    <option value="CCW" ${existing?.dir == 'CCW' ? 'selected' : ''}>CCW</option>
                </select>
            </div>`;
    } else if (type === 'dilation') {
        html = `
            <div class="tf-field-group">
                <label>Factor:</label>
                <input type="number" id="inp-fac" step="0.25" value="${existing?.factor || 1}">
            </div>`;
    }
    container.innerHTML = html;
};

window.executeTransform = async function() {
    const type = document.getElementById('move-type').value;
    let m = { type };

    if (type === 'translation') {
        m.dx = parseFloat(document.getElementById('inp-dx').value) || 0;
        m.dy = parseFloat(document.getElementById('inp-dy').value) || 0;
        if (m.dx === 0 && m.dy === 0) return;
    } else if (type === 'rotate') {
        m.deg = parseInt(document.getElementById('inp-deg').value);
        m.dir = document.getElementById('inp-dir').value;
    } else if (type === 'dilation') {
        m.factor = parseFloat(document.getElementById('inp-fac').value) || 1;
    }

    if (transformData.editingIndex === -1) {
        transformData.userMoves.push(m);
        await animateTransform(transformData.currentShape, m);
    } else {
        transformData.userMoves[transformData.editingIndex] = m;
        transformData.editingIndex = -1;
        await replayTransformHistory();
    }
    
    updateCoordsText();
    renderTransformUI();
};

window.editTransformStep = function(i) {
    transformData.editingIndex = i;
    renderTransformUI();
    document.getElementById('move-type').value = transformData.userMoves[i].type;
    updateTransformInputs();
};

window.cancelTransformEdit = function() {
    transformData.editingIndex = -1;
    renderTransformUI();
};

window.undoTransformTo = function(i) {
    transformData.userMoves.splice(i);
    replayTransformHistory().then(() => renderTransformUI());
};

window.resetTransformBoard = function() {
    transformData.userMoves = [];
    transformData.currentShape = JSON.parse(JSON.stringify(transformData.startShape));
    renderTransformUI();
};

async function animateTransform(pts, m) {
    transformData.isAnimating = true;
    let start = JSON.parse(JSON.stringify(pts));
    
    // For translation, break diagonal movement into X then Y for visual clarity
    if (m.type === 'translation' && m.dx !== 0 && m.dy !== 0) {
        let mid = start.map(p => [p[0] + m.dx, p[1]]);
        await runLerp(start, mid);
        await new Promise(r => setTimeout(r, 50));
        let end = mid.map(p => [p[0], p[1] + m.dy]);
        await runLerp(mid, end);
        applyTransform(pts, m);
    } else {
        applyTransform(pts, m);
        let end = JSON.parse(JSON.stringify(pts));
        await runLerp(start, end);
    }
    transformData.isAnimating = false;
}

async function replayTransformHistory() {
    transformData.currentShape = JSON.parse(JSON.stringify(transformData.startShape));
    drawTransformCanvas(transformData.currentShape);
    for (let m of transformData.userMoves) {
        await animateTransform(transformData.currentShape, m);
        await new Promise(r => setTimeout(r, 50));
    }
}

function runLerp(from, to) {
    return new Promise(resolve => {
        let frame = 0;
        const totalFrames = 15;
        
        function loop() {
            frame++;
            let t = frame / totalFrames;
            // Ease out
            t = 1 - Math.pow(1 - t, 3);
            
            let current = from.map((p, i) => [
                p[0] + (to[i][0] - p[0]) * t,
                p[1] + (to[i][1] - p[1]) * t
            ]);
            
            drawTransformCanvas(current);
            
            if (frame < totalFrames) requestAnimationFrame(loop);
            else resolve();
        }
        loop();
    });
}

function drawTransformCanvas(currentPts) {
    const canvas = document.getElementById('gridCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const scale = 20; 
    const center = 220;

    ctx.clearRect(0,0,440,440);

    // Draw Grid
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let i=0; i<=440; i+=scale) {
        ctx.moveTo(i,0); ctx.lineTo(i,440);
        ctx.moveTo(0,i); ctx.lineTo(440,i);
    }
    ctx.stroke();

    // Axes
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(center,0); ctx.lineTo(center,440);
    ctx.moveTo(0,center); ctx.lineTo(440,center);
    ctx.stroke();

    // Numbers
    ctx.fillStyle = "#94a3b8"; ctx.font = "10px monospace"; ctx.textAlign = "center";
    for(let i = -10; i <= 10; i++) {
        if(i === 0) continue;
        ctx.fillText(i, center + (i * scale), center + 12);
    }

    // Shapes Function
    const drawPoly = (pts, fill, stroke, isGhost) => {
        ctx.beginPath();
        pts.forEach((p, i) => {
            let x = center + (p[0] * scale);
            let y = center - (p[1] * scale);
            if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        });
        ctx.closePath();
        
        ctx.save();
        if(isGhost) ctx.setLineDash([5, 5]);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Vertices
        ctx.fillStyle = stroke;
        pts.forEach(p => {
             ctx.beginPath();
             ctx.arc(center+(p[0]*scale), center-(p[1]*scale), 3, 0, Math.PI*2);
             ctx.fill();
        });
        ctx.restore();
    };

    drawPoly(transformData.targetShape, "rgba(203, 213, 225, 0.3)", "#94a3b8", true);
    drawPoly(currentPts, "rgba(34, 197, 94, 0.4)", "#16a34a", false);
}

// --- STRICT SCORING & SUPABASE ---
window.checkTransformWin = async function() {
    const d = transformData;
    const feedback = document.getElementById('tf-feedback');
    
    // Sort points to ignore order
    const sorter = (a, b) => (a[0] - b[0]) || (a[1] - b[1]);
    const sortedCur = [...d.currentShape].sort(sorter);
    const sortedTar = [...d.targetShape].sort(sorter);

    const isMatch = sortedCur.every((p, i) => 
        Math.abs(p[0] - sortedTar[i][0]) < 0.1 && 
        Math.abs(p[1] - sortedTar[i][1]) < 0.1
    );

    if (isMatch) {
        // 1. Calculate Efficient Moves (Handle Split Translations)
        let adjustedMoves = 0;
        let i = 0;
        const moves = d.userMoves;
        
        while (i < moves.length) {
            let m1 = moves[i];
            
            // Look ahead for split translation
            if (i < moves.length - 1) {
                let m2 = moves[i+1];
                if (m1.type === 'translation' && m2.type === 'translation') {
                    // Check orthogonal split: T(x,0) then T(0,y) OR T(0,y) then T(x,0)
                    const m1IsX = (m1.dx !== 0 && m1.dy === 0);
                    const m1IsY = (m1.dx === 0 && m1.dy !== 0);
                    const m2IsX = (m2.dx !== 0 && m2.dy === 0);
                    const m2IsY = (m2.dx === 0 && m2.dy !== 0);

                    if ((m1IsX && m2IsY) || (m1IsY && m2IsX)) {
                        // This counts as 1 logical move
                        adjustedMoves++;
                        i += 2; 
                        continue;
                    }
                }
            }
            adjustedMoves++;
            i++;
        }

        const optimal = d.optimalMoves.length;
        const mistakes = Math.max(0, adjustedMoves - optimal);
        const efficiency = optimal / adjustedMoves;

        feedback.innerHTML = `<div style="background:#dcfce7; color:#166534; padding:10px; border-radius:8px;">Correct! ${mistakes > 0 ? `(${mistakes} extra steps)` : 'Perfect efficiency!'}</div>`;

        // 2. Update Database
        await updateTransformScores(mistakes, efficiency);

        d.round++;
        setTimeout(() => {
            if (d.round > d.maxRounds) finishTransformGame();
            else startTransformRound();
        }, 1500);

    } else {
        feedback.innerHTML = `<div style="background:#fee2e2; color:#991b1b; padding:10px; border-radius:8px;">Not matching yet. Check coordinates.</div>`;
        setTimeout(() => feedback.innerHTML = '', 2000);
    }
};

async function updateTransformScores(mistakes, efficiency) {
    const delta = (mistakes === 0) ? 1 : (mistakes === 1 ? 0 : -1);
    const updates = {};

    // Update specific skills used
    transformData.activeSkills.forEach(k => {
        let val = Math.max(0, Math.min(10, (transformData.mastery[k] || 0) + delta));
        transformData.mastery[k] = val;
        window.userMastery[k] = val; // Global Sync
        updates[k] = val;
    });

    // Update Aggregate
    let aggDelta = (efficiency >= 0.8) ? 1 : (efficiency < 0.5 ? -1 : 0);
    let aggVal = Math.max(0, Math.min(10, (transformData.mastery.C6Transformation || 0) + aggDelta));
    transformData.mastery.C6Transformation = aggVal;
    window.userMastery.C6Transformation = aggVal;
    updates.C6Transformation = aggVal;

    // Send to DB
    if (window.supabaseClient && window.currentUser) {
        try {
            const h = sessionStorage.getItem('target_hour') || "00";
            await window.supabaseClient.from('assignment')
                .update(updates)
                .eq('userName', window.currentUser)
                .eq('hour', h);
        } catch(e) { console.error("DB Update Failed", e); }
    }
}

function finishTransformGame() {
    document.getElementById('q-content').innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:400px; animation:fadeIn 0.5s;">
            <div style="font-size:60px;">🏆</div>
            <h2 style="color:#1e293b;">Transformation Master!</h2>
            <p style="color:#64748b;">Progress saved.</p>
        </div>`;
    setTimeout(() => { if(window.loadNextQuestion) window.loadNextQuestion(); }, 2000);
}

function formatTransformLabel(m) {
    if (m.type === 'translation') return `Translate (${m.dx}, ${m.dy})`;
    if (m.type === 'reflectX') return `Reflect X-Axis`;
    if (m.type === 'reflectY') return `Reflect Y-Axis`;
    if (m.type === 'rotate') return `Rotate ${m.deg}° ${m.dir}`;
    if (m.type === 'dilation') return `Dilate k=${m.factor}`;
    return m.type;
}

// CSS Injection
const tfStyle = document.createElement('style');
tfStyle.innerHTML = `
    .tf-layout { display:flex; gap:20px; flex-wrap:wrap; justify-content:center; }
    .tf-canvas-wrapper { position:relative; width:440px; height:440px; background:white; border:1px solid #94a3b8; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.05); }
    .tf-coord-list { margin-top:10px; font-family:monospace; font-size:12px; display:flex; justify-content:space-between; }
    #coord-tip { position:absolute; bottom:5px; right:5px; background:rgba(15,23,42,0.8); color:white; padding:2px 6px; border-radius:4px; font-size:10px; pointer-events:none; }
    .tf-controls { flex:1; min-width:300px; display:flex; flex-direction:column; gap:10px; }
    .tf-move-list { flex:1; background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:10px; max-height:200px; overflow-y:auto; }
    .tf-move-item { display:flex; justify-content:space-between; align-items:center; background:white; border:1px solid #e2e8f0; padding:6px 10px; margin-bottom:5px; border-radius:4px; font-size:13px; transition:0.2s; }
    .tf-move-item.editing { border-color:#f59e0b; background:#fffbeb; }
    .tf-move-item:hover { border-color:#94a3b8; }
    .tf-delete-btn { color:#ef4444; cursor:pointer; font-weight:bold; padding:0 5px; }
    .tf-input-panel { background:#f1f5f9; padding:15px; border-radius:8px; border:1px solid #cbd5e1; }
    .tf-select { width:100%; padding:8px; border-radius:4px; border:1px solid #cbd5e1; margin-bottom:10px; }
    .tf-dynamic-inputs { display:flex; gap:10px; margin-bottom:10px; align-items:center; min-height:30px; }
    .tf-field-group { display:flex; align-items:center; gap:5px; }
    .tf-field-group input, .tf-field-group select { width:70px; padding:5px; text-align:center; border:1px solid #cbd5e1; border-radius:4px; }
    .tf-btn { padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer; border:none; transition:0.2s; flex:1; }
    .tf-btn-primary { background:#22c55e; color:white; }
    .tf-btn-primary:hover { background:#16a34a; }
    .tf-btn-cancel { background:#94a3b8; color:white; flex:0; }
    .tf-btn-dark { background:#0f172a; color:white; }
    .tf-btn-subtle { background:#e2e8f0; color:#334155; }
    #tf-feedback { margin-top:10px; text-align:center; font-weight:bold; min-height:40px; }
`;
document.head.appendChild(tfStyle);
