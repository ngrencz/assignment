let currentBoxData = {};
let boxErrorCount = 0;

function initBoxPlotGame() {
    isCurrentQActive = true;
    currentQSeconds = 0;
    currentQCap = 120; 
    boxErrorCount = 0;

    // Generate random but clean Box Plot markers
    const median = Math.floor(Math.random() * 5) + 5; 
    const q1 = median - (Math.floor(Math.random() * 2) + 2);
    const q3 = median + (Math.floor(Math.random() * 3) + 3);
    const min = q1 - 3;
    const max = q3 + 10;

    currentBoxData = { min, q1, median, q3, max };

    renderBoxUI();
}

function renderBoxUI() {
    document.getElementById('q-title').innerText = "Interpreting Box Plots";
    document.getElementById('q-content').innerHTML = `
        <canvas id="boxCanvas" width="400" height="120"></canvas>
        
        <div id="box-question-area">
            <p><strong>Part A:</strong> What percent of data is <strong>above ${currentBoxData.q3}</strong>?</p>
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:20px;">
                <input type="number" id="box-ans-a" placeholder="0" style="width:80px;"> 
                <span style="font-weight:bold;">%</span>
            </div>
            
            <p><strong>Part B:</strong> Can you find the <strong>mean (average)</strong> just by looking at this plot?</p>
            <div style="display:flex; gap:10px;">
                <button onclick="checkBoxLogic(true)">Yes</button>
                <button onclick="checkBoxLogic(false)">No</button>
            </div>
        </div>
    `;
    drawBoxPlot();
}

function drawBoxPlot() {
    const canvas = document.getElementById('boxCanvas');
    const ctx = canvas.getContext('2d');
    const scale = 15; 
    const offset = 60;
    const y = 60;

    ctx.clearRect(0, 0, 400, 120);
    
    // Draw Axis line for context
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(10, y + 40);
    ctx.lineTo(390, y + 40);
    ctx.stroke();

    // Box Plot Styling
    ctx.strokeStyle = "#1a1a1a"; // Black
    ctx.lineWidth = 2;

    // Whiskers
    ctx.beginPath();
    ctx.moveTo(offset + currentBoxData.min * scale, y);
    ctx.lineTo(offset + currentBoxData.q1 * scale, y);
    ctx.moveTo(offset + currentBoxData.q3 * scale, y);
    ctx.lineTo(offset + currentBoxData.max * scale, y);
    ctx.stroke();

    // Box (Filled with very light green for a modern look)
    ctx.fillStyle = "#f0fdf4";
    ctx.fillRect(offset + currentBoxData.q1 * scale, y - 25, (currentBoxData.q3 - currentBoxData.q1) * scale, 50);
    ctx.strokeRect(offset + currentBoxData.q1 * scale, y - 25, (currentBoxData.q3 - currentBoxData.q1) * scale, 50);
    
    // Median Line (Kelly Green)
    ctx.strokeStyle = "#4CBB17";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(offset + currentBoxData.median * scale, y - 25);
    ctx.lineTo(offset + currentBoxData.median * scale, y + 25);
    ctx.stroke();
}

async function checkBoxLogic(val) {
    const feedback = document.getElementById('feedback-box');
    feedback.style.display = "block";

    if (val === false) {
        feedback.className = "correct";
        feedback.innerText = "Correct! Box plots show the median (middle value), but the mean cannot be calculated without the individual data points.";
        checkFinalBoxScore(true);
    } else {
        boxErrorCount++;
        feedback.className = "incorrect";
        feedback.innerText = "Not quite. Think about it: does the box show the average of all numbers, or just the middle position?";
    }
}

async function checkFinalBoxScore(logicPass) {
    const ansA = parseInt(document.getElementById('box-ans-a').value);
    const feedback = document.getElementById('feedback-box');

    // Each quartile segment is 25%
    if (ansA === 25 && logicPass) {
        let score = Math.max(1, 10 - (boxErrorCount * 2));
        
        await supabaseClient.from('assignment').update({ 
            BoxPlotQuartile: score,
            BoxPlotLogic: 10,
            BoxPlot: score 
        }).eq('userName', currentUser);

        setTimeout(() => {
            alert("Mastery Updated!");
            loadNextQuestion();
        }, 1000);
    } else if (ansA !== 25) {
        boxErrorCount++;
        feedback.className = "incorrect";
        feedback.style.display = "block";
        feedback.innerText = "Check your percentage for Part A. Remember, each 'whisker' and each 'half of the box' represents exactly 25% of the data.";
    }
}
