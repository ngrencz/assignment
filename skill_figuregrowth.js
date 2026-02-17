{
    let currentPattern = {};
    let figureErrorCount = 0;
    let currentStep = 1; 
    let isVisualMode = false;
    let lastM = null; 

    window.initFigureGrowthGame = async function() {
        window.isCurrentQActive = true;
        window.currentQSeconds = 0;
        figureErrorCount = 0;
        currentStep = 1;
        isVisualMode = Math.random() > 0.5;

        let m;
        do { m = Math.floor(Math.random() * 13) + 3; } while (m === lastM);
        lastM = m;

        const b = Math.floor(Math.random() * 20) + 1; 
        const firstFig = Math.floor(Math.random() * 5) + 1; 
        const gap = Math.floor(Math.random() * 8) + 3; 
        const secondFig = firstFig + gap;
        
        // STEP 2: Now a numerical prediction up to 99
        const step2Fig = Math.floor(Math.random() * 90) + 10; 
        const step3Fig = Math.floor(Math.random() * 500) + 100;

        currentPattern = {
            m: m,
            b: b,
            f1Num: firstFig,
            f1Count: (m * firstFig) + b,
            f2Num: secondFig,
            f2Count: (m * secondFig) + b,
            fig2Num: step2Fig,
            fig2Count: (m * step2Fig) + b,
            targetX: step3Fig
        };

        renderFigureUI();
    };

   function generateTileHTML(count, m, b, figNum) {
        const isExpert = (window.userMastery?.['FigureGrowth'] || 0) >= 8;
        let html = `<div style="display: grid; grid-template-columns: repeat(5, 12px); gap: 1px; width: 65px; line-height: 0; margin: 0 auto;">`;
        for (let i = 0; i < count; i++) {
            let color = '#3b82f6'; 
            if (!isExpert && i < b) color = '#f97316';
            html += `<div style="width:12px; height:12px; background:${color}; border:0.5px solid white;"></div>`;
        }
        html += `</div>`;
        return html;
    }

  function renderFigureUI() {
    const qContent = document.getElementById('q-content');
    document.getElementById('q-title').innerText = `Figure Growth Analysis`;

    let headerHTML = "";
    if (isVisualMode && currentPattern.f2Count <= 30) { 
        headerHTML = `<div style="display:flex; justify-content:center; align-items:flex-end; gap:30px; margin-bottom:20px; background: white; padding: 15px; border-radius: 8px;">
                        <div style="text-align:center;"><small>Fig ${currentPattern.f1Num}</small>${generateTileHTML(currentPattern.f1Count, currentPattern.m, currentPattern.b, currentPattern.f1Num)}</div>
                        <div style="text-align:center;"><small>Fig ${currentPattern.f2Num}</small>${generateTileHTML(currentPattern.f2Count, currentPattern.m, currentPattern.b, currentPattern.f2Num)}</div>
                    </div>`;
    } else {
        headerHTML = `<div style="background:#f1f5f9; padding:15px; border-radius:12px; margin-bottom:20px; border: 1px solid #cbd5e1; text-align:center;">
                        <p><strong>Figure ${currentPattern.f1Num}:</strong> ${currentPattern.f1Count} tiles | <strong>Figure ${currentPattern.f2Num}:</strong> ${currentPattern.f2Count} tiles</p>
                    </div>`;
    }

    let ruleDisplay = (currentStep > 1) ? `
            <div style="background: #ecfdf5; border: 1px dashed #10b981; padding: 10px; border-radius: 8px; margin-bottom: 15px; text-align: center; color: #065f46;">
                <strong>Your Rule:</strong> y = ${currentPattern.m}x + ${currentPattern.b}
            </div>` : "";

    let stepHTML = "";
    if (currentStep === 1) {
        stepHTML = `<p><strong>Step 1:</strong> Find the rule (y = mx + b).</p>
            <div style="font-size: 1.5rem; text-align: center; margin: 20px 0;">
                y = <input type="number" id="input-m" placeholder="m" class="math-input" style="width:65px"> x + 
                <input type="number" id="input-b" placeholder="b" class="math-input" style="width:65px">
            </div>`;
    } else if (currentStep === 2) {
        stepHTML = ruleDisplay + `<p><strong>Step 2:</strong> Intermediate Prediction.</p>
            <p>How many tiles are in <strong>Figure ${currentPattern.fig2Num}</strong>?</p>
            <div style="font-size: 1.5rem; text-align: center; margin: 20px 0;">
                Tiles = <input type="number" id="input-step2" placeholder="?" class="math-input" style="width:100px">
            </div>`;
    } else {
        stepHTML = ruleDisplay + `<p><strong>Step 3:</strong> Large Scale Prediction.</p>
            <p>How many tiles will be in <strong>Figure ${currentPattern.targetX}</strong>?</p>
            <div style="font-size: 1.5rem; text-align: center; margin: 20px 0;">
                Tiles = <input type="number" id="input-ans" placeholder="?" class="math-input" style="width:100px">
            </div>`;
    }

    qContent.innerHTML = headerHTML + stepHTML + `
        <div style="text-align:center; margin-top:15px; display: flex; justify-content: center; gap: 10px;">
            <button onclick="checkFigureAns()" class="primary-btn">Submit Answer</button>
            <button onclick="showFigureHint()" class="secondary-btn" style="background: #64748b; color: white; border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer;">Get Hint</button>
        </div>
        <div id="hint-display" style="margin-top: 15px; padding: 10px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; display: none; font-size: 0.9rem; color: #92400e;"></div>`;
}

    window.showFigureHint = function() {
        const hintBox = document.getElementById('hint-display');
        hintBox.style.display = "block";
        let message = "";
        if (currentStep === 1) {
            message = `<strong>Growth (m):</strong> Increase in tiles / increase in steps. <br><strong>Start (b):</strong> Tiles at Figure 0.`;
        } else if (currentStep === 2) {
            message = `Use your rule: (${currentPattern.m} × ${currentPattern.fig2Num}) + ${currentPattern.b}`;
        } else {
            message = `Plug ${currentPattern.targetX} into your equation: (${currentPattern.m} × ${currentPattern.targetX}) + ${currentPattern.b}`;
        }
        hintBox.innerHTML = message;
    };
    
   window.checkFigureAns = async function() {
    let isCorrect = false;
    let stepKey = "";
    const feedback = document.getElementById('feedback-box');
    if (feedback) feedback.style.display = "block";

    if (currentStep === 1) {
        stepKey = "FigureRule";
        const uM = parseInt(document.getElementById('input-m').value);
        const uB = parseInt(document.getElementById('input-b').value);
        isCorrect = (uM === currentPattern.m && uB === currentPattern.b);
    } else if (currentStep === 2) {
        stepKey = "FigureDraw"; // Using your existing DB key
        const uAns = parseInt(document.getElementById('input-step2').value);
        isCorrect = (uAns === currentPattern.fig2Count);
    } else {
        stepKey = "FigureX";
        const uAns = parseInt(document.getElementById('input-ans').value);
        isCorrect = (uAns === (currentPattern.m * currentPattern.targetX) + currentPattern.b);
    }

    if (isCorrect) {
        feedback.className = "correct";
        feedback.innerText = "✅ Correct!";
        try { await saveStepData(stepKey, figureErrorCount); } catch (e) {}

        if (currentStep < 3) {
            currentStep++;
            figureErrorCount = 0;
            setTimeout(() => { feedback.style.display = "none"; renderFigureUI(); }, 1000);
        } else {
            window.isCurrentQActive = false; 
            feedback.innerText = "Pattern Mastered!";
            setTimeout(() => { 
                if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion();
                else loadNextQuestion();
            }, 1500);
        } 
    } else {
        figureErrorCount++;
        feedback.className = "incorrect";
        feedback.innerText = "Not quite!";
    }
};

    async function saveStepData(column, errorCount) {
        let adjustment = (errorCount === 0) ? 1 : (errorCount >= 3 ? -1 : 0);
        if (!window.userMastery) window.userMastery = {};
        let currentMastery = window.userMastery[column] || 0;
        let newMastery = Math.max(0, Math.min(10, currentMastery + adjustment));
        window.userMastery[column] = newMastery;

        const avg = ((window.userMastery['FigureRule'] || 0) + (window.userMastery['FigureDraw'] || 0) + (window.userMastery['FigureX'] || 0)) / 3;
        let updates = {};
        updates[column] = newMastery;
        updates['FigureGrowth'] = Math.round(avg); 

        return await window.supabaseClient.from('assignment').update(updates).eq('userName', window.currentUser);
    }
}
