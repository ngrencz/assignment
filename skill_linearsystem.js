var transErrorCount = 0;
var currentRound = 0;
var totalRounds = 3;
var currentTask = {};
var userSequence = []; // Stores the student's step-by-step inputs
var currentMastery = 0;

window.initTransformationGame = async function() {
    window.isCurrentQActive = true;
    window.currentQSeconds = 0;
    transErrorCount = 0;
    currentRound = 0;

    // 1. Fetch Skill to determine move count
    try {
        const { data } = await window.supabaseClient
            .from('assignment')
            .select('Transformation')
            .eq('userName', window.currentUser)
            .maybeSingle();
        currentMastery = data ? (data.Transformation || 0) : 0;
    } catch (e) { currentMastery = 0; }

    startNewRound();
};

function startNewRound() {
    userSequence = [];
    
    // Determine number of moves based on mastery
    let moveCount = 3;
    if (currentMastery >= 8) moveCount = 6;
    else if (currentMastery >= 5) moveCount = 5;

    // Generate a starting point
    let startX = Math.floor(Math.random() * 11) - 5;
    let startY = Math.floor(Math.random() * 11) - 5;
    
    // Generate the target path
    let path = [];
    let curX = startX;
    let curY = startY;

    for (let i = 0; i < moveCount; i++) {
        let move;
        // Ensure at least one translation
        const forceTrans = (i === 0);
        const typeRoll = forceTrans ? 0 : Math.floor(Math.random() * 4);

        if (typeRoll === 0) { // Translation
            let dx = Math.floor(Math.random() * 11) - 5;
            let dy = Math.floor(Math.random() * 11) - 5;
            if (dx === 0 && dy === 0) dx = 1;
            move = { type: 'translation', dx, dy, label: `Translate by (${dx}, ${dy})` };
            curX += dx; curY += dy;
        } 
        else if (typeRoll === 1) { // Reflection
            const axes = ['x-axis', 'y-axis'];
            let axis = axes[Math.floor(Math.random() * axes.length)];
            move = { type: 'reflection', axis, label: `Reflect over ${axis}` };
            if (axis === 'x-axis') curY = -curY; else curX = -curX;
        }
        else if (typeRoll === 2) { // Rotation
            const degrees = [90, 180, 270];
            let deg = degrees[Math.floor(Math.random() * degrees.length)];
            move = { type: 'rotation', deg, label: `Rotate ${deg}° Counter-Clockwise` };
            if (deg === 90) { let t = curX; curX = -curY; curY = t; }
            else if (deg === 180) { curX = -curX; curY = -curY; }
            else { let t = curX; curX = curY; curY = -t; }
        }
        else { // Dilation (Simple for now)
            let factor = Math.random() > 0.5 ? 2 : 0.5;
            move = { type: 'dilation', factor, label: `Dilate by scale factor ${factor}` };
            curX *= factor; curY *= factor;
        }
        path.push(move);
    }

    currentTask = { startX, startY, endX: curX, endY: curY, path, moveCount };
    renderTransformationUI();
}

function renderTransformationUI() {
    const qContent = document.getElementById('q-content');
    document.getElementById('q-title').innerText = `Geometric Transformations (Round ${currentRound + 1}/3)`;

    let html = `
        <div style="text-align:center; background:#f8fafc; padding:20px; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:20px;">
            <p style="font-size:1.2rem; margin:0;">Start Point: <strong>(${currentTask.startX}, ${currentTask.startY})</strong></p>
            <p style="font-size:1.2rem; margin:10px 0;">Final Image: <strong>(${currentTask.endX}, ${currentTask.endY})</strong></p>
            <p style="color:#64748b; font-size:0.9rem;">Describe the ${currentTask.moveCount} steps taken to get there.</p>
        </div>

        <div id="move-list" style="margin-bottom:20px;">
            ${userSequence.map((m, i) => `<div style="padding:8px; background:#f1f5f9; margin-bottom:5px; border-radius:6px;">Step ${i+1}: ${m.label}</div>`).join('')}
        </div>
    `;

    if (userSequence.length < currentTask.moveCount) {
        html += `
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; background:white; padding:15px; border-radius:8px; border:1px solid #cbd5e1;">
                <select id="trans-type" class="math-input" style="width:100%" onchange="toggleInputs()">
                    <option value="translation">Translation</option>
                    <option value="reflection">Reflection</option>
                    <option value="rotation">Rotation</option>
                    <option value="dilation">Dilation</option>
                </select>
                <div id="trans-params">
                    <input type="number" id="p1" placeholder="dx" style="width:45%" class="math-input">
                    <input type="number" id="p2" placeholder="dy" style="width:45%" class="math-input">
                </div>
                <button onclick="addMove()" class="primary-btn" style="grid-column: span 2;">Add Move</button>
            </div>
        `;
    } else {
        html += `<button onclick="checkSequence()" class="primary-btn" style="width:100%">Verify Sequence</button>`;
    }

    qContent.innerHTML = html;
}

