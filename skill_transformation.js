/**
 * Transformation Geometry Game - V7.1 (UI Fixes)
 * Features:
 * - Visual Matching (Shape-based)
 * - Split Animation (X then Y)
 * - Specific C6 Database Columns
 * - Adaptive Difficulty
 * - Min 3 Moves
 * - FIXED: Wider inputs & Decimal support restored
 */

// Global State
var currentShape = [];
var targetShape = [];
var originalStartShape = [];
var currentRound = 1;
var editingIndex = -1;
var isAnimating = false;
var moveSequence = [];
var roundResults = []; 

// Session error tracking for specific columns
var sessionErrors = {
    C6Translation: 0,
    C6ReflectionX: 0,
    C6ReflectionY: 0,
    C6Rotation: 0,
    C6Dilation: 0
};

// Shape Library
const SHAPES = {
    rightTriangle: [[0,0], [0,3], [3,0]],
    isoscelesTriangle: [[0,0], [2,4], [4,0]],
    rectangle: [[0,0], [0,2], [4,2], [4,0]],
    trapezoid: [[0,0], [1,2], [3,2], [4,0]],
    parallelogram: [[0,0], [3,0], [4,2], [1,2]],
    L_shape: [[0,0], [0,4], [2,4], [2,2], [4,2], [4,0]]
};

window.initTransformationGame = async function() {
    window.isCurrentQActive = true;
    window.currentQSeconds = 0;
    currentRound = 1;
    roundResults = [];
    
    // Reset session errors
    sessionErrors = {
        C6Translation: 0, C6ReflectionX: 0, C6ReflectionY: 0, C6Rotation: 0, C6Dilation: 0
    };

    // Fetch previous progress to determine difficulty
    try {
        const { data } = await window.supabaseClient
            .from('assignment')
            .select('C6Translation, C6ReflectionX, C6ReflectionY, C6Rotation, C6Dilation, C6Transformation')
            .eq('userName', window.currentUser)
            .maybeSingle();
        window.userProgress = data || { 
            C6Translation: 0, C6ReflectionX: 0, C6ReflectionY: 0, 
            C6Rotation: 0, C6Dilation: 0, C6Transformation: 0 
        };
    } catch (e) {
        window.userProgress = { 
            C6Translation: 0, C6ReflectionX: 0, C6ReflectionY: 0, 
            C6Rotation: 0, C6Dilation: 0, C6Transformation: 0 
        };
    }
    
    startNewRound();
};

function startNewRound() {
    moveSequence = [];
    editingIndex = -1;
    isAnimating = false;
    
    // Adaptive Logic: Create a weighted pool based on lowest scores
    let skillWeights = [
        { type: 'translation', score: window.userProgress.C6Translation },
        { type: 'reflectX', score: window.userProgress.C6ReflectionX },
        { type: 'reflectY', score: window.userProgress.C6ReflectionY },
        { type: 'rotate', score: window.userProgress.C6Rotation },
        { type: 'dilation', score: window.userProgress.C6Dilation }
    ];
    
    // Sort by score ascending (lower score = higher priority)
    skillWeights.sort((a, b) => a.score - b.score);
    
    // Create pool: Weighted heavily towards the bottom 2 skills
    let typePool = [];
    skillWeights.forEach((skill, index) => {
        let weight = index < 2 ? 4 : 1; // 4x more likely if it's a weak skill
        for(let k=0; k<weight; k++) typePool.push(skill.type);
    });

    let validChallenge = false;
    while (!validChallenge) {
        const shapeKeys = Object.keys(SHAPES);
        const baseCoords = SHAPES[shapeKeys[Math.floor(Math.random() * shapeKeys.length)]];
        
        // Random start position near center
        let offX = Math.floor(Math.random() * 4) - 2;
        let offY = Math.floor(Math.random() * 4) - 2;
        currentShape = baseCoords.map(p => [p[0] + offX, p[1] + offY]);
        
        originalStartShape = JSON.parse(JSON.stringify(currentShape));
        targetShape = JSON.parse(JSON.stringify(currentShape));

        // Generate Minimum 3 steps
        let stepCount = Math.floor(Math.random() * 3) + 3; // Generates 3, 4, or 5
        
        for (let i = 0; i < stepCount; i++) {
            let pickedType = typePool[Math.floor(Math.random() * typePool.length)];
            applyMoveToPoints(targetShape, generateMove(pickedType));
        }

        // Boundary check (-10 to 10) and ensure it's not microscopic
        let isOnGrid = targetShape.every(p => Math.abs(p[0]) <= 10 && Math.abs(p[1]) <= 10);
        let isVisible = targetShape.every(p => Math.abs(p[0]) > 0.05 || Math.abs(p[1]) > 0.05);
        let moved = JSON.stringify(targetShape) !== JSON.stringify(originalStartShape);

        if (moved && isOnGrid && isVisible) validChallenge = true;
    }
    renderUI();
}

