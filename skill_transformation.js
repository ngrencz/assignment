/**
 * Transformation Geometry Game - Final V6
 * Features: 
 * - No Popups (Flash notifications)
 * - Integer Spinners (with decimal typing support)
 * - Robust Edit/Undo
 * - Vertex Coordinate List
 * - Performance Tracking
 */

// Global State
var currentShape = [];
var targetShape = [];
var originalStartShape = [];
var transErrorCount = 0;
var currentRound = 1;
var editingIndex = -1;
var isAnimating = false;
var moveSequence = [];
var sessionSkills = { translation: 0, reflection: 0, rotation: 0, dilation: 0 };
var roundResults = []; 

// Shape Library
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

    // Fetch previous progress
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
    
    // Sort skills to find weakest
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

        // Generate 3-5 steps
        let stepCount = Math.max(3, Math.floor(Math.random() * 2) + 3);
        for (let i = 0; i < stepCount; i++) {
            let typePool = Math.random() > 0.4 ? [skills[0].name] : ['translation', 'reflection', 'rotation', 'dilation'];
            let pickedType = typePool[Math.floor(Math.random() * typePool.length)];
            
            if (pickedType === 'reflection') pickedType = Math.random() > 0.5 ? 'reflectX' : 'reflectY';
            applyMoveToPoints(targetShape, generateMove(pickedType));
        }

        let isOnGrid = targetShape.every(p => Math.abs(p[0]) <= 10 && Math.abs(p[1]) <= 10);
        // Ensure not too small
        let isVisible = targetShape.every(p => Math.abs(p[0]) > 0.05 || Math.abs(p[1]) > 0.05);

        if (JSON.stringify(targetShape) !== JSON.stringify(originalStartShape) && isOnGrid && isVisible) validChallenge = true;
    }
    renderUI();
}

function generateMove(type) {
    if (type === 'translation') return { type, dx: Math.floor(Math.random() * 5) - 2, dy: Math.floor(Math.random() * 5) - 2 };
    if (type === 'rotate') return { type, deg: [90, 180][Math.floor(Math.random() * 2)], dir: ['CW', 'CCW'][Math.floor(Math.random() * 2)] };
    // Dilation factors: 0.25, 0.5, 0.75, 2, 3
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
    
    // Main UI Layout
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
    
    // Slight animation
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

    curDiv.innerHTML = currentShape.map((p, i) => `P${i+1}: (${p[0].toFixed(2)}, ${p[1].toFixed(2)})`).join('<br>');
    tarDiv.innerHTML = targetShape.map((p, i) => `P${i+1}: (${p[0].toFixed(2)}, ${p[1].toFixed(2)})`).join('<br>');
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

// Global functions must be explicitly attached to window
window.updateSubInputs = function() {
    const val = document.getElementById('move-selector').value;
    const container = document.getElementById('sub-inputs');
    // If we are editing, grab the values from the move being edited
    let existing = (editingIndex !== -1) ? moveSequence[editingIndex] : null;

    if (val === 'translation') {
        // step="1" for integer spinners, but user can type decimals
        container.innerHTML = `
            <div style="display:flex; align-items:center;">
                <span style="font-weight:bold; margin-right:5px;">X:</span> 
                <input type="number" id="dx" step="1" value="${existing?.dx || 0}" style="width:60px; height:35px; text-align:center; border:1px solid #cbd5e1; border-radius:4px;">
            </div>
            <div style="display:flex; align-items:center;">
                <span style="font-weight:bold; margin-right:5px;">Y:</span> 
                <input type="number" id="dy" step="1" value="${existing?.dy || 0}" style="width:60px; height:35px; text-align:center; border:1px solid #cbd5e1; border-radius:4px;">
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
        container.innerHTML = `
            <span style="font-weight:bold; margin-right:5px;">Scale:</span> 
            <input type="number" id="dil-factor" step="0.25" value="${existing?.factor || 1}" style="width:80px; height:35px; text-align:center; border:1px solid #cbd5e1; border-radius:4px;">`;
    } else {
        container.innerHTML = `<span style="color:#64748b; font-size:12px; font-style:italic;">No parameters needed</span>`;
    }
};

window.editStep = function(i) {
    editingIndex = i;
    // We must manually trigger the UI update to show the "Update" button
    // But first, we need to set the dropdown to the correct type so updateSubInputs works
    const move = moveSequence[i];
    renderUI(); // Re-render to show orange highlight
    document.getElementById('move-selector').value = move.type;
    updateSubInputs(); // Now populate inputs with existing values
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

    // Grid Lines
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

window.checkWin = function() {
    const isCorrect = currentShape.every((p, i) => 
        Math.abs(p[0] - targetShape[i][0]) < 0.1 && 
        Math.abs(p[1] - targetShape[i][1]) < 0.1
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
        transErrorCount++;
        roundResults.push(0);
        showFlash("Not quite. Check coords.", "error");
        
        let lastMove = moveSequence[moveSequence.length - 1];
        if (lastMove) {
            let cat = lastMove.type.includes('reflect') ? 'reflection' : (lastMove.type === 'rotate' ? 'rotation' : (lastMove.type === 'dilation' ? 'dilation' : 'translation'));
            sessionSkills[cat]++;
        }
    }
};

async function finishGame() {
    window.isCurrentQActive = false; 
    const qContent = document.getElementById('q-content');
    
    // Clear content and show big success message
    qContent.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:400px; animation: fadeIn 0.5s;">
            <div style="font-size:60px;">🏆</div>
            <h2 style="color:#1e293b; margin:10px 0;">Session Complete!</h2>
            <p style="color:#64748b; font-size:16px;">Saving your progress...</p>
        </div>
    `;

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
    
    // Wait 2 seconds so user sees the trophy, then reload
    setTimeout(() => { 
        if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion(); 
    }, 2500);
}
