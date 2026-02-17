// Global State
var currentShape = [];
var targetShape = [];
var transErrorCount = 0;
var currentMastery = 0;
var moveSequence = []; // The moves the user is "programming"
var targetPath = [];   // The moves the computer made
var currentRound = 1;

const SKILLS = ['C6Translation', 'C6ReflectionX', 'C6ReflectionY', 'C6ReflectionXY', 'C6Rotation', 'C6Dilation'];

window.initTransformationGame = async function() {
    isCurrentQActive = true;
    currentQSeconds = 0;
    transErrorCount = 0;
    currentRound = 1;

    // 1. Fetch scores to determine difficulty
    const { data } = await supabaseClient.from('assignment').select('*').eq('userName', currentUser).single();
    currentMastery = data?.C6Transformation || 0;

    startNewRound();
};

function startNewRound() {
    moveSequence = [];
    let moveCount = currentMastery >= 8 ? 6 : (currentMastery >= 5 ? 5 : 3);
    
    // Start with a random small shape
    let startX = Math.floor(Math.random() * 5) - 2;
    let startY = Math.floor(Math.random() * 5) - 2;
    currentShape = [[startX, startY], [startX, startY+2], [startX+1, startY+1]];
    targetShape = JSON.parse(JSON.stringify(currentShape));

    // Generate the "Goal" by applying random transformations
    targetPath = [];
    for (let i = 0; i < moveCount; i++) {
        let moveType = (i === 0) ? 'translation' : ['translation', 'reflectX', 'reflectY', 'rotate', 'dilate'][Math.floor(Math.random() * 5)];
        let m = generateMove(moveType);
        applyMoveToPoints(targetShape, m);
        targetPath.push(m);
    }

    renderUI();
}

function generateMove(type) {
    if (type === 'translation') return { type, dx: Math.floor(Math.random() * 7) - 3, dy: Math.floor(Math.random() * 7) - 3 };
    if (type === 'reflectX') return { type };
    if (type === 'reflectY') return { type };
    if (type === 'rotate') return { type, deg: 90 };
    if (type === 'dilate') return { type, factor: 2 };
    return { type: 'translation', dx: 1, dy: 1 };
}

function applyMoveToPoints(pts, m) {
    pts.forEach(p => {
        if (m.type === 'translation') { p[0] += m.dx; p[1] += m.dy; }
        else if (m.type === 'reflectX') { p[1] = -p[1]; }
        else if (m.type === 'reflectY') { p[0] = -p[0]; }
        else if (m.type === 'rotate') { let x=p[0]; p[0]=p[1]; p[1]=-x; }
        else if (m.type === 'dilate') { p[0]*=m.factor; p[1]*=m.factor; }
    });
}

function renderUI() {
    document.getElementById('q-title').innerText = `Complex Transformations (Round ${currentRound}/3)`;
    
    let moveCountText = currentMastery >= 8 ? "6+" : (currentMastery >= 5 ? "5" : "3");

    document.getElementById('q-content').innerHTML = `
        <div style="display: flex; justify-content: center; margin-bottom: 10px; position:relative;">
            <canvas id="gridCanvas" width="300" height="300" style="background: white; border-radius: 8px; border: 1px solid #cbd5e1;"></canvas>
            <div style="position:absolute; top:5px; right:10px; font-size:12px; font-family:monospace; color:#64748b;">GHOST = TARGET</div>
        </div>
        
        <p style="text-align:center; font-size: 0.9rem; margin-bottom:10px;">Goal: Write a <b>${moveCountText}-step</b> sequence to match the ghost shape.</p>

        <div id="user-sequence" style="min-height:40px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:8px; padding:10px; margin-bottom:10px; display:flex; flex-wrap:wrap; gap:5px;">
            ${moveSequence.length === 0 ? '<span style="color:#94a3b8">No instructions added...</span>' : moveSequence.map((m, i) => `<span class="badge" style="background:#14532d; color:white; padding:4px 8px; border-radius:4px; font-size:12px;">${i+1}. ${formatMove(m)}</span>`).join('')}
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
            <select id="move-selector" class="math-input" onchange="updateSubInputs()">
                <option value="translation">Translation (x,y)</option>
                <option value="reflectX">Reflect over X-Axis</option>
                <option value="reflectY">Reflect over Y-Axis</option>
                <option value="rotate">Rotate 90° CW</option>
                <option value="dilate">Dilate (x2)</option>
            </select>
            <div id="sub-inputs" style="display:flex; gap:4px;">
                <input type="number" id="dx" placeholder="x" style="width:50%" class="math-input">
                <input type="number" id="dy" placeholder="y" style="width:50%" class="math-input">
            </div>
            <button class="secondary-btn" onclick="addInstruction()">Add Step</button>
            <button class="primary-btn" onclick="checkMatch()">Verify Sequence</button>
        </div>
    `;
    draw();
}

