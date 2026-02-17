var linearErrorCount = 0;
var linearStep = 1; 
var currentSystem = {};
var userPoints = [];

// --- Initialization ---

window.initLinearSystemGame = async function() {
    window.isCurrentQActive = true;
    window.currentQSeconds = 0;
    linearErrorCount = 0;
    linearStep = 1;
    userPoints = [];

    // 1. Randomly choose system type: 0 = One Solution, 1 = No Solution, 2 = Infinite
    const type = Math.floor(Math.random() * 3); 
    
    // Generate base coordinates for intersection or starting points
    const tx = Math.floor(Math.random() * 5) - 2; 
    const ty = Math.floor(Math.random() * 5) - 2; 
    let m1 = Math.floor(Math.random() * 3) + 1;
    let b1 = ty - (m1 * tx);
    
    let m2, b2, correctCount;

    if (type === 0) { 
        // EXACTLY ONE SOLUTION
        do { m2 = Math.floor(Math.random() * 5) - 2; } while (m1 === m2 || m2 === 0);
        b2 = ty - (m2 * tx);
        correctCount = 1;
    } else if (type === 1) { 
        // NO SOLUTION (Parallel Lines)
        m2 = m1;
        b2 = b1 + (Math.random() > 0.5 ? 2 : -2); 
        correctCount = 0;
    } else { 
        // INFINITE SOLUTIONS (Same Line)
        m2 = m1;
        b2 = b1;
        correctCount = Infinity;
    }

    // Peer data for Steps 1 & 2
    const girls = ["Maya", "Elena", "Amara", "Sarah"];
    const boys = ["Liam", "Caleb", "Isaac", "Noah"];
    
    currentSystem = {
        m1, b1, m2, b2,
        correctCount,
        girl: { 
            name: girls[Math.floor(Math.random() * 4)], 
            x: tx, y: ty, 
            isCorrect: (type !== 1) // Correct if they intersect or are same line
        },
        boy: { 
            name: boys[Math.floor(Math.random() * 4)], 
            x: tx + 1, y: ty + 1, 
            isCorrect: (type === 2 && (ty + 1) === (m1 * (tx + 1) + b1)) // Only true if Infinite
        },
        eq1Disp: `y = ${m1}x ${b1 >= 0 ? '+ ' + b1 : '- ' + Math.abs(b1)}`,
        eq2Disp: `y = ${m2}x ${b2 >= 0 ? '+ ' + b2 : '- ' + Math.abs(b2)}`
    };

    renderLinearUI();
};

// --- UI Rendering ---

function renderLinearUI() {
    const qContent = document.getElementById('q-content');
    if (!qContent) return;
    
    document.getElementById('q-title').innerText = "System Analysis";

    let header = `
        <div style="background:#f1f5f9; padding:15px; border-radius:12px; margin-bottom:15px; border: 1px solid #cbd5e1; text-align:center;">
            <p style="font-family:monospace; font-size:1.2rem; margin:0;">
                Line 1: <strong>${currentSystem.eq1Disp}</strong><br>
                Line 2: <strong>${currentSystem.eq2Disp}</strong>
            </p>
        </div>
        <div id="linear-feedback" style="display:none; padding:10px; border-radius:8px; margin-bottom:10px; text-align:center; font-weight:bold;"></div>`;

    let body = "";
    if (linearStep === 1) {
        body = `<p><strong>Step 1:</strong> ${currentSystem.girl.name} thinks (${currentSystem.girl.x}, ${currentSystem.girl.y}) is a solution. Is she correct?</p>
                <div style="display:flex; gap:10px; justify-content:center;">
                    <button class="primary-btn" onclick="checkStep(true, 'girl')" style="background:#4CBB17; color:white; padding:10px 25px; border-radius:8px; border:none; cursor:pointer;">Yes</button>
                    <button class="secondary-btn" onclick="checkStep(false, 'girl')" style="background:#64748b; color:white; padding:10px 25px; border-radius:8px; border:none; cursor:pointer;">No</button>
                </div>`;
    } else if (linearStep === 2) {
        body = `<p><strong>Step 2:</strong> ${currentSystem.boy.name} thinks (${currentSystem.boy.x}, ${currentSystem.boy.y}) is a solution. Is he correct?</p>
                <div style="display:flex; gap:10px; justify-content:center;">
                    <button class="primary-btn" onclick="checkStep(true, 'boy')" style="background:#4CBB17; color:white; padding:10px 25px; border-radius:8px; border:none; cursor:pointer;">Yes</button>
                    <button class="secondary-btn" onclick="checkStep(false, 'boy')" style="background:#64748b; color:white; padding:10px 25px; border-radius:8px; border:none; cursor:pointer;">No</button>
                </div>`;
    } else if (linearStep === 3) {
        body = `<p><strong>Step 3:</strong> How many solutions does this system have?</p>
                <div style="display:grid; gap:8px;">
                    <button class="primary-btn" onclick="checkCount(1)" style="padding:10px; border-radius:8px; border:1px solid #ccc; cursor:pointer;">Exactly One (Intersecting)</button>
                    <button class="primary-btn" onclick="checkCount(0)" style="padding:10px; border-radius:8px; border:1px solid #ccc; cursor:pointer;">No Solution (Parallel)</button>
                    <button class="primary-btn" onclick="checkCount(Infinity)" style="padding:10px; border-radius:8px; border:1px solid #ccc; cursor:pointer;">Infinite Solutions (Same Line)</button>
                </div>`;
    } else {
        body = `<p><strong>Step 4:</strong> Graph Line 1 (Blue) then Line 2 (Red).</p>
                <canvas id="systemCanvas" width="300" height="300" style="background:white; border:2px solid #333; display:block; margin:0 auto; cursor:crosshair;"></canvas>
                <div id="graph-status" style="text-align:center; margin-top:10px; font-weight:bold; color:#3b82f6;">Line 1: Plot Point 1</div>`;
    }

    qContent.innerHTML = header + body;
    if (linearStep === 4) initCanvas(); 
}

