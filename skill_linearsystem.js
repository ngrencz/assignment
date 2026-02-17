var linearErrorCount = 0;
var linearStep = 1; 
var currentSystem = {};
var userPoints = [];

window.initLinearSystemGame = async function() {
    window.isCurrentQActive = true;
    window.currentQSeconds = 0;
    linearErrorCount = 0;
    linearStep = 1;
    userPoints = [];

    // 1. Pick Type: 0=One, 1=None, 2=Infinite
    const type = Math.floor(Math.random() * 3); 
    
    // 2. Generate varied slopes and intercepts
    const slopes = [-4, -3, -2, -1, 1, 2, 3, 4];
    let m1 = slopes[Math.floor(Math.random() * slopes.length)];
    let tx = Math.floor(Math.random() * 9) - 4; 
    let ty = Math.floor(Math.random() * 9) - 4; 
    let b1 = ty - (m1 * tx);
    
    let m2, b2, correctCount;

    if (type === 0) { // ONE SOLUTION
        do { m2 = slopes[Math.floor(Math.random() * slopes.length)]; } while (m1 === m2);
        b2 = ty - (m2 * tx);
        correctCount = 1;
    } else if (type === 1) { // NONE (Parallel)
        m2 = m1;
        b2 = b1 + (Math.random() > 0.5 ? 2 : -2);
        correctCount = 0;
    } else { // INFINITE
        m2 = m1;
        b2 = b1;
        correctCount = Infinity;
    }

    // 3. Clean Formatting (Hide the "1" in 1x or -1x)
    const formatEq = (m, b) => {
        let mPart = m === 1 ? "" : m === -1 ? "-" : m;
        let bPart = b === 0 ? "" : b > 0 ? ` + ${b}` : ` - ${Math.abs(b)}`;
        return `y = ${mPart}x${bPart}`;
    };

    const girls = ["Maya", "Elena", "Amara", "Chloe"];
    const boys = ["Liam", "Caleb", "Isaac", "Noah"];

    currentSystem = {
        m1, b1, m2, b2,
        correctCount,
        girl: { name: girls[Math.floor(Math.random()*4)], x: tx, y: ty, isCorrect: (type !== 1) },
        boy: { name: boys[Math.floor(Math.random()*4)], x: tx+1, y: ty+1, isCorrect: (type === 2) },
        eq1Disp: formatEq(m1, b1),
        eq2Disp: formatEq(m2, b2)
    };

    renderLinearUI();
};

function renderLinearUI() {
    const qContent = document.getElementById('q-content');
    if (!qContent) return;
    document.getElementById('q-title').innerText = "System Analysis";

    let html = `
        <div style="background:#f8fafc; padding:15px; border-radius:12px; margin-bottom:15px; border: 1px solid #e2e8f0; text-align:center;">
            <p style="font-family:monospace; font-size:1.3rem; margin:0;">
                1: <strong>${currentSystem.eq1Disp}</strong><br>
                2: <strong>${currentSystem.eq2Disp}</strong>
            </p>
        </div>
        <div id="linear-fb" style="display:none; padding:10px; border-radius:8px; margin-bottom:10px; text-align:center;"></div>`;

    if (linearStep === 1) {
        html += `<p>Step 1: ${currentSystem.girl.name} thinks the solution is (${currentSystem.girl.x}, ${currentSystem.girl.y}). Correct?</p>
                 <button class="primary-btn" onclick="checkStep(true, 'girl')">Yes</button>
                 <button class="secondary-btn" onclick="checkStep(false, 'girl')">No</button>`;
    } else if (linearStep === 2) {
        html += `<p>Step 2: ${currentSystem.boy.name} thinks the solution is (${currentSystem.boy.x}, ${currentSystem.boy.y}). Correct?</p>
                 <button class="primary-btn" onclick="checkStep(true, 'boy')">Yes</button>
                 <button class="secondary-btn" onclick="checkStep(false, 'boy')">No</button>`;
    } else if (linearStep === 3) {
        html += `<p>Step 3: How many solutions?</p>
                 <button class="primary-btn" onclick="checkCount(1)">One</button>
                 <button class="primary-btn" onclick="checkCount(0)">None</button>
                 <button class="primary-btn" onclick="checkCount(Infinity)">Infinite</button>`;
    } else {
        html += `<p>Step 4: Graph Line 1 (Blue) then Line 2 (Red).</p>
                 <canvas id="systemCanvas" width="300" height="300" style="background:white; border:2px solid #333; display:block; margin:0 auto; cursor:crosshair;"></canvas>
                 <div id="graph-status" style="text-align:center; margin-top:10px; font-weight:bold; color:#3b82f6;">Line 1: Pt 1</div>`;
    }

    qContent.innerHTML = html;
    if (linearStep === 4) initCanvas();
}

