{
    let linearErrorCount = 0;
    let currentStep = 1;
    let currentSystem = {};
    let userPoints = []; // To track clicks on the canvas

    const femaleNames = ["Maya", "Sarah", "Elena", "Chloe", "Amara", "Jasmine"];
    const maleNames = ["Liam", "Noah", "Caleb", "Ethan", "Leo", "Isaac"];

    window.initLinearSystemsGame = async function() {
        window.isCurrentQActive = true;
        window.currentQSeconds = 0;
        linearErrorCount = 0;
        currentStep = 1;
        userPoints = [];

        // 1. Generate a clean integer intersection (Target)
        const targetX = Math.floor(Math.random() * 7) - 3; // -3 to 3
        const targetY = Math.floor(Math.random() * 7) - 3; // -3 to 3

        // 2. Generate two different slopes (m)
        let m1 = Math.floor(Math.random() * 3) + 1; // 1 to 3
        let m2;
        do { m2 = Math.floor(Math.random() * 5) - 2; } while (m1 === m2 || m2 === 0);

        // 3. Calculate intercepts (b = y - mx)
        const b1 = targetY - (m1 * targetX);
        const b2 = targetY - (m2 * targetX);

        // 4. Generate Peer Proposals
        const girl = femaleNames[Math.floor(Math.random() * femaleNames.length)];
        const boy = maleNames[Math.floor(Math.random() * maleNames.length)];

        // Decide if their answers are correct (50/50 chance)
        const girlCorrect = Math.random() > 0.5;
        const boyCorrect = Math.random() > 0.5;

        currentSystem = {
            m1, b1, m2, b2,
            targetX, targetY,
            girl: { 
                name: girl, 
                x: girlCorrect ? targetX : targetX + 1, 
                y: girlCorrect ? targetY : targetY - 1,
                isCorrect: girlCorrect
            },
            boy: { 
                name: boy, 
                x: boyCorrect ? targetX : targetX - 2, 
                y: boyCorrect ? targetY : targetY + 1,
                isCorrect: boyCorrect
            },
            eq1Disp: `y = ${m1}x ${b1 >= 0 ? '+ ' + b1 : '- ' + Math.abs(b1)}`,
            eq2Disp: `y = ${m2}x ${b2 >= 0 ? '+ ' + b2 : '- ' + Math.abs(b2)}`
        };

        renderLinearUI();
    };

    function renderLinearUI() {
        const qContent = document.getElementById('q-content');
        document.getElementById('q-title').innerText = "System Analysis & Graphing";

        let html = `
            <div style="background:#f8fafc; padding:15px; border-radius:12px; margin-bottom:15px; border: 1px solid #e2e8f0; text-align:center;">
                <p style="font-family:monospace; font-size:1.2rem; margin:0;">
                    Line 1: <strong>${currentSystem.eq1Disp}</strong><br>
                    Line 2: <strong>${currentSystem.eq2Disp}</strong>
                </p>
            </div>
        `;

        if (currentStep === 1) {
            html += `
                <p><strong>Step 1:</strong> ${currentSystem.girl.name} thinks the solution is 
                (${currentSystem.girl.x}, ${currentSystem.girl.y}). Is she correct?</p>
                <div style="display:flex; gap:10px; justify-content:center;">
                    <button class="primary-btn" onclick="checkPeer(true, 'girl')">Yes, Correct</button>
                    <button class="secondary-btn" onclick="checkPeer(false, 'girl')">No, Incorrect</button>
                </div>`;
        } else if (currentStep === 2) {
            html += `
                <p><strong>Step 2:</strong> ${currentSystem.boy.name} claims the solution is 
                (${currentSystem.boy.x}, ${currentSystem.boy.y}). Is he correct?</p>
                <div style="display:flex; gap:10px; justify-content:center;">
                    <button class="primary-btn" onclick="checkPeer(true, 'boy')">Yes, Correct</button>
                    <button class="secondary-btn" onclick="checkPeer(false, 'boy')">No, Incorrect</button>
                </div>`;
        } else {
            html += `
                <p><strong>Step 3:</strong> Plot the lines. Click the graph to place 2 points for Line 1, then 2 points for Line 2.</p>
                <div style="text-align:center; position:relative;">
                    <canvas id="systemCanvas" width="300" height="300" style="background:white; border:2px solid #cbd5e1; cursor:crosshair;"></canvas>
                    <div id="graph-status" style="margin-top:5px; font-weight:bold; color:#3b82f6;">Line 1: Plot Point 1</div>
                </div>
                <button class="primary-btn" style="margin-top:10px; width:100%;" onclick="resetGraph()">Clear Points</button>`;
        }

        qContent.innerHTML = html;
        if (currentStep === 3) initCanvas();
    }

    window.checkPeer = function(userSaidCorrect, peerKey) {
        const peer = currentSystem[peerKey];
        const feedback = document.getElementById('feedback-box');
        feedback.style.display = "block";

        if (userSaidCorrect === peer.isCorrect) {
            feedback.className = "correct";
            feedback.innerText = `Correct! ${peer.name} was indeed ${peer.isCorrect ? 'right' : 'wrong'}.`;
            currentStep++;
            setTimeout(renderLinearUI, 1500);
        } else {
            linearErrorCount++;
            feedback.className = "incorrect";
            feedback.innerText = `Actually, ${peer.name} is ${peer.isCorrect ? 'correct' : 'incorrect'}. Check the math!`;
        }
    };

    function initCanvas() {
        const canvas = document.getElementById('systemCanvas');
        const ctx = canvas.getContext('2d');
        const centerX = 150; const centerY = 150; const step = 30; // 30px per unit

        function drawGrid() {
            ctx.clearRect(0,0,300,300);
            ctx.strokeStyle = "#e2e8f0";
            for(let i=0; i<=300; i+=step) {
                ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,300); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(300,i); ctx.stroke();
            }
            ctx.strokeStyle = "#475569"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(150,0); ctx.lineTo(150,300); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0,150); ctx.lineTo(300,150); ctx.stroke();
        }

        drawGrid();

        canvas.onclick = function(e) {
            const rect = canvas.getBoundingClientRect();
            const px = e.clientX - rect.left;
            const py = e.clientY - rect.top;

            // Snap to nearest grid intersection
            const gridX = Math.round((px - centerX) / step);
            const gridY = Math.round((centerY - py) / step);
            
            userPoints.push({x: gridX, y: gridY});
            
            // Draw point
            ctx.fillStyle = userPoints.length <= 2 ? "#3b82f6" : "#ef4444";
            ctx.beginPath();
            ctx.arc(centerX + gridX*step, centerY - gridY*step, 5, 0, Math.PI*2);
            ctx.fill();

            updateGraphStatus();
            if (userPoints.length === 2 || userPoints.length === 4) checkLine();
        };

        function checkLine() {
            const isLine1 = userPoints.length === 2;
            const p1 = userPoints[isLine1 ? 0 : 2];
            const p2 = userPoints[isLine1 ? 1 : 3];
            const m = isLine1 ? currentSystem.m1 : currentSystem.m2;
            const b = isLine1 ? currentSystem.b1 : currentSystem.b2;

            const userM = (p2.y - p1.y) / (p2.x - p1.x);
            const userB = p1.y - (userM * p1.x);

            if (userM === m && userB === b) {
                // Draw connecting line
                ctx.strokeStyle = isLine1 ? "#3b82f6" : "#ef4444";
                ctx.beginPath();
                ctx.moveTo(centerX + (p1.x-10)*step, centerY - (p1.y - (p1.x-10 - p1.x)*userM)*step);
                ctx.lineTo(centerX + (p1.x+10)*step, centerY - (p1.y - (p1.x+10 - p1.x)*userM)*step);
                ctx.stroke();
                
                if (userPoints.length === 4) finalizeGame();
            } else {
                linearErrorCount++;
                alert("That line is incorrect. Check your slope and intercept!");
                userPoints = isLine1 ? [] : [userPoints[0], userPoints[1]];
                drawGrid();
                // Redraw first line if it was correct
                if (!isLine1) { /* logic to persist line 1 */ }
                updateGraphStatus();
            }
        }
    }

    window.resetGraph = function() {
        userPoints = [];
        renderLinearUI();
    };

    function updateGraphStatus() {
        const el = document.getElementById('graph-status');
        if (userPoints.length === 0) el.innerText = "Line 1: Plot Point 1";
        else if (userPoints.length === 1) el.innerText = "Line 1: Plot Point 2";
        else if (userPoints.length === 2) el.innerText = "Line 2: Plot Point 1";
        else if (userPoints.length === 3) el.innerText = "Line 2: Plot Point 2";
    }

    async function finalizeGame() {
        const score = Math.max(1, 10 - linearErrorCount);
        await window.supabaseClient.from('assignment').update({ LinearSystem: score }).eq('userName', window.currentUser);
        window.loadNextQuestion();
    }
}