// --- Logic Checks ---

window.showLinearFeedback = function(msg, isCorrect) {
    const fb = document.getElementById('linear-feedback');
    if(!fb) return;
    fb.style.display = "block";
    fb.style.background = isCorrect ? "#dcfce7" : "#fee2e2";
    fb.style.color = isCorrect ? "#166534" : "#991b1b";
    fb.innerText = msg;
};

window.checkStep = function(userSaidYes, peerKey) {
    const isActuallyCorrect = currentSystem[peerKey].isCorrect;
    if (userSaidYes === isActuallyCorrect) {
        showLinearFeedback("Correct!", true);
        setTimeout(() => {
            linearStep++;
            renderLinearUI();
        }, 800);
    } else {
        linearErrorCount++;
        showLinearFeedback("Try again. Check both equations!", false);
    }
};

window.checkCount = function(val) {
    if (val === currentSystem.correctCount) {
        showLinearFeedback("Correct! Slopes and intercepts match the solution type.", true);
        setTimeout(() => {
            linearStep = 4;
            renderLinearUI();
        }, 800);
    } else {
        linearErrorCount++;
        showLinearFeedback("Incorrect. Look at the slopes!", false);
    }
};

// --- Canvas Graphing ---

function initCanvas() {
    const canvas = document.getElementById('systemCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const stepSize = 30;

    function drawGrid() {
        ctx.clearRect(0,0,300,300);
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 1;
        for(let i=0; i<=300; i+=stepSize) {
            ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,300); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(300,i); ctx.stroke();
        }
        ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(150,0); ctx.lineTo(150,300); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,150); ctx.lineTo(300,150); ctx.stroke();
    }

    function redraw() {
        drawGrid();
        // Redraw dots and lines for Line 1
        if (userPoints.length >= 2) {
            drawFullLine(userPoints[0], userPoints[1], "#3b82f6");
        }
        // Redraw dots for Line 2
        userPoints.forEach((p, i) => {
            ctx.fillStyle = i < 2 ? "#3b82f6" : "#ef4444";
            ctx.beginPath(); ctx.arc(150 + p.x*stepSize, 150 - p.y*stepSize, 5, 0, Math.PI*2); ctx.fill();
        });
    }

    function drawFullLine(p1, p2, color) {
        const um = (p2.y - p1.y) / (p2.x - p1.x);
        ctx.strokeStyle = color; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(150 + (p1.x-10)*stepSize, 150 - (p1.y + um*(p1.x-10 - p1.x))*stepSize);
        ctx.lineTo(150 + (p1.x+10)*stepSize, 150 - (p1.y + um*(p1.x+10 - p1.x))*stepSize);
        ctx.stroke();
    }

    drawGrid();

    canvas.onclick = function(e) {
        const rect = canvas.getBoundingClientRect();
        const gx = Math.round((e.clientX - rect.left - 150) / stepSize);
        const gy = Math.round((150 - (e.clientY - rect.top)) / stepSize);
        
        userPoints.push({x: gx, y: gy});
        redraw();

        const status = document.getElementById('graph-status');
        const msgs = ["Line 1: Pt 1", "Line 1: Pt 2", "Line 2: Pt 1", "Line 2: Pt 2", "Completed!"];
        if(status) status.innerText = msgs[userPoints.length] || "Success!";

        if (userPoints.length === 2) validateLine(1);
        if (userPoints.length === 4) validateLine(2);
    };

    function validateLine(num) {
        const p1 = userPoints[num === 1 ? 0 : 2];
        const p2 = userPoints[num === 1 ? 1 : 3];
        const m = num === 1 ? currentSystem.m1 : currentSystem.m2;
        const b = num === 1 ? currentSystem.b1 : currentSystem.b2;
        
        const um = (p2.y - p1.y) / (p2.x - p1.x);
        const ub = p1.y - (um * p1.x);

        if (um === m && Math.abs(ub - b) < 0.1) {
            redraw();
            if (num === 2) finalize();
        } else {
            linearErrorCount++;
            showLinearFeedback("Line " + (num===1?"1":"2") + " is incorrect. Check slope/intercept!", false);
            // Reset points for the specific line failed
            userPoints = (num === 1) ? [] : [userPoints[0], userPoints[1]];
            setTimeout(redraw, 1000);
        }
    }
}

// --- Finalization & Mastery ---

async function finalize() {
    const sessionPoints = Math.max(1, 10 - linearErrorCount);
    showLinearFeedback(`Mastered! Round score: ${sessionPoints}`, true);
    
    if (window.supabaseClient) {
        try {
            // Fetch current score for gradual mastery
            const { data } = await window.supabaseClient.from('assignment').select('LinearSystem').eq('userName', window.currentUser).single();
            const currentMastery = data?.LinearSystem || 0;
            
            // Gradual increase: 5 perfect rounds to reach 10
            const newMastery = Math.min(10, currentMastery + (sessionPoints / 5));

            await window.supabaseClient.from('assignment').update({ LinearSystem: newMastery }).eq('userName', window.currentUser);
        } catch (e) {
            console.error("DB Error:", e);
        }
    }
    
    setTimeout(() => {
        if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion();
    }, 1500);
}
