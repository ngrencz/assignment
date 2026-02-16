let currentShape = [];
let targetShape = [];
let errorCount = 0;
let currentSkill = "";

const SKILLS = ['C6Translation', 'C6ReflectionX', 'C6ReflectionY', 'C6ReflectionXY', 'C6Rotation', 'C6Dilation'];

async function initTransformationGame() {
    // 1. Diagnostic: Find the lowest score to practice
    const { data, error } = await supabaseClient.from('assignment').select('*').eq('userName', currentUser).single();
    if (error) return console.error(error);

    let skillScores = SKILLS.map(s => ({ name: s, val: data[s] || 0 }));
    skillScores.sort((a, b) => a.val - b.val);
    currentSkill = skillScores[0].name;

    // 2. Setup Problem
    let start = [[0, 0], [0, 2], [1, 1]];
    targetShape = JSON.parse(JSON.stringify(start));
    
    // Apply the "Secret Move" to create the target
    applySecretMove(currentSkill);

    // 3. Reset State
    currentShape = JSON.parse(JSON.stringify(start));
    errorCount = 0;
    currentQSeconds = 0;
    isCurrentQActive = true;
    currentQCap = (currentSkill.includes('Rotation') || currentSkill.includes('XY')) ? 150 : 90;

    renderUI();
}

function applySecretMove(skill) {
    let tx = Math.floor(Math.random() * 3) - 1;
    let ty = Math.floor(Math.random() * 3) - 1;

    switch(skill) {
        case 'C6Translation': targetShape.forEach(p => { p[0] += (tx||1); p[1] += (ty||1); }); break;
        case 'C6ReflectionX': targetShape.forEach(p => p[1] = -p[1]); break;
        case 'C6ReflectionY': targetShape.forEach(p => p[0] = -p[0]); break;
        case 'C6ReflectionXY': targetShape.forEach(p => { let x=p[0]; p[0]=p[1]; p[1]=x; }); break;
        case 'C6Rotation': targetShape.forEach(p => { let x=p[0]; p[0]=p[1]; p[1]=-x; }); break;
        case 'C6Dilation': targetShape.forEach(p => { p[0]*=2; p[1]*=2; }); break;
    }
}

function renderUI() {
    document.getElementById('q-title').innerText = `Skill Focus: ${currentSkill.replace('C6', '')}`;
    document.getElementById('q-content').innerHTML = `
        <canvas id="gridCanvas" width="300" height="300" style="border:2px solid #2d3748; background:#fff; display:block; margin:auto;"></canvas>
        <div style="margin-top:15px; display:grid; grid-template-columns: repeat(3, 1fr); gap:8px;">
            <button onclick="move('left')">Left</button> <button onclick="move('up')">Up</button> <button onclick="move('reflectX')">Reflect X</button>
            <button onclick="move('right')">Right</button> <button onclick="move('down')">Down</button> <button onclick="move('reflectY')">Reflect Y</button>
            <button onclick="move('rotate')">Rotate 90°</button> <button onclick="move('dilate')">Dilate x2</button> <button onclick="move('reflectXY')">Reflect Y=X</button>
            <button onclick="checkMatch()" style="grid-column: span 3; background:#38a169; color:white; padding:12px; font-weight:bold; border:none; border-radius:5px; cursor:pointer;">CHECK MY WORK</button>
        </div>
    `;
    draw();
}

function move(type) {
    if (type === 'left') currentShape.forEach(p => p[0] -= 1);
    if (type === 'right') currentShape.forEach(p => p[0] += 1);
    if (type === 'up') currentShape.forEach(p => p[1] += 1);
    if (type === 'down') currentShape.forEach(p => p[1] -= 1);
    if (type === 'reflectX') currentShape.forEach(p => p[1] = -p[1]);
    if (type === 'reflectY') currentShape.forEach(p => p[0] = -p[0]);
    if (type === 'reflectXY') currentShape.forEach(p => { let x=p[0]; p[0]=p[1]; p[1]=x; });
    if (type === 'rotate') currentShape.forEach(p => { let x=p[0]; p[0]=p[1]; p[1]=-x; });
    if (type === 'dilate') currentShape.forEach(p => { p[0]*=2; p[1]*=2; });
    draw();
}

function draw() {
    const canvas = document.getElementById('gridCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,300,300);
    // Grid Lines
    ctx.strokeStyle="#edf2f7"; ctx.beginPath();
    for(let i=0; i<=300; i+=30){ ctx.moveTo(i,0); ctx.lineTo(i,300); ctx.moveTo(0,i); ctx.lineTo(300,i); } ctx.stroke();
    // Axes
    ctx.strokeStyle="#cbd5e0"; ctx.lineWidth=2; ctx.beginPath();
    ctx.moveTo(150,0); ctx.lineTo(150,300); ctx.moveTo(0,150); ctx.lineTo(300,150); ctx.stroke();
    // Y=X Line
    if(currentSkill === 'C6ReflectionXY'){
        ctx.setLineDash([5,5]); ctx.strokeStyle="#a0aec0"; ctx.beginPath(); ctx.moveTo(0,300); ctx.lineTo(300,0); ctx.stroke(); ctx.setLineDash([]);
    }
    // Shapes
    ctx.lineWidth=1;
    ctx.fillStyle="rgba(237,137,54,0.3)"; drawShape(ctx, targetShape); // Orange Target
    ctx.fillStyle="rgba(49,130,206,0.7)"; drawShape(ctx, currentShape); // Blue Current
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
    const isCorrect = currentShape.every((p, i) => Math.abs(p[0]-targetShape[i][0]) < 0.1 && Math.abs(p[1]-targetShape[i][1]) < 0.1);
    
    if (isCorrect) {
        let score = Math.max(1, 10 - (errorCount * 2));
        const { data } = await supabaseClient.from('assignment').select('*').eq('userName', currentUser).single();
        
        let updates = {};
        updates[currentSkill] = score;
        
        // Calculate Aggregate
        let total = score; let count = 1;
        SKILLS.forEach(s => { if(s !== currentSkill && data[s] !== null){ total += data[s]; count++; } });
        updates['C6Transformation'] = Math.round(total/count);

        await supabaseClient.from('assignment').update(updates).eq('userName', currentUser);
        alert(`Correct! Score: ${score}/10. Mastery: ${updates['C6Transformation']}`);
        initTransformationGame();
    } else {
        errorCount++;
        alert("Not quite! Try another move.");
    }
}