function generateMove(type) {
    if (type === 'translation') return { type, dx: Math.floor(Math.random() * 5) - 2, dy: Math.floor(Math.random() * 5) - 2 };
    // Force non-zero translation if possible, though 0 is valid but boring
    if (type === 'translation' && Math.random() > 0.5) return { type, dx: Math.floor(Math.random() * 6) - 3, dy: Math.floor(Math.random() * 6) - 3 };
    
    if (type === 'rotate') return { type, deg: [90, 180][Math.floor(Math.random() * 2)], dir: ['CW', 'CCW'][Math.floor(Math.random() * 2)] };
    if (type === 'dilation') return { type, factor: [0.5, 2][Math.floor(Math.random() * 2)] }; // Simplifed pool for solvability
    return { type }; // reflectX, reflectY need no params
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
        <div style="display: flex; gap: 15px; align-items: flex-start; margin-bottom: 10px; position:relative;">
            <div style="position:relative; width:440px; height:440px;">
                <canvas id="gridCanvas" width="440" height="440" style="background: white; border-radius: 8px; border: 1px solid #94a3b8; cursor: crosshair;"></canvas>
                <div id="coord-tip" style="position:absolute; bottom:10px; right:10px; background:rgba(15, 23, 42, 0.8); color:white; padding:4px 10px; border-radius:4px; font-family:monospace; font-size:11px; pointer-events:none;">(0, 0)</div>
                <div id="flash-overlay" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(0,0,0,0.8); color:white; padding:20px 40px; border-radius:12px; font-size:24px; font-weight:bold; display:none; pointer-events:none; text-align:center; z-index:10;"></div>
            </div>
            
            <div id="vertex-list" style="flex: 1; background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 11px; font-family: monospace; border: 1px solid #cbd5e1; max-height: 440px; overflow-y: auto;">
                <h4 style="margin: 0 0 8px 0; color: #334155; text-transform:uppercase; letter-spacing:0.5px;">Coordinates</h4>
                <div style="color: #15803d; font-weight: bold; margin-bottom: 4px;">Current (Green)</div>
                <div id="current-coords" style="margin-bottom: 12px; line-height:1.4;"></div>
                <div style="color: #64748b; font-weight: bold; margin-bottom: 4px;">Target (Ghost)</div>
                <div id="target-coords" style="line-height:1.4;"></div>
            </div>
        </div>
        
        <div id="user-sequence" style="min-height:45px; background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:8px; margin-bottom:12px; display:flex; flex-wrap:wrap; gap:6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            ${moveSequence.map((m, i) => `
                <div style="display:flex; align-items:center; background:${editingIndex === i ? '#f59e0b' : '#334155'}; color:white; border-radius:4px; font-size:11px; transition: background 0.2s;">
                    <div onclick="${isAnimating ? '' : `editStep(${i})`}" style="padding:5px 10px; cursor:pointer; font-weight:bold;">${i+1}. ${formatMove(m)}</div>
                    <div onclick="${isAnimating ? '' : `undoTo(${i})`}" style="padding:5px 8px; background:rgba(0,0,0,0.2); cursor:pointer; border-left:1px solid rgba(255,255,255,0.1);">&times;</div>
                </div>`).join('')}
            ${moveSequence.length === 0 ? '<span style="color:#94a3b8; font-size:12px; padding:5px;">Add moves below...</span>' : ''}
        </div>

        <div id="control-panel" style="background:#f1f5f9; border:1px solid #cbd5e1; padding:15px; border-radius:10px; display:grid; grid-template-columns: 1fr 1fr; gap:12px; pointer-events: ${isAnimating ? 'none' : 'auto'}; opacity: ${isAnimating ? 0.7 : 1};">
            <select id="move-selector" onchange="updateSubInputs()" style="grid-column: span 2; height:40px; border-radius:6px; border:1px solid #cbd5e1; padding:0 10px; font-size:14px;">
                <option value="translation">Translation</option>
                <option value="reflectX">Reflection (X-Axis)</option>
                <option value="reflectY">Reflection (Y-Axis)</option>
                <option value="rotate">Rotation (Origin)</option>
                <option value="dilation">Dilation (Origin)</option>
            </select>
            
            <div id="sub-inputs" style="grid-column: span 2; display:flex; gap:15px; align-items:center; justify-content:center; padding:5px; height:40px;"></div>
            
            <button onclick="executeAction()" style="grid-column: span 2; height:45px; background:${editingIndex === -1 ? '#22c55e' : '#f59e0b'}; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-size:14px; box-shadow: 0 2px 0 rgba(0,0,0,0.1);">
                ${editingIndex === -1 ? 'ADD MOVE' : 'UPDATE MOVE'}
            </button>
            
            <button onclick="checkWin()" style="grid-column: span 1; height:40px; background:#0f172a; color:white; border-radius:6px; font-size:12px; cursor:pointer; font-weight:bold;">CHECK MATCH</button>
            <button onclick="resetToStart()" style="grid-column: span 1; height:40px; background:#334155; color:white; border:none; border-radius:6px; font-size:12px; cursor:pointer; font-weight:bold;">RESET ALL</button>
            
            ${editingIndex !== -1 ? `<button onclick="cancelEdit()" style="grid-column: span 2; height:30px; background:#94a3b8; color:white; border:none; border-radius:6px; font-size:11px; cursor:pointer;">CANCEL EDIT</button>` : ''}
        </div>
    `;

    setupCanvas();
    updateSubInputs(); 
    updateCoordinateList();
    draw(currentShape); 
}