window.toggleInputs = function() {
    const type = document.getElementById('trans-type').value;
    const container = document.getElementById('trans-params');
    if (type === 'translation') {
        container.innerHTML = `<input type="number" id="p1" placeholder="dx" style="width:45%" class="math-input"> <input type="number" id="p2" placeholder="dy" style="width:45%" class="math-input">`;
    } else if (type === 'reflection') {
        container.innerHTML = `<select id="p1" class="math-input" style="width:100%"><option value="x-axis">x-axis</option><option value="y-axis">y-axis</option></select>`;
    } else if (type === 'rotation') {
        container.innerHTML = `<select id="p1" class="math-input" style="width:100%"><option value="90">90° CCW</option><option value="180">180°</option><option value="270">270° CCW</option></select>`;
    } else {
        container.innerHTML = `<input type="number" id="p1" placeholder="scale" step="0.1" style="width:100%" class="math-input">`;
    }
}

window.addMove = function() {
    const type = document.getElementById('trans-type').value;
    let move = { type };
    if (type === 'translation') {
        move.dx = parseInt(document.getElementById('p1').value);
        move.dy = parseInt(document.getElementById('p2').value);
        move.label = `Translate (${move.dx}, ${move.dy})`;
    } else if (type === 'reflection') {
        move.axis = document.getElementById('p1').value;
        move.label = `Reflect over ${move.axis}`;
    } else if (type === 'rotation') {
        move.deg = parseInt(document.getElementById('p1').value);
        move.label = `Rotate ${move.deg}° CCW`;
    } else {
        move.factor = parseFloat(document.getElementById('p1').value);
        move.label = `Dilate by ${move.factor}`;
    }
    userSequence.push(move);
    renderTransformationUI();
}

window.checkSequence = function() {
    let x = currentTask.startX;
    let y = currentTask.startY;

    userSequence.forEach(m => {
        if (m.type === 'translation') { x += m.dx; y += m.dy; }
        else if (m.type === 'reflection') { if (m.axis === 'x-axis') y = -y; else x = -x; }
        else if (m.type === 'rotation') {
            if (m.deg === 90) { let t = x; x = -y; y = t; }
            else if (m.deg === 180) { x = -x; y = -y; }
            else { let t = x; x = y; y = -t; }
        } else if (m.type === 'dilation') { x *= m.factor; y *= m.factor; }
    });

    if (Math.abs(x - currentTask.endX) < 0.1 && Math.abs(y - currentTask.endY) < 0.1) {
        currentRound++;
        if (currentRound >= totalRounds) finishTransGame();
        else startNewRound();
    } else {
        transErrorCount++;
        alert("The final coordinates don't match! Try a different sequence.");
        userSequence = [];
        renderTransformationUI();
    }
}

async function finishTransGame() {
    window.isCurrentQActive = false;
    if (window.supabaseClient && window.currentUser) {
        try {
            let adjustment = (transErrorCount === 0) ? 1 : (transErrorCount > 3 ? -1 : 0);
            let newScore = Math.max(0, Math.min(10, currentMastery + adjustment));
            await window.supabaseClient.from('assignment').update({ Transformation: newScore }).eq('userName', window.currentUser);
        } catch(e) { console.error(e); }
    }
    setTimeout(() => { loadNextQuestion(); }, 1500);
}