function formatMove(m) {
    if (m.type === 'translation') return `T(${m.dx},${m.dy})`;
    if (m.type === 'reflectX') return `Ref-X`;
    if (m.type === 'reflectY') return `Ref-Y`;
    if (m.type === 'rotate') return `Rot-90`;
    if (m.type === 'dilate') return `Dil-2`;
    return "";
}

window.updateSubInputs = function() {
    const val = document.getElementById('move-selector').value;
    const container = document.getElementById('sub-inputs');
    if (val === 'translation') {
        container.innerHTML = `<input type="number" id="dx" placeholder="x" style="width:50%" class="math-input"> <input type="number" id="dy" placeholder="y" style="width:50%" class="math-input">`;
    } else {
        container.innerHTML = `<span style="color:#94a3b8; font-size:12px; margin-top:10px;">No params needed</span>`;
    }
}

window.addInstruction = function() {
    const type = document.getElementById('move-selector').value;
    let move = { type };
    if (type === 'translation') {
        move.dx = parseInt(document.getElementById('dx').value) || 0;
        move.dy = parseInt(document.getElementById('dy').value) || 0;
    }
    moveSequence.push(move);
    renderUI();
}

function draw() {
    const canvas = document.getElementById('gridCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,300,300);

    // Axes & Grid
    ctx.strokeStyle="#f1f5f9"; ctx.beginPath();
    for(let i=0; i<=300; i+=30){ ctx.moveTo(i,0); ctx.lineTo(i,300); ctx.moveTo(0,i); ctx.lineTo(300,i); } ctx.stroke();
    ctx.strokeStyle="#94a3b8"; ctx.lineWidth=2; ctx.beginPath();
    ctx.moveTo(150,0); ctx.lineTo(150,300); ctx.moveTo(0,150); ctx.lineTo(300,150); ctx.stroke();

    // Target Shape (The Ghost)
    ctx.setLineDash([4,2]); ctx.strokeStyle="#000"; ctx.fillStyle="rgba(0,0,0,0.05)";
    drawShape(ctx, targetShape);

    // Initial Start Shape (Faint Green)
    // We calculate what the shape looks like AFTER the user's instructions
    let currentPos = JSON.parse(JSON.stringify(currentShape));
    moveSequence.forEach(m => applyMoveToPoints(currentPos, m));

    ctx.setLineDash([]); ctx.strokeStyle="#14532d"; ctx.fillStyle="rgba(76, 187, 23, 0.6)"; 
    drawShape(ctx, currentPos);
}

function drawShape(ctx, pts) {
    ctx.beginPath();
    pts.forEach((p, i) => {
        let x = 150 + (p[0] * 30); let y = 150 - (p[1] * 30);
        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.closePath(); ctx.fill(); ctx.stroke();
}

async function checkMatch() {
    let finalUserShape = JSON.parse(JSON.stringify(currentShape));
    moveSequence.forEach(m => applyMoveToPoints(finalUserShape, m));

    const isCorrect = finalUserShape.every((p, i) => Math.abs(p[0]-targetShape[i][0]) < 0.1 && Math.abs(p[1]-targetShape[i][1]) < 0.1);

    if (isCorrect) {
        currentRound++;
        if (currentRound > 3) {
            finishGame();
        } else {
            alert("Perfect Sequence! On to the next round.");
            startNewRound();
        }
    } else {
        transErrorCount++;
        alert("The sequence didn't land on the target. Clearing moves and trying again.");
        moveSequence = [];
        renderUI();
    }
}

async function finishGame() {
    isCurrentQActive = false;
    let adjustment = transErrorCount === 0 ? 1 : (transErrorCount > 3 ? -1 : 0);
    let newScore = Math.max(0, Math.min(10, currentMastery + adjustment));
    
    await supabaseClient.from('assignment').update({ C6Transformation: newScore }).eq('userName', currentUser);
    
    setTimeout(() => { loadNextQuestion(); }, 1500);
}
