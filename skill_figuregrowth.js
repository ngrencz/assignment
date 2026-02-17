// --- Figure Growth State ---
let currentPattern = {};
let figureErrorCount = 0;
let currentStep = 1; // 1: FigureRule, 2: FigureDraw (Fig 3), 3: FigureX

function initFigureGrowthGame() {
    window.isCurrentQActive = true;
    window.currentQSeconds = 0;
    
    figureErrorCount = 0;
    currentStep = 1; 

    const m = Math.floor(Math.random() * 3) + 2; 
    const b = Math.floor(Math.random() * 5) + 1; 
    
    currentPattern = {
        m: m,
        b: b,
        fig2Count: (m * 2) + b,
        fig6Count: (m * 6) + b,
        targetX: Math.floor(Math.random() * 30) + 10 
    };

    renderFigureUI();
}

function renderFigureUI() {
    document.getElementById('q-title').innerText = `Tile Pattern Analysis`;
    
    let content = `
        <div style="background: #f8fafc; padding: 15px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #e2e8f0; text-align: center;">
            <p><strong>Figure 2:</strong> ${currentPattern.fig2Count} tiles | <strong>Figure 6:</strong> ${currentPattern.fig6Count} tiles</p>
        </div>
    `;

    if (currentStep === 1) {
        content += `
            <p><strong>Step 1:</strong> Find the rule (y = mx + b)</p>
            <div style="font-size: 1.5rem; text-align: center; margin: 20px 0;">
                y = <input type="number" id="input-m" placeholder="m" class="math-input" style="width:70px"> x + 
                <input type="number" id="input-b" placeholder="b" class="math-input" style="width:70px">
            </div>
        `;
    } else if (currentStep === 2) {
        content += `
            <p><strong>Step 2:</strong> How many tiles are in <strong>Figure 3</strong>?</p>
            <div style="text-align: center; margin: 20px 0;">
                <input type="number" id="input-ans" placeholder="Total tiles" class="math-input" style="width: 150px;">
            </div>
        `;
    } else {
        content += `
            <p><strong>Step 3:</strong> How many tiles in <strong>Figure ${currentPattern.targetX}</strong>?</p>
            <div style="text-align: center; margin: 20px 0;">
                <input type="number" id="input-ans" placeholder="Total tiles" class="math-input" style="width: 150px;">
            </div>
        `;
    }

    content += `<div style="text-align:center;"><button onclick="checkFigureAns()" class="primary-btn">Submit Answer</button></div>`;
    document.getElementById('q-content').innerHTML = content;
}

async function checkFigureAns() {
    let isCorrect = false;
    let stepKey = "";
    const feedback = document.getElementById('feedback-box');
    feedback.style.display = "block";

    if (currentStep === 1) {
        stepKey = "FigureRule";
        const uM = parseInt(document.getElementById('input-m').value);
        const uB = parseInt(document.getElementById('input-b').value);
        isCorrect = (uM === currentPattern.m && uB === currentPattern.b);
    } else if (currentStep === 2) {
        stepKey = "FigureDraw";
        const uAns = parseInt(document.getElementById('input-ans').value);
        isCorrect = (uAns === (currentPattern.m * 3) + currentPattern.b);
    } else {
        stepKey = "FigureX";
        const uAns = parseInt(document.getElementById('input-ans').value);
        isCorrect = (uAns === (currentPattern.m * currentPattern.targetX) + currentPattern.b);
    }

    if (isCorrect) {
        feedback.className = "correct-box";
        feedback.innerText = "Correct! Saving step progress...";
        
        // Save this specific step's score
        let stepScore = Math.max(1, 10 - figureErrorCount);
        await saveStepData(stepKey, stepScore);

        if (currentStep < 3) {
            currentStep++;
            figureErrorCount = 0; // Reset errors for the next step
            setTimeout(renderFigureUI, 1000);
        } else {
            // Final completion - update main FigureGrowth average
            feedback.innerText = "Pattern Mastered!";
            window.isCurrentQActive = false;
            setTimeout(loadNextQuestion, 1500);
        }
    } else {
        figureErrorCount++;
        feedback.className = "incorrect-box";
        feedback.innerText = "Try again! Check your growth rate.";
    }
}

async function saveStepData(column, errorCount) {
    // 1. Calculate how much 'XP' they earned this step
    // Perfect = 1.0 points, 1 error = 0.5 points, 2+ errors = 0.2 points
    let earnedXP = 0;
    if (errorCount === 0) earnedXP = 1.0;
    else if (errorCount === 1) earnedXP = 0.5;
    else earnedXP = 0.2;

    // 2. Get their current mastery (assuming Hub tracks this in a global object)
    // If not in window, we default to 0
    let currentMastery = window.userMastery?.[column] || 0;
    let newMastery = Math.min(10, currentMastery + earnedXP);

    // 3. Update the Hub's local record so the next step knows the new floor
    if (!window.userMastery) window.userMastery = {};
    window.userMastery[column] = newMastery;

    // 4. Update Supabase
    let updates = {};
    updates[column] = newMastery;
    // The main FigureGrowth column becomes the average of the sub-skills
    const avg = (
        (window.userMastery['FigureRule'] || 0) + 
        (window.userMastery['FigureDraw'] || 0) + 
        (window.userMastery['FigureX'] || 0)
    ) / 3;
    updates['FigureGrowth'] = parseFloat(avg.toFixed(1)); 

    const { error } = await window.supabaseClient
        .from('assignment')
        .update(updates)
        .eq('userName', window.currentUser);

    if (error) console.error("Update failed:", error.message);
    log(`Mastery Update: ${column} is now ${newMastery}/10 (+${earnedXP})`);
}