window.checkStep = function(choice, peer) {
    if (choice === currentSystem[peer].isCorrect) {
        linearStep++;
        renderLinearUI();
    } else {
        linearErrorCount++;
        const fb = document.getElementById('linear-fb');
        if(fb) { fb.style.display="block"; fb.style.background="#fee2e2"; fb.innerText="Check the math again!"; }
    }
};

window.checkCount = function(val) {
    if (val === currentSystem.correctCount) {
        linearStep = 4;
        renderLinearUI();
    } else {
        linearErrorCount++;
        alert("Look at the slopes!");
    }
};

// --- Standard Canvas Logic ---
function initCanvas() {
    const canvas = document.getElementById('systemCanvas');
    const ctx = canvas.getContext('2d');
    const step = 30;

    function draw() {
        ctx.clearRect(0,0,300,300);
        ctx.strokeStyle="#e2e8f0";
        for(let i=0; i<=300; i+=step) {
            ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,300); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(300,i); ctx.stroke();
        }
        ctx.strokeStyle="#000"; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(150,0); ctx.lineTo(150,300); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,150); ctx.lineTo(300,150); ctx.stroke();
    }
    draw();

    canvas.onclick = function(e) {
        const rect = canvas.getBoundingClientRect();
        const gx = Math.round((e.clientX - rect.left - 150) / step);
        const gy = Math.round((150 - (e.clientY - rect.top)) / step);
        userPoints.push({x: gx, y: gy});
        
        ctx.fillStyle = userPoints.length <= 2 ? "blue" : "red";
        ctx.beginPath(); ctx.arc(150 + gx*step, 150 - gy*step, 5, 0, 7); ctx.fill();

        if (userPoints.length === 2) validate(1);
        if (userPoints.length === 4) validate(2);
    };

    function validate(n) {
        const p1 = userPoints[n===1?0:2];
        const p2 = userPoints[n===1?1:3];
        const m = n===1?currentSystem.m1:currentSystem.m2;
        const b = n===1?currentSystem.b1:currentSystem.b2;
        const um = (p2.y-p1.y)/(p2.x-p1.x);
        const ub = p1.y - (um*p1.x);

        if (um === m && Math.abs(ub - b) < 0.1) {
            if (n === 2) finalize();
        } else {
            linearErrorCount++;
            alert("Incorrect line!");
            userPoints = n===1?[]:[userPoints[0], userPoints[1]];
            draw();
        }
    }
}

async function finalize() {
    const pts = Math.max(1, 10 - linearErrorCount);
    if (window.supabaseClient) {
        const { data } = await window.supabaseClient.from('assignment').select('LinearSystem').eq('userName', window.currentUser).single();
        const cur = data?.LinearSystem || 0;
        await window.supabaseClient.from('assignment').update({ LinearSystem: Math.min(10, cur + (pts/5)) }).eq('userName', window.currentUser);
    }
    if(window.loadNextQuestion) window.loadNextQuestion();
}
