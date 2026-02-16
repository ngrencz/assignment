let currentBoxData = {};
let boxErrorCount = 0;
let currentStep = 0;
let sessionQuestions = [];

function initBoxPlotGame() {
    isCurrentQActive = true;
    currentQSeconds = 0;
    currentQCap = 120; 
    boxErrorCount = 0;
    currentStep = 0;

    // 1. Data Generation
    const min = Math.floor(Math.random() * 5) + 2;
    const q1 = min + (Math.floor(Math.random() * 3) + 2);
    const median = q1 + (Math.floor(Math.random() * 4) + 2);
    const q3 = median + (Math.floor(Math.random() * 4) + 2);
    const max = q3 + (Math.floor(Math.random() * 5) + 3);
    currentBoxData = { min, q1, median, q3, max };

    // 2. Define the Question Pool
    const pool = [
        { q: "What is the median?", a: currentBoxData.median, hint: "Look for the bold green line inside the box.", col: "bp_median" },
        { q: "What is the Range?", a: currentBoxData.max - currentBoxData.min, hint: "Range = Max - Min.", col: "bp_range" },
        { q: "What is the Lower Quartile (Q1)?", a: currentBoxData.q1, hint: "Q1 is the left edge of the box.", col: "bp_quartiles" },
        { q: "What is the IQR?", a: currentBoxData.q3 - currentBoxData.q1, hint: "IQR = Q3 - Q1 (the box width).", col: "bp_iqr" },
        { q: `What % of data is above ${currentBoxData.q3}?`, a: 25, hint: "Every section (whisker or box-part) is 25%.", col: "bp_percent" }
    ];

    // 3. Pick 3 random questions
    sessionQuestions = pool.sort(() => 0.5 - Math.random()).slice(0, 3);

    renderBoxUI();
}

function renderBoxUI() {
    const current = sessionQuestions[currentStep];
    document.getElementById('q-title').innerText = `Box Plot Analysis (${currentStep + 1}/3)`;
    document.getElementById('q-content').innerHTML = `
        <div style="text-align:center; background: white; padding: 10px; border-radius: 8px; margin-bottom: 15px;">
            <canvas id="boxCanvas" width="400" height="150" style="max-width:100%;"></canvas>
        </div>
        <div class="card">
            <p><strong>Question:</strong> ${current.q}</p>
            <input type="number" id="box-ans" placeholder="?" class="math-input" style="width: 100px; margin-bottom: 10px;">
            <button onclick="checkStep()" class="primary-btn" style="width:100%;">Submit Answer</button>
        </div>
    `;
    drawBoxPlot();
}

function drawBoxPlot() {
    const canvas = document.getElementById('boxCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const padding = 40;
    const chartWidth = canvas.width - (padding * 2);
    const maxVal = 40;
    const scale = chartWidth / maxVal;
    const y = 70; 

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Axis
    ctx.strokeStyle = "#94a3b8";
    ctx.fillStyle = "#64748b";
    ctx.lineWidth = 1;
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.beginPath();
    ctx.moveTo(padding, y + 50);
    ctx.lineTo(padding + chartWidth, y + 50);
    ctx.stroke();

    for (let i = 0; i <= maxVal; i += 5) {
        let xPos = padding + (i * scale);
        ctx.beginPath(); ctx.moveTo(xPos, y + 50); ctx.lineTo(xPos, y + 55); ctx.stroke();
        ctx.fillText(i, xPos, y + 70);
    }

    // Whiskers
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding + currentBoxData.min * scale, y);
    ctx.lineTo(padding + currentBoxData.q1 * scale, y);
    ctx.moveTo(padding + currentBoxData.q3 * scale, y);
    ctx.lineTo(padding + currentBoxData.max * scale, y);
    ctx.stroke();

    // Box
    const boxX = padding + (currentBoxData.q1 * scale);
    const boxW = (currentBoxData.q3 - currentBoxData.q1) * scale;
    ctx.fillStyle = "#f0fdf4";
    ctx.fillRect(boxX, y - 30, boxW, 60);
    ctx.strokeRect(boxX, y - 30, boxW, 60);
    
    // Median
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 4;
    ctx.beginPath();
    const medX = padding + (currentBoxData.median * scale);
    ctx.moveTo(medX, y - 30);
    ctx.lineTo(medX, y + 30);
    ctx.stroke();
}

async function checkStep() {
    const userAns = parseInt(document.getElementById('box-ans').value);
    const current = sessionQuestions[currentStep];
    const feedback = document.getElementById('feedback-box');
    
    if (isNaN(userAns)) return;
    feedback.style.display = "block";

    if (userAns === current.a) {
        feedback.className = "correct";
        feedback.innerText = "Correct!";
        
        // Log individual sub-skill success
        await supabaseClient.rpc('increment_skill', { 
            col_name: current.col, 
            amount: 1, 
            user_id: currentUser 
        });

        currentStep++;

        if (currentStep >= sessionQuestions.length) {
            let finalScore = Math.max(1, 10 - (boxErrorCount * 1));
            await supabaseClient.from('assignment').update({ BoxPlot: finalScore }).eq('userName', currentUser);
            log("Box Plot Mastery Updated.");
            setTimeout(() => { loadNextQuestion(); }, 1500);
        } else {
            setTimeout(() => { 
                feedback.style.display = "none";
                renderBoxUI(); 
            }, 1000);
        }
    } else {
        boxErrorCount++;
        feedback.className = "incorrect";
        feedback.innerText = `Not quite. ${current.hint}`;
        
        await supabaseClient.rpc('increment_skill', { 
            col_name: current.col, 
            amount: -1, 
            user_id: currentUser 
        });
    }
}