function showFlash(msg, type) {
    const overlay = document.getElementById('flash-overlay');
    if (!overlay) return;
    
    overlay.innerText = msg;
    overlay.style.display = 'block';
    overlay.style.backgroundColor = type === 'success' ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)';
    
    overlay.animate([
        { opacity: 0, transform: 'translate(-50%, -40%)' },
        { opacity: 1, transform: 'translate(-50%, -50%)' }
    ], { duration: 200, fill: 'forwards' });

    setTimeout(() => {
        overlay.style.display = 'none';
    }, 1500);
}

function updateCoordinateList() {
    const curDiv = document.getElementById('current-coords');
    const tarDiv = document.getElementById('target-coords');
    if (!curDiv || !tarDiv) return;

    curDiv.innerHTML = currentShape.map((p, i) => `(${p[0].toFixed(2)}, ${p[1].toFixed(2)})`).join('<br>');
    tarDiv.innerHTML = targetShape.map((p, i) => `(${p[0].toFixed(2)}, ${p[1].toFixed(2)})`).join('<br>');
}

function formatMove(m) {
    if (m.type === 'translation') return `T(${m.dx}, ${m.dy})`;
    if (m.type === 'reflectX') return `Ref X-Axis`;
    if (m.type === 'reflectY') return `Ref Y-Axis`;
    if (m.type === 'rotate') return `Rot ${m.deg}° ${m.dir}`;
    if (m.type === 'dilation') return `Dilate x${m.factor}`;
    return m.type;
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
        // FIXED: Increased width to 80px and restored step="0.25" for decimals
        container.innerHTML = `
            <div style="display:flex; align-items:center; margin-right: 10px;">
                <span style="font-weight:bold; margin-right:5px;">X:</span> 
                <input type="number" id="dx" step="0.25" value="${existing?.dx || 0}" style="width:80px; height:35px; text-align:center; border:1px solid #cbd5e1; border-radius:4px; font-size:14px;">
            </div>
            <div style="display:flex; align-items:center;">
                <span style="font-weight:bold; margin-right:5px;">Y:</span> 
                <input type="number" id="dy" step="0.25" value="${existing?.dy || 0}" style="width:80px; height:35px; text-align:center; border:1px solid #cbd5e1; border-radius:4px; font-size:14px;">
            </div>`;
    } else if (val === 'rotate') {
        container.innerHTML = `
            <select id="rot-deg" style="height:35px; border-radius:4px;">
                <option value="90" ${existing?.deg == 90 ? 'selected' : ''}>90°</option>
                <option value="180" ${existing?.deg == 180 ? 'selected' : ''}>180°</option>
            </select>
            <select id="rot-dir" style="height:35px; border-radius:4px;">
                <option value="CW" ${existing?.dir == 'CW' ? 'selected' : ''}>CW</option>
                <option value="CCW" ${existing?.dir == 'CCW' ? 'selected' : ''}>CCW</option>
            </select>`;
    } else if (val === 'dilation') {
        // FIXED: Increased width and step
        container.innerHTML = `
            <span style="font-weight:bold; margin-right:5px;">Scale:</span> 
            <input type="number" id="dil-factor" step="0.25" value="${existing?.factor || 1}" style="width:80px; height:35px; text-align:center; border:1px solid #cbd5e1; border-radius:4px;">`;
    } else {
        container.innerHTML = `<span style="color:#64748b; font-size:12px; font-style:italic;">No parameters needed</span>`;
    }
};

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
        m.dx = parseFloat(document.getElementById('dx').value) || 0;
        m.dy = parseFloat(document.getElementById('dy').value) || 0;
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
    updateCoordinateList();
    renderUI();
};

