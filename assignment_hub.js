
    let linearErrorCount = 0;
    let currentStep = 1; 
    let currentSystem = {};
    let userPoints = [];

    const femaleNames = ["Maya", "Sarah", "Elena", "Chloe", "Amara", "Jasmine"];
    const maleNames = ["Liam", "Noah", "Caleb", "Ethan", "Leo", "Isaac"];

    window.initLinearSystemGame = async function() {
        window.isCurrentQActive = true;
        window.currentQSeconds = 0;
        linearErrorCount = 0;
        currentStep = 1;
        userPoints = [];

        // 1. Generate intersection (within visible -4 to 4)
        const targetX = Math.floor(Math.random() * 7) - 3; 
        const targetY = Math.floor(Math.random() * 7) - 3; 

        // 2. Generate slopes that keep the line manageable
        let m1 = Math.floor(Math.random() * 2) + 1; 
        let m2 = Math.floor(Math.random() * 2) - 1; 
        if (m2 === 0) m2 = -2; // Avoid zero slope for variety

        const b1 = targetY - (m1 * targetX);
        const b2 = targetY - (m2 * targetX);

        // Safety: Redo if the intercept is way off the 300px canvas
        if (Math.abs(b1) > 4 || Math.abs(b2) > 4) return window.initLinearSystemGame();

        const girl = femaleNames[Math.floor(Math.random() * femaleNames.length)];
        const boy = maleNames[Math.floor(Math.random() * maleNames.length)];

        const girlCorrect = Math.random() > 0.5;
        const boyCorrect = !girlCorrect;

        currentSystem = {
            m1, b1, m2, b2,
            targetX, targetY,
            girl: { name: girl, x: girlCorrect ? targetX : targetX + 1, y: girlCorrect ? targetY : targetY + 1, isCorrect: girlCorrect },
            boy: { name: boy, x: boyCorrect ? targetX : targetX - 1, y: boyCorrect ? targetY : targetY - 1, isCorrect: boyCorrect },
            eq1Disp: `y = ${m1 === 1 ? '' : m1}x ${b1 >= 0 ? '+ ' + b1 : '- ' + Math.abs(b1)}`,
            eq2Disp: `y = ${m2 === 1 ? '' : m2 === -1 ? '-' : m2}x ${b2 >= 0 ? '+ ' + b2 : '- ' + Math.abs(b2)}`
        };

        renderLinearUI();
    };

    function renderLinearUI() {
        const qContent = document.getElementById('q-content');
        document.getElementById('q-title').innerText = "System Analysis";

        let html = `
            <div style="background:#f8fafc; padding:15px; border-radius:12px; margin-bottom:15px; border: 1px solid #e2e8f0; text-align:center;">
                <p style="font-family:monospace; font-size:1.2rem; margin:0;">
                    1: <strong>${currentSystem.eq1Disp}</strong><br>
                    2: <strong>${currentSystem.eq2Disp}</strong>
                </p>
            </div>`;

        if (currentStep === 1) {
            html += `<p><strong>Step 1:</strong> ${currentSystem.girl.name} thinks the solution is (${currentSystem.girl.x}, ${currentSystem.girl.y}). Is she correct?</p>
                <div style="display:flex; gap:10px; justify-content:center;">
                    <button class="primary-btn" onclick="checkPeer(true, 'girl')">Yes</button>
                    <button class="secondary-btn" onclick="checkPeer(false, 'girl')">No</button>
                </div>`;
        } else if (currentStep === 2) {
            html += `<p><strong>Step 2:</strong> ${currentSystem.boy.name} thinks the solution is (${currentSystem.boy.x}, ${currentSystem.boy.y}). Is he correct?</p>
                <div style="display:flex; gap:10px; justify-content:center;">
                    <button class="primary-btn" onclick="checkPeer(true, 'boy')">Yes</button>
                    <button class="secondary-btn" onclick="checkPeer(false, 'boy')">No</button>
                </div>`;
        } else if (currentStep === 3) {
            html += `<p><strong>Step 3:</strong> How many solutions does this system have?</p>
                <div style="display:grid; grid-template-columns: 1fr; gap:10px;">
                    <button class="primary-btn" onclick="checkSolutionCount(1)">Exactly One (Intersecting)</button>
                    <button class="primary-btn" onclick="checkSolutionCount(0)">None (Parallel)</button>
                </div>`;
        } else {
            html += `<p><strong>Step 4:</strong> Plot 2 points for Line 1 (Blue), then 2 points for Line 2 (Red).</p>
                <div style="text-align:center;">
                    <canvas id="systemCanvas" width="300" height="300" style="background:white; border:2px solid #cbd5e1; cursor:crosshair;"></canvas>
                    <div id="graph-status" style="margin-top:5px; font-weight:bold; color:#3b82f6;">Line 1: Plot Point 1</div>
                </div>`;
        }

        qContent.innerHTML = html;
        if (currentStep === 4) initCanvas();
    }

    window.checkPeer = function(userSaidCorrect, peerKey) {
        const peer = currentSystem[peerKey];
        const feedback = document.getElementById('feedback-box');
        feedback.style.display = "block";
        if (userSaidCorrect === peer.isCorrect) {
            feedback.className = "correct";
            feedback.innerText = "Correct!";
            currentStep++;
            setTimeout(renderLinearUI, 800);
        } else {
            linearErrorCount++;
            feedback.className = "incorrect";
            feedback.innerText = "Check the math again!";
        }
    };

    window.checkSolutionCount = function(count) {
        const feedback = document.getElementById('feedback-box');
        feedback.style.display = "block";
        if (count === 1) {
            feedback.className = "correct";
            feedback.innerText = "Correct! Slopes are different.";
            currentStep = 4;
            setTimeout(renderLinearUI, 800);
        } else {
            linearErrorCount++;
            feedback.className = "incorrect";
            feedback.innerText = "Look closely at the slopes!";
        }
    };

    function initCanvas() {
        const canvas = document.getElementById('systemCanvas');
        const ctx = canvas.getContext('2d');
        const step = 30;

        function drawGrid() {
            ctx.clearRect(0,0,300,300);
            ctx.strokeStyle = "#e2e8f0";
            for(let i=0; i<=300; i+=step) {
                ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,300); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(300,i); ctx.stroke();
            }
            ctx.strokeStyle = "#000"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(150,0); ctx.lineTo(150,300); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0,150); ctx.lineTo(300,150); ctx.stroke();
        }

        function redrawLines() {
            drawGrid();
            // Redraw Line 1 if it was already validated
            if (userPoints.length >= 2) {
                const lp1 = userPoints[0]; const lp2 = userPoints[1];
                ctx.strokeStyle = "#3b82f6"; ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(150 + (lp1.x-10)*step, 150 - (lp1.y + currentSystem.m1*(lp1.x-10 - lp1.x))*step);
                ctx.lineTo(150 + (lp1.x+10)*step, 150 - (lp1.y + currentSystem.m1*(lp1.x+10 - lp1.x))*step);
                ctx.stroke();
                // Draw dots for line 1
                ctx.fillStyle = "#3b82f6";
                [lp1, lp2].forEach(p => { ctx.beginPath(); ctx.arc(150 + p.x*step, 150 - p.y*step, 5, 0, Math.PI*2); ctx.fill(); });
            }
            // Draw current dots for Line 2
            if (userPoints.length > 2) {
                ctx.fillStyle = "#ef4444";
                for (let i=2; i < userPoints.length; i++) {
                    ctx.beginPath(); ctx.arc(150 + userPoints[i].x*step, 150 - userPoints[i].y*step, 5, 0, Math.PI*2); ctx.fill();
                }
            }
        }

        drawGrid();

        canvas.onclick = function(e) {
            const rect = canvas.getBoundingClientRect();
            const gridX = Math.round(((e.clientX - rect.left) - 150) / step);
            const gridY = Math.round((150 - (e.clientY - rect.top)) / step);
            
            userPoints.push({x: gridX, y: gridY});
            
            if (userPoints.length === 2) {
                validateLine(1);
            } else if (userPoints.length === 4) {
                validateLine(2);
            } else {
                redrawLines();
            }
            updateStatus();
        };

        function validateLine(num) {
            const p1 = userPoints[num === 1 ? 0 : 2];
            const p2 = userPoints[num === 1 ? 1 : 3];
            const m = num === 1 ? currentSystem.m1 : currentSystem.m2;
            const b = num === 1 ? currentSystem.b1 : currentSystem.b2;
            
            if (p1.x === p2.x) { userPoints.pop(); redrawLines(); return; }

            const userM = (p2.y - p1.y) / (p2.x - p1.x);
            const userB = p1.y - (userM * p1.x);

            if (userM === m && userB === b) {
                redrawLines();
                if (num === 1) {
                    // Just finished line 1 successfully
                } else {
                    // Finished line 2, draw it and end
                    ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(150 + (p1.x-10)*step, 150 - (p1.y + userM*(p1.x-10 - p1.x))*step);
                    ctx.lineTo(150 + (p1.x+10)*step, 150 - (p1.y + userM*(p1.x+10 - p1.x))*step);
                    ctx.stroke();
                    finalize();
                }
            } else {
                linearErrorCount++;
                // Reset ONLY the current line's points
                userPoints = (num === 1) ? [] : [userPoints[0], userPoints[1]];
                redrawLines();
                alert("That line is incorrect. Check your slope/intercept!");
            }
        }
    }

    function updateStatus() {
        const el = document.getElementById('graph-status');
        if (!el) return;
        const msgs = ["Line 1: Plot Point 1", "Line 1: Plot Point 2", "Line 2: Plot Point 1", "Line 2: Plot Point 2"];
        el.innerText = msgs[userPoints.length] || "Intersection Found!";
    }

   async function finalize() {
        const score = Math.max(1, 10 - linearErrorCount);
        
        // Use window.supabaseClient or just supabaseClient, whichever exists
        const client = window.supabaseClient || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);

        if (client) {
            try {
                await client
                    .from('assignment')
                    .update({ LinearSystem: score })
                    .eq('userName', window.currentUser);
            } catch (e) {
                console.error("Database update failed:", e);
            }
        } else {
            console.warn("Supabase client not found. Skipping database update.");
        }
        
        // Always move to the next question even if the database fails
        if (typeof window.loadNextQuestion === 'function') {
            window.loadNextQuestion();
        }
    }
