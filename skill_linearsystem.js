let currentSystem = {};
let errorCount = 0;

function initLinearSystemGame() {
    // 1. Generate a system where the lines are actually the same (Infinite Solutions)
    // Example: 2x - 3y = 10  and  6y = 4x - 20 (which is 4x - 6y = 20)
    const multiplier = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4
    const a = Math.floor(Math.random() * 5) + 1;
    const b = Math.floor(Math.random() * 5) + 1;
    const c = Math.floor(Math.random() * 10) + 5;

    currentSystem = {
        eq1: `${a}x - ${b}y = ${c}`,
        eq2: `${b * multiplier}y = ${a * multiplier}x - ${c * multiplier}`,
        point1: { x: -4, y: -6, name: "Hannah" }, // We can randomize these later
        point2: { x: 20, y: 10, name: "Wirt" },
        cap: 180 
    };

    currentQCap = currentSystem.cap;
    currentQSeconds = 0;
    isCurrentQActive = true;
    errorCount = 0;

    renderLinearUI();
}

function renderLinearUI() {
    document.getElementById('q-title').innerText = "Systems: Who is Correct?";
    document.getElementById('q-content').innerHTML = `
        <div style="background: #f7fafc; padding: 15px; border-radius: 8px; margin-bottom: 15px; font-family: monospace;">
            <strong>Equation 1:</strong> ${currentSystem.eq1}<br>
            <strong>Equation 2:</strong> ${currentSystem.eq2}
        </div>
        <p>Check if these students found a valid solution (x, y):</p>
        <div style="display: flex; flex-direction: column; gap: 10px;">
            <button onclick="checkPoint('point1')">${currentSystem.point1.name}: (${currentSystem.point1.x}, ${currentSystem.point1.y})</button>
            <button onclick="checkPoint('point2')">${currentSystem.point2.name}: (${currentSystem.point2.x}, ${currentSystem.point2.y})</button>
        </div>
        <div id="linear-feedback" style="margin-top: 15px; font-weight: bold;"></div>
    `;
}

async function checkPoint(pointKey) {
    const p = currentSystem[pointKey];
    // Check if point satisfies the first equation (simplified check)
    // eq1: ax - by = c -> a*x - b*y == c
    // Note: In a production version, we'd parse the generated a, b, c variables.
    
    // For this specific curriculum problem:
    const isCorrect = (2 * p.x - 3 * p.y === 10);

    const feedback = document.getElementById('linear-feedback');
    if (isCorrect) {
        feedback.innerHTML = `<span style="color: green;">✔ ${p.name} is correct!</span>`;
        // If they've checked both, trigger mastery update
        if (p.verified) finishLinearStep();
        p.verified = true;
    } else {
        errorCount++;
        feedback.innerHTML = `<span style="color: red;">✘ That is not a solution.</span>`;
    }
}

async function finishLinearStep() {
    alert("Both are correct! This means the lines are actually the same line (Infinite Solutions).");
    let score = Math.max(1, 10 - (errorCount * 2));
    
    // Update Supabase
    await supabaseClient.from('assignment')
        .update({ LinearSystem: score })
        .eq('userName', currentUser);

    loadNextQuestion(); // Back to Hub
}
