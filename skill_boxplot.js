// skill_boxplot.js
let currentBoxData = {};
let boxErrorCount = 0;
let currentStep = 0;
let sessionQuestions = [];

function initBoxPlotGame() {
    window.isCurrentQActive = true;
    window.currentQSeconds = 0;
    boxErrorCount = 0;
    currentStep = 0;

    // Generate fresh data
    const min = Math.floor(Math.random() * 5) + 2;
    const q1 = min + (Math.floor(Math.random() * 3) + 2);
    const median = q1 + (Math.floor(Math.random() * 4) + 2);
    const q3 = median + (Math.floor(Math.random() * 4) + 2);
    const max = q3 + (Math.floor(Math.random() * 5) + 3);
    currentBoxData = { min, q1, median, q3, max };

    const pool = [
        { q: "What is the median?", a: currentBoxData.median, hint: "Look for the green line.", col: "bp_median" },
        { q: "What is the Range?", a: currentBoxData.max - currentBoxData.min, hint: "Max - Min", col: "bp_range" },
        { q: "What is the Q1 (Lower Quartile)?", a: currentBoxData.q1, hint: "Left edge of the box.", col: "bp_quartiles" },
        { q: "What is the IQR?", a: currentBoxData.q3 - currentBoxData.q1, hint: "Box width (Q3 - Q1)", col: "bp_iqr" }
    ];

    sessionQuestions = pool.sort(() => 0.5 - Math.random()).slice(0, 3);
    renderBoxUI();
}

function renderBoxUI() {
    const current = sessionQuestions[currentStep];
    const qContent = document.getElementById('q-content');
    if (!qContent) return;

    document.getElementById('q-title').innerText = `Box Plot Mastery (${currentStep + 1}/3)`;
    qContent.innerHTML = `
        <div style="text-align:center; background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #e2e8f0;">
            <canvas id="boxCanvas" width="400" height="160" style="max-width:100%;"></canvas>
        </div>
        <div class="card">
            <p style="font-size: 1.1rem; margin-bottom: 15px;"><strong>Question:</strong> ${current.q}</p>
            <input type="number" id="box-ans" class="math-input" style="width: 100px; padding: 10px; margin-right: 10px;">
            <button onclick="checkStep()" class="primary-btn">Submit Answer</button>
            <div id="feedback-box" style="margin-top: 15px; display: none; padding: 10px; border-radius: 6px;"></div>
        </div>
    `;
    // CRITICAL: Must call the drawing function after the HTML is set!
    setTimeout(drawBoxPlot, 50); 
}



function drawBoxPlot() {
    const canvas = document.getElementById('boxCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const padding = 40;
    const chartWidth = canvas.width - (padding * 2);
    const scale = chartWidth / 40; // Scale based on 0-40
    const y = 70; 

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Axis
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, y + 50);
    ctx.lineTo(padding + chartWidth, y + 50);
    ctx.stroke();

    // Data points
    const pts = {
        min: padding + currentBoxData.min * scale,
        q1: padding + currentBoxData.q1 * scale,
        med: padding + currentBoxData.median * scale,
        q3: padding + currentBoxData.q3 * scale,
        max: padding + currentBoxData.max * scale
    };

    // Whiskers & Caps
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pts.min, y); ctx.lineTo(pts.q1, y); // Left
    ctx.moveTo(pts.q3, y); ctx.lineTo(pts.max, y); // Right
    ctx.moveTo(pts.min, y-10); ctx.lineTo(pts.min, y+10); // Min Cap
    ctx.moveTo(pts.max, y-10); ctx.lineTo(pts.max, y+10); // Max Cap
    ctx.stroke();

    // Box
    ctx.fillStyle = "#f0fdf4";
    ctx.fillRect(pts.q1, y - 30, pts.q3 - pts.q1, 60);
    ctx.strokeRect(pts.q1, y - 30, pts.q3 - pts.q1, 60);

    // Median Line
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(pts.med, y - 30); ctx.lineTo(pts.med, y + 30);
    ctx.stroke();

    // LABELS ON PLOT
    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(currentBoxData.min, pts.min, y - 40);
    ctx.fillText(currentBoxData.q1, pts.q1, y - 40);
    ctx.fillText(currentBoxData.median, pts.med, y - 40);
    ctx.fillText(currentBoxData.q3, pts.q3, y - 40);
    ctx.fillText(currentBoxData.max, pts.max, y - 40);
}

async function checkStep() {
    const userAns = parseInt(document.getElementById('box-ans').value);
    const current = sessionQuestions[currentStep];
    const feedback = document.getElementById('feedback-box');
    
    if (isNaN(userAns)) return;
    feedback.style.display = "block";

    if (userAns === current.a) {
        feedback.className = "correct";
        feedback.innerText = "✅ Correct!";
        
        // Update Supabase for the sub-skill
        const updateObj = {};
        updateObj[current.col] = 10; // Or calculate based on errors
        await window.supabaseClient.from('assignment').update(updateObj).eq('userName', window.currentUser);

        currentStep++;
        if (currentStep >= sessionQuestions.length) {
            setTimeout(loadNextQuestion, 1500);
        } else {
            setTimeout(renderBoxUI, 1000);
        }
    } else {
        boxErrorCount++;
        feedback.className = "incorrect";
        feedback.innerText = `❌ Not quite. Hint: ${current.hint}`;
    }
}
