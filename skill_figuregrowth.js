// Unique variables for this module (keep 'let')
let currentPattern = {};
let figureErrorCount = 0;
let currentSubSkill = ""; // FigureRule, FigureDraw, or FigureX

function initFigureGrowthGame() {
    isCurrentQActive = true;
    
    // NO 'let' here - these belong to the Hub
    currentQSeconds = 0;
    currentQCap = 180; 
    
    figureErrorCount = 0;

    // 1. Generate a random linear pattern: y = mx + b
    const growthRate = Math.floor(Math.random() * 3) + 2; // m = 2, 3, or 4
    const startingTiles = Math.floor(Math.random() * 5) + 1; // b = 1 to 5
    
    currentPattern = {
        m: growthRate,
        b: startingTiles,
        fig2Count: (growthRate * 2) + startingTiles,
        fig6Count: (growthRate * 6) + startingTiles,
        targetX: Math.floor(Math.random() * 50) + 10 
    };

    // 2. Pick sub-skill
    const subSkills = ['FigureRule', 'FigureDraw', 'FigureX'];
    currentSubSkill = subSkills[Math.floor(Math.random() * subSkills.length)];

    renderFigureUI();
}

function renderFigureUI() {
    document.getElementById('q-title').innerText = "Tile Pattern Growth";
    
    let content = `
        <div style="background: var(--gray-light); padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid var(--gray-med); text-align: center;">
            <p style="margin: 0 0 10px 0; font-size: 1.1rem;"><strong>Figure 2</strong> has <span class="accent-text" style="font-weight:bold;">${currentPattern.fig2Count}</span> tiles.</p>
            <p style="margin: 0; font-size: 1.1rem;"><strong>Figure 6</strong> has <span class="accent-text" style="font-weight:bold;">${currentPattern.fig6Count}</span> tiles.</p>
        </div>
    `;

    

    if (currentSubSkill === 'FigureRule') {
        content += `
            <p>Find the rule for the pattern:</p>
            <div style="font-size: 1.5rem; font-weight: bold; text-align: center; margin: 20px 0;">
                y = <input type="number" id="input-m" placeholder="m" class="math-input" style="width:80px"> x + 
                <input type="number" id="input-b" placeholder="b" class="math-input" style="width:80px">
            </div>
        `;
    } else if (currentSubSkill === 'FigureX') {
        content += `
            <p>Based on the growth, how many tiles will be in <strong>Figure ${currentPattern.targetX}</strong>?</p>
            <div style="text-align: center; margin: 20px 0;">
                <input type="number" id="input-ans" placeholder="Total tiles" class="math-input" style="width: 180px;">
            </div>
        `;
    } else { // Figure 3 count
        content += `
            <p>Sketch <strong>Figure 3</strong> on your paper. How many tiles should it have in total?</p>
            <div style="text-align: center; margin: 20px 0;">
                <input type="number" id="input-ans" placeholder="Tiles in Fig 3" class="math-input" style="width: 180px;">
            </div>
        `;
    }

    content += `<div style="text-align:center;"><button onclick="checkFigureAns()" class="primary-btn">Submit Answer</button></div>`;
    document.getElementById('q-content').innerHTML = content;
}

async function checkFigureAns() {
    let isCorrect = false;
    const feedback = document.getElementById('feedback-box');
    feedback.style.display = "block";

    if (currentSubSkill === 'FigureRule') {
        const userM = parseInt(document.getElementById('input-m').value);
        const userB = parseInt(document.getElementById('input-b').value);
        isCorrect = (userM === currentPattern.m && userB === currentPattern.b);
    } else if (currentSubSkill === 'FigureX') {
        const userAns = parseInt(document.getElementById('input-ans').value);
        const correctAns = (currentPattern.m * currentPattern.targetX) + currentPattern.b;
        isCorrect = (userAns === correctAns);
    } else { // Figure 3 count
        const userAns = parseInt(document.getElementById('input-ans').value);
        const correctAns = (currentPattern.m * 3) + currentPattern.b;
        isCorrect = (userAns === correctAns);
    }

    if (isCorrect) {
        feedback.className = "correct";
        feedback.innerText = "Excellent! You found the pattern.";
        
        let score = Math.max(1, 10 - (figureErrorCount * 2));
        await updateFigureMastery(score);
        
        setTimeout(loadNextQuestion, 1500);
    } else {
        figureErrorCount++;
        feedback.className = "incorrect";
        feedback.innerHTML = `
            <span>Not quite.</span><br>
            <small>Hint: The tiles increased by <strong>${currentPattern.fig6Count - currentPattern.fig2Count}</strong> over 4 figures (6 minus 2). Divide to find the growth rate (m)!</small>
        `;
    }
}

async function updateFigureMastery(score) {
    // Simplified update to trigger Hub logic
    let updates = {};
    updates[currentSubSkill] = score;
    updates['FigureGrowth'] = score; 

    await supabaseClient.from('assignment').update(updates).eq('userName', currentUser);
}