async function animateMove(pts, m) {
    isAnimating = true;
    let startPoints = JSON.parse(JSON.stringify(pts));
    
    // Split X and Y movement for translations if both exist
    if (m.type === 'translation' && m.dx !== 0 && m.dy !== 0) {
        
        // Leg 1: Move X only
        let midPoints = startPoints.map(p => [p[0] + m.dx, p[1]]);
        await runLerp(startPoints, midPoints);
        
        // Brief pause
        await new Promise(r => setTimeout(r, 100));

        // Leg 2: Move Y only
        let endPoints = midPoints.map(p => [p[0], p[1] + m.dy]);
        await runLerp(midPoints, endPoints);

        // Update final state in place
        applyMoveToPoints(pts, m);

    } else {
        // Standard single animation
        applyMoveToPoints(pts, m);
        let endPoints = JSON.parse(JSON.stringify(pts));
        await runLerp(startPoints, endPoints);
    }
    
    isAnimating = false;
}

// Helper to run the frame loop
async function runLerp(fromPts, toPts) {
    const frames = 15;
    for (let f = 1; f <= frames; f++) {
        let t = f / frames;
        let interp = fromPts.map((p, i) => [
            p[0] + (toPts[i][0] - p[0]) * t,
            p[1] + (toPts[i][1] - p[1]) * t
        ]);
        draw(interp);
        await new Promise(r => setTimeout(r, 20)); 
    }
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

    // Grid
    ctx.strokeStyle="#f1f5f9"; ctx.beginPath();
    for(let i=0; i<=440; i+=step){ ctx.moveTo(i,0); ctx.lineTo(i,440); ctx.moveTo(0,i); ctx.lineTo(440,i); } ctx.stroke();
    
    // Axes
    ctx.strokeStyle="#64748b"; ctx.lineWidth=2; ctx.beginPath();
    ctx.moveTo(center,0); ctx.lineTo(center,440); ctx.moveTo(0,center); ctx.lineTo(440,center); ctx.stroke();

    // Numbers
    ctx.fillStyle = "#94a3b8"; ctx.font = "9px Arial"; ctx.textAlign = "center";
    for(let i = -10; i <= 10; i++) {
        if(i === 0) continue;
        ctx.fillText(i, center + (i * step), center + 12);
        ctx.fillText(i, center - 10, center - (i * step) + 3);
    }

    // Ghost Target
    ctx.setLineDash([4,2]); ctx.strokeStyle="rgba(0,0,0,0.2)"; ctx.fillStyle="rgba(0,0,0,0.03)";
    drawShape(ctx, targetShape, center, step, false);

    // Current Shape
    ctx.setLineDash([]); ctx.strokeStyle="#15803d"; ctx.fillStyle="rgba(34, 197, 94, 0.6)"; 
    drawShape(ctx, pts, center, step, true);
}

