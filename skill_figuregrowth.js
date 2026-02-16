let currentPattern = {};
let figureErrorCount = 0;
let currentSubSkill = ""; // FigureRule, FigureDraw, or FigureX

function initFigureGrowthGame() {
    isCurrentQActive = true;
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
        targetX: Math.floor(Math.random() * 50) + 10 // For FigureX questions
    };

    // 2. Randomly pick which sub-skill to test
    const subSkills = ['FigureRule', 'FigureDraw', 'FigureX'];
    currentSubSkill = subSkills[Math.floor(Math.random() * subSkills.length)];

    renderFigureUI();
}

function renderFigureUI() {
    document.getElementById('q-title').innerText = "Tile Pattern Growth";
    let content = `
        <div style="background:#f7fafc; padding:15px; border-radius:8px; margin-bottom:15px;">
            <p><strong>Figure 2</strong> of a tile pattern has <strong>${currentPattern.fig2Count}</strong> tiles.</p>
            <p><strong>Figure 6</strong> of the same pattern has <strong>${currentPattern.fig6Count}</strong> tiles.</p>
        </div>
    `;

    if (currentSubSkill === 'FigureRule') {
        content += `
            <p>Find the rule for the pattern (y = mx + b):</p>
            y = <input type="number" id="input-m" placeholder="m" style="width:50px"> x + 
            <input type="number" id="input-b" placeholder="b" style="width:50px">
        `;
    } else if (currentSubSkill === 'FigureX') {
        content += `
            <p>Based on the growth, how many tiles will be in <strong>Figure ${currentPattern.targetX}</strong>?</p>
            <input type="number" id="input-ans" placeholder="Total tiles">
        `;
    } else { // FigureDraw
        content += `
            <p>Sketch Figure 3 on your paper. How many tiles should it have?</p>
            <input type="number" id="input-ans" placeholder="Number of tiles in Fig 3">
        `;
    }

    content += `<br><button onclick="checkFigureAns()" style="margin-top:15px; background:#38a169; color:white; padding:10px 20px; border:none; border-radius:5px; cursor:pointer;">Submit Answer</button>`;
    document.getElementById('q-content').innerHTML = content;
}

async function checkFigureAns() {
    let isCorrect = false;

    if (currentSubSkill === 'FigureRule') {
        const userM = parseInt(document.getElementById('input-m').value);
        const userB = parseInt(document.getElementById('input-b').value);
        isCorrect = (userM === currentPattern.m && userB === currentPattern.b);
    } else if (currentSubSkill === 'FigureX') {
        const userAns = parseInt(document.getElementById('input-ans').value);
        const correctAns = (currentPattern.m * currentPattern.targetX) + currentPattern.b;
        isCorrect = (userAns === correctAns);
    } else { // FigureDraw / Fig 3 count
        const userAns = parseInt(document.getElementById('input-ans').value);
        const correctAns = (currentPattern.m * 3) + currentPattern.b;
        isCorrect = (userAns === correctAns);
    }

    if (isCorrect) {
        let score = Math.max(1, 10 - (figureErrorCount * 2));
        await updateFigureMastery(score);
        alert("Excellent! You found the pattern.");
        loadNextQuestion();
    } else {
        figureErrorCount++;
        alert("Not quite. Check the difference between Figure 2 and Figure 6 to find the growth rate!");
    }
}

async function updateFigureMastery(score) {
    const { data } = await supabaseClient.from('assignment').select('*').eq('userName', currentUser).single();
    
    let updates = {};
    updates[currentSubSkill] = score;

    // Calculate Aggregate FigureGrowth
    const subColumns = ['FigureRule', 'FigureDraw', 'FigureX'];
    let total = score;
    let count = 1;
    subColumns.forEach(col => {
        if (col !== currentSubSkill && data[col] !== null) {
            total += data[col];
            count++;
        }
    });
    updates['FigureGrowth'] = Math.round(total / count);

    await supabaseClient.from('assignment').update(updates).eq('userName', currentUser);
}
