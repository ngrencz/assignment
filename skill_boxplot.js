let currentBoxData = {};
let boxErrorCount = 0;

function initBoxPlotGame() {
    isCurrentQActive = true;
    currentQSeconds = 0;
    currentQCap = 120; // 2 minutes
    boxErrorCount = 0;

    // 1. Generate random but clean Box Plot markers
    // Standard box plot splits data into 25% chunks
    const median = Math.floor(Math.random() * 5) + 5; // 5-10
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
        <div style="text-align:center; margin-bottom:20px;">
            <canvas id="boxCanvas" width="400" height="100" style="border:1px solid #eee;"></canvas>
        </div>
        <div id="box-question-area">
            <p><strong>Part A:</strong> What percent of data is <strong>above ${currentBoxData.q3}</strong>?</p>
            <input type="number" id="box-ans-a" placeholder="%"> %
            <hr>
            <p><strong>Part B:</strong> Can you find the <strong>mean (average)</strong> just by looking at this plot?</p>
            <button onclick="checkBoxLogic(true)">Yes</button>
            <button onclick="checkBoxLogic(false)">No</button>
        </div>
        <div id="box-feedback" style="margin-top:15px; font-weight:bold;"></div>
    `;
    drawBoxPlot();
}

function drawBoxPlot() {
    const canvas = document.getElementById('boxCanvas');
    const ctx = canvas.getContext('2d');
    const scale = 15; // pixels per unit
    const offset = 50;

    ctx.clearRect(0, 0, 400, 100);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;

    const y = 50;
    // Whiskers
    ctx.beginPath();
    ctx.moveTo(offset + currentBoxData.min * scale, y);
    ctx.lineTo(offset + currentBoxData.q1 * scale, y);
    ctx.moveTo(offset + currentBoxData.q3 * scale, y);
    ctx.lineTo(offset + currentBoxData.max * scale, y);
    ctx.stroke();

    // Box
    ctx.strokeRect(offset + currentBoxData.q1 * scale, y - 20, (currentBoxData.q3 - currentBoxData.q1) * scale, 40);
    
    // Median Line
    ctx.beginPath();
    ctx.moveTo(offset + currentBoxData.median * scale, y - 20);
    ctx.lineTo(offset + currentBoxData.median * scale, y + 20);
    ctx.stroke();
}

async function checkBoxLogic(val) {
    const feedback = document.getElementById('box-feedback');
    if (val === false) {
        feedback.innerHTML = "<span style='color:green;'>Correct! Box plots show the median, not the mean.</span>";
        checkFinalBoxScore(true);
    } else {
        boxErrorCount++;
        feedback.innerHTML = "<span style='color:red;'>Not quite. Think about what data points are missing.</span>";
    }
}

async function checkFinalBoxScore(logicPass) {
    const ansA = parseInt(document.getElementById('box-ans-a').value);
    // In a box plot, each segment (whisker/box half) is 25%
    if (ansA === 25 && logicPass) {
        let score = Math.max(1, 10 - (boxErrorCount * 2));
        
        // Update Supabase
        await supabaseClient.from('assignment').update({ 
            BoxPlotQuartile: score,
            BoxPlotLogic: 10,
            BoxPlot: score 
        }).eq('userName', currentUser);

        alert("Mastery Updated!");
        loadNextQuestion();
    } else {
        boxErrorCount++;
        document.getElementById('box-feedback').innerText = "Check your percentage for Part A!";
    }
}