function drawShape(ctx, pts, center, step, fill) {
    ctx.beginPath();
    pts.forEach((p, i) => {
        let x = center + (p[0] * step), y = center - (p[1] * step);
        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.closePath(); 
    if(fill) ctx.fill(); 
    ctx.stroke();
    
    // Vertex Dots
    ctx.fillStyle = fill ? "#166534" : "#94a3b8";
    pts.forEach(p => {
         let x = center + (p[0] * step), y = center - (p[1] * step);
         ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fill();
    });
}

// Visual Win Check (ignores vertex order)
window.checkWin = function() {
    // Sort logic: X ascending, then Y ascending
    const sorter = (a, b) => (a[0] - b[0]) || (a[1] - b[1]);
    
    let sortedCurrent = [...currentShape].sort(sorter);
    let sortedTarget = [...targetShape].sort(sorter);

    const isCorrect = sortedCurrent.every((p, i) => 
        Math.abs(p[0] - sortedTarget[i][0]) < 0.1 && 
        Math.abs(p[1] - sortedTarget[i][1]) < 0.1
    );

    if (isCorrect) {
        roundResults.push(1);
        showFlash("Perfect! Next Round...", "success");
        currentRound++;
        
        setTimeout(() => {
            if (currentRound > 3) finishGame();
            else startNewRound();
        }, 1500);
    } else {
        // Track error type based on last move
        let lastMove = moveSequence[moveSequence.length - 1];
        if (lastMove) {
            if (lastMove.type === 'translation') sessionErrors.C6Translation++;
            else if (lastMove.type === 'reflectX') sessionErrors.C6ReflectionX++;
            else if (lastMove.type === 'reflectY') sessionErrors.C6ReflectionY++;
            else if (lastMove.type === 'rotate') sessionErrors.C6Rotation++;
            else if (lastMove.type === 'dilation') sessionErrors.C6Dilation++;
        }
        
        roundResults.push(0);
        showFlash("Not quite. Check coords.", "error");
    }
};

async function finishGame() {
    window.isCurrentQActive = false; 
    const qContent = document.getElementById('q-content');
    
    qContent.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:400px; animation: fadeIn 0.5s;">
            <div style="font-size:60px;">🏆</div>
            <h2 style="color:#1e293b; margin:10px 0;">Session Complete!</h2>
            <p style="color:#64748b; font-size:16px;">Saving your progress...</p>
        </div>
    `;

    if (window.supabaseClient && window.currentUser) {
        let updates = {};
        
        // Helper to calc new score: 0 errors = +1, 2+ errors = -1
        const calcScore = (current, errors) => {
            let change = (errors === 0) ? 1 : (errors >= 2 ? -1 : 0);
            return Math.max(0, Math.min(10, current + change));
        };

        // Update specific columns
        updates.C6Translation = calcScore(window.userProgress.C6Translation || 0, sessionErrors.C6Translation);
        updates.C6ReflectionX = calcScore(window.userProgress.C6ReflectionX || 0, sessionErrors.C6ReflectionX);
        updates.C6ReflectionY = calcScore(window.userProgress.C6ReflectionY || 0, sessionErrors.C6ReflectionY);
        updates.C6Rotation = calcScore(window.userProgress.C6Rotation || 0, sessionErrors.C6Rotation);
        updates.C6Dilation = calcScore(window.userProgress.C6Dilation || 0, sessionErrors.C6Dilation);

        // Update Aggregate
        let winCount = roundResults.filter(r => r === 1).length;
        let successRate = (winCount / roundResults.length) * 100;
        let aggChange = (successRate >= 70) ? 1 : (successRate <= 50 ? -1 : 0);
        updates.C6Transformation = Math.max(0, Math.min(10, (window.userProgress.C6Transformation || 0) + aggChange));

        await window.supabaseClient.from('assignment').update(updates).eq('userName', window.currentUser);
    }
    
    setTimeout(() => { 
        if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion(); 
    }, 2500);
}
