{
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

        // Intersection points kept small to ensure they fit on the 300px canvas
        const targetX = Math.floor(Math.random() * 5) - 2; 
        const targetY = Math.floor(Math.random() * 5) - 2; 

        let m1 = Math.floor(Math.random() * 3) + 1;
        let m2;
        do { m2 = Math.floor(Math.random() * 5) - 2; } while (m1 === m2 || m2 === 0);

        const b1 = targetY - (m1 * targetX);
        const b2 = targetY - (m2 * targetX);

        const girl = femaleNames[Math.floor(Math.random() * femaleNames.length)];
        const boy = maleNames[Math.floor(Math.random() * maleNames.length)];

        const girlCorrect = Math.random() > 0.5;
        const boyCorrect = !girlCorrect;

        currentSystem = {
            m1, b1, m2, b2,
            targetX, targetY,
            girl: { name: girl, x: girlCorrect ? targetX : targetX + 1, y: girlCorrect ? targetY : targetY + 1, isCorrect: girlCorrect },
            boy: { name: boy, x: boyCorrect ? targetX : targetX - 1, y: boyCorrect ? targetY : targetY - 1, isCorrect: boyCorrect },
            eq1Disp: `y = ${m1}x ${b1 >= 0 ? '+ ' + b1 : '- ' + Math.abs(b1)}`,
            eq2Disp: `y = ${m2}x ${b2 >= 0 ? '+ ' + b2 : '- ' + Math.abs(b2)}`
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
                <button class="primary-btn" onclick="checkPeer(true, 'girl')">Yes</button>
                <button class="secondary-btn" onclick="checkPeer(false, 'girl')">No</button>`;
        } else if (currentStep === 2) {
            html += `<p><strong>Step 2:</strong> ${currentSystem.boy.name} thinks the solution is (${currentSystem.boy.x}, ${currentSystem.boy.y}). Is he correct?</p>
                <button class="primary-btn" onclick="checkPeer(true, 'boy')">Yes</button>
                <button class="secondary-btn" onclick="checkPeer(false, 'boy')">No</button>`;
        } else if (currentStep === 3) {
            html += `<p><strong>Step 3:</strong> How many solutions does this system have?</p>
                <button class="primary-btn" onclick="checkSolutionCount(1)">Exactly One</button>
                <button class="primary-btn" onclick="checkSolutionCount(0)">None</button>`;
        } else {
            html += `<p><strong>Step 4:</strong> Plot 2 points for Line 1, then 2 for Line 2.</p>
                <canvas id="systemCanvas" width="300" height="300" style="background:white; border:1px solid #ccc;"></canvas>
                <div id="graph-status">Line 1: Plot Point 1</div>`;
        }

        qContent.innerHTML = html;
        if (currentStep === 4) initCanvas();
    }

    window.checkPeer = function(choice, peerKey) {
        if (choice === currentSystem[peerKey].isCorrect) {
            currentStep++;
            renderLinearUI();
        } else {
            linearErrorCount++;
            alert("Incorrect. Check the point in both equations!");
        }
    };

    window.checkSolutionCount = function(count) {
        if (count === 1) {
            currentStep = 4;
            renderLinearUI();
        } else {
            linearErrorCount++;
            alert("Look at the slopes!");
        }
    };

    function initCanvas() {
        const canvas = document.getElementById('systemCanvas');
        const ctx = canvas.getContext('2d');
        const step = 30;

        function drawGrid() {
            ctx.clearRect(0,0,300,300);
            ctx.strokeStyle = "#eee";
            for(let i=0; i<=300; i+=step) {
                ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,300); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(300,i); ctx.stroke();
            }
            ctx.strokeStyle = "#000";
            ctx.beginPath(); ctx.moveTo(150,0); ctx.lineTo(150,300); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0,150); ctx.lineTo(300,150); ctx.stroke();
        }

        drawGrid();

        canvas.onclick = function(e) {
            const rect = canvas.getBoundingClientRect();
            const x = Math.round((e.clientX - rect.left - 150) / step);
            const y = Math.round((150 - (e.clientY - rect.top)) / step);
            
            userPoints.push({x, y});
            ctx.fillStyle = userPoints.length <= 2 ? "blue" : "red";
            ctx.beginPath(); ctx.arc(150 + x*step, 150 - y*step, 5, 0, Math.PI*2); ctx.fill();

            if (userPoints.length === 2) validateLine(1);
            if (userPoints.length === 4) validateLine(2);
        };

        function validateLine(num) {
            const p1 = userPoints[num === 1 ? 0 : 2];
            const p2 = userPoints[num === 1 ? 1 : 3];
            const m = num === 1 ? currentSystem.m1 : currentSystem.m2;
            const b = num === 1 ? currentSystem.b1 : currentSystem.b2;
            
            const userM = (p2.y - p1.y) / (p2.x - p1.x);
            const userB = p1.y - (userM * p1.x);

            if (userM === m && Math.abs(userB - b) < 0.1) {
                ctx.strokeStyle = num === 1 ? "blue" : "red";
                ctx.beginPath();
                ctx.moveTo(150 + (p1.x-10)*step, 150 - (p1.y + userM*(p1.x-10 - p1.x))*step);
                ctx.lineTo(150 + (p1.x+10)*step, 150 - (p1.y + userM*(p1.x+10 - p1.x))*step);
                ctx.stroke();
                if (num === 2) finalize();
            } else {
                linearErrorCount++;
                alert("Incorrect line.");
                userPoints = num === 1 ? [] : [userPoints[0], userPoints[1]];
                drawGrid();
            }
        }
    }

    async function finalize() {
        const score = Math.max(1, 10 - linearErrorCount);
        // Direct call to supabaseClient as it was working before
        await supabaseClient.from('assignment').update({ LinearSystem: score }).eq('userName', window.currentUser);
        window.loadNextQuestion();
    }
}
