// skill_boxplot.js
let currentBoxData = {};
let boxErrorCount = 0;
let currentStep = 0;
let sessionQuestions = [];

async function initBoxPlotGame() {
    window.isCurrentQActive = true;
    window.currentQSeconds = 0;
    boxErrorCount = 0;
    currentStep = 0;

    // Generate fresh data
    // Fetch existing mastery to ensure the +1/-1 has a starting point
    const { data } = await window.supabaseClient
        .from('assignment')
        .select('BoxPlot, bp_median, bp_range, bp_quartiles, bp_iqr')
        .eq('userName', window.currentUser)
        .maybeSingle();
    
    window.userMastery = data || {};
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
    
    // 1. Layout & Scaling
    const padding = 40;
    const chartWidth = canvas.width - (padding * 2);
    const maxVal = 40;
    const scale = chartWidth / maxVal;
    const y = 65; // The vertical center of the box plot

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // --- 2. DRAW THE NUMBER LINE (The Axis) ---
    ctx.strokeStyle = "#94a3b8"; // Slate gray
    ctx.fillStyle = "#64748b";
    ctx.lineWidth = 1;
    ctx.font = "10px Arial";
    ctx.textAlign = "center";

    ctx.beginPath();
    ctx.moveTo(padding, y + 50); // Line position
    ctx.lineTo(padding + chartWidth, y + 50);
    ctx.stroke();

    // Draw Ticks and Axis Numbers every 5 units
    for (let i = 0; i <= maxVal; i += 5) {
        let xPos = padding + (i * scale);
        ctx.beginPath();
        ctx.moveTo(xPos, y + 50);
        ctx.lineTo(xPos, y + 55);
        ctx.stroke();
        ctx.fillText(i, xPos, y + 68); // Axis numbers
    }

    // --- 3. CALCULATE POSITIONS ---
    const pts = {
        min: padding + currentBoxData.min * scale,
        q1: padding + currentBoxData.q1 * scale,
        med: padding + currentBoxData.median * scale,
        q3: padding + currentBoxData.q3 * scale,
        max: padding + currentBoxData.max * scale
    };

    // --- 4. DRAW DATA LABELS (The Floating Numbers) ---
    ctx.fillStyle = "#1e293b"; // Dark slate
    ctx.font = "bold 12px Arial";
    // Place these well above the box so they don't crowd the whiskers
    ctx.fillText(currentBoxData.min, pts.min, y - 40);
    ctx.fillText(currentBoxData.q1, pts.q1, y - 40);
    ctx.fillText(currentBoxData.median, pts.med, y - 40);
    ctx.fillText(currentBoxData.q3, pts.q3, y - 40);
    ctx.fillText(currentBoxData.max, pts.max, y - 40);

    // --- 5. DRAW WHISKERS & CAPS ---
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Left Whisker
    ctx.moveTo(pts.min, y); ctx.lineTo(pts.q1, y);
    ctx.moveTo(pts.min, y - 10); ctx.lineTo(pts.min, y + 10); // End cap
    // Right Whisker
    ctx.moveTo(pts.q3, y); ctx.lineTo(pts.max, y);
    ctx.moveTo(pts.max, y - 10); ctx.lineTo(pts.max, y + 10); // End cap
    ctx.stroke();

    // --- 6. DRAW THE BOX ---
    ctx.fillStyle = "#f0fdf4"; // Very light green fill
    const boxWidth = pts.q3 - pts.q1;
    ctx.fillRect(pts.q1, y - 25, boxWidth, 50);
    ctx.strokeRect(pts.q1, y - 25, boxWidth, 50);
    
    // --- 7. DRAW THE MEDIAN (Bold Green) ---
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(pts.med, y - 25);
    ctx.lineTo(pts.med, y + 25);
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
        feedback.innerText = "✅ Correct!";

        // --- PRACTICE BALANCE LOGIC ---
        // 1. Determine adjustment (+1 if no errors on this step, -1 if they struggled)
        // Since box plots are often single-try, we can be strict or lenient here.
        let adjustment = (boxErrorCount === 0) ? 1 : 0; 
        
        // 2. Prepare the update object
        const updateObj = {};
        
        // Fetch current values from window if the Hub pre-loaded them, 
        // otherwise we just send the relative update.
        // For simplicity with your current setup, we'll increment the sub-skill.
        // NOTE: If you haven't changed these to float8, use whole numbers.
        
        // 3. Update the specific sub-column (e.g., bp_median)
        // We cap it at 10.
        updateObj[current.col] = Math.min(10, (window.userMastery?.[current.col] || 0) + adjustment);
        
        // 4. Update the main BoxPlot mastery
        let currentMain = window.userMastery?.['BoxPlot'] || 0;
        updateObj['BoxPlot'] = Math.max(0, Math.min(10, currentMain + adjustment));

        // 5. Send to Supabase
        await window.supabaseClient
            .from('assignment')
            .update(updateObj)
            .eq('userName', window.currentUser);

        // Update local mastery tracking
        if (!window.userMastery) window.userMastery = {};
        window.userMastery[current.col] = updateObj[current.col];
        window.userMastery['BoxPlot'] = updateObj['BoxPlot'];

        currentStep++;
        boxErrorCount = 0; // Reset error count for the next sub-question

        if (currentStep >= sessionQuestions.length) {
            window.isCurrentQActive = false; // Stop timer
            feedback.innerText = "✅ Box Plot Mastered!";
            setTimeout(loadNextQuestion, 1500);
        } else {
            setTimeout(renderBoxUI, 1000);
        }
    } else {
        // Increment error count for this specific step
        boxErrorCount++;
        feedback.className = "incorrect";
        feedback.innerText = `❌ Not quite. Hint: ${current.hint}`;
        
        // Optional: If they miss it 3 times, you could force a -1 here
        if (boxErrorCount >= 3) {
            // Logic to penalize for guessing/struggling
        }
    }
}
