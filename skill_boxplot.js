// Unique variables for this module
let currentBoxData = {};
let boxErrorCount = 0;

function initBoxPlotGame() {
    isCurrentQActive = true;
    currentQSeconds = 0;
    currentQCap = 120; 
    boxErrorCount = 0;

    // Generate random markers that fit well on a 0-30 scale
    const min = Math.floor(Math.random() * 5) + 2; // 2-7
    const q1 = min + (Math.floor(Math.random() * 3) + 2); // 6-12
    const median = q1 + (Math.floor(Math.random() * 4) + 2); // 10-18
    const q3 = median + (Math.floor(Math.random() * 4) + 2); // 14-24
    const max = q3 + (Math.floor(Math.random() * 5) + 3); // 20-32

    currentBoxData = { min, q1, median, q3, max };

    renderBoxUI();
}

function renderBoxUI() {
    document.getElementById('q-title').innerText = "Interpreting Box Plots";
    document.getElementById('q-content').innerHTML = `
        <div style="text-align:center; background: white; padding: 10px; border-radius: 8px; margin-bottom: 15px;">
            <canvas id="boxCanvas" width="400" height="150" style="max-width:100%;"></canvas>
        </div>
        
        <div id="box-question-area" class="card">
            <p><strong>Part A:</strong> What percent of data is <strong>above ${currentBoxData.q3}</strong>?</p>
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:20px;">
                <input type="number" id="box-ans-a" placeholder="0" class="math-input" style="width: 80px;"> 
                <span style="font-weight:bold;">%</span>
            </div>
            
            <p><strong>Part B:</strong> Can you find the <strong>mean (average)</strong> just by looking at this plot?</p>
            <div style="display:flex; gap:20px; margin-bottom:20px;">
                <label style="cursor:pointer;"><input type="radio" name="mean-logic" value="yes"> Yes</label>
                <label style="cursor:pointer;"><input type="radio" name="mean-logic" value="no"> No</label>
            </div>

            <button onclick="checkFinalBoxScore()" class="primary-btn" style="width:100%;">Submit Answer</button>
        </div>
    `;
    drawBoxPlot();
}



function drawBoxPlot() {
    const canvas = document.getElementById('boxCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Auto-calculate scale to fit numbers 0 to 40
    const padding = 40;
    const chartWidth = canvas.width - (padding * 2);
    const maxVal = 40;
    const scale = chartWidth / maxVal;
    
    const y = 70; // Midpoint of box

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. Draw Axis and Labels
    ctx.strokeStyle = "#94a3b8";
    ctx.fillStyle = "#64748b";
    ctx.lineWidth = 1;
    ctx.font = "12px Arial";
    ctx.textAlign = "center";

    ctx.beginPath();
    ctx.moveTo(padding, y + 50);
    ctx.lineTo(padding + chartWidth, y + 50);
    ctx.stroke();

    // Draw ticks and numbers every 5 units
    for (let i = 0; i <= maxVal; i += 5) {
        let xPos = padding + (i * scale);
        ctx.beginPath();
        ctx.moveTo(xPos, y + 50);
        ctx.lineTo(xPos, y + 55);
        ctx.stroke();
        ctx.fillText(i, xPos, y + 70);
    }

    // 2. Draw Whiskers
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Left whisker
    ctx.moveTo(padding + currentBoxData.min * scale, y);
    ctx.lineTo(padding + currentBoxData.q1 * scale, y);
    // Right whisker
    ctx.moveTo(padding + currentBoxData.q3 * scale, y);
    ctx.lineTo(padding + currentBoxData.max * scale, y);
    ctx.stroke();

    // 3. Draw Box
    const boxX = padding + (currentBoxData.q1 * scale);
    const boxW = (currentBoxData.q3 - currentBoxData.q1) * scale;
    
    ctx.fillStyle = "#f0fdf4";
    ctx.fillRect(boxX, y - 30, boxW, 60);
    ctx.strokeRect(boxX, y - 30, boxW, 60);
    
    // 4. Draw Median Line (Bold Green)
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 4;
    ctx.beginPath();
    const medX = padding + (currentBoxData.median * scale);
    ctx.moveTo(medX, y - 30);
    ctx.lineTo(medX, y + 30);
    ctx.stroke();
}

async function checkFinalBoxScore() {
    const ansA = parseInt(document.getElementById('box-ans-a').value);
    const radioSelection = document.querySelector('input[name="mean-logic"]:checked');
    const feedback = document.getElementById('feedback-box');
    
    feedback.style.display = "block";

    if (!radioSelection || isNaN(ansA)) {
        feedback.className = "incorrect";
        feedback.innerText = "Please answer both parts of the question.";
        return;
    }

    const logicPass = radioSelection.value === "no";
    const percentPass = ansA === 25;

    if (logicPass && percentPass) {
        feedback.className = "correct";
        feedback.innerText = "Correct! Every section (whisker or box-half) is 25%. Mean cannot be determined.";
        
        let finalScore = Math.max(1, 10 - (boxErrorCount * 2));
        
        await supabaseClient.from('assignment').update({ 
            BoxPlot: finalScore 
        }).eq('userName', currentUser);

        setTimeout(() => { loadNextQuestion(); }, 2000);
    } else {
        boxErrorCount++;
        feedback.className = "incorrect";
        feedback.innerText = !percentPass ? "Check Part A: Each quartile represents 25%." : "Check Part B: Box plots only show the Median, not the Mean.";
    }
}
