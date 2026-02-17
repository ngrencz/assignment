// Unique variables for this module
let currentEquations = [];
let solveXErrorCount = 0;
let problemsSolved = 0;
let problemsNeeded = 4;
let currentScore = 0;

async function initSolveXGame() {
    window.isCurrentQActive = true;
    window.currentQSeconds = 0;
    
    solveXErrorCount = 0;
    problemsSolved = 0;

    // 1. Determine difficulty scaling
    try {
        const { data } = await window.supabaseClient
            .from('assignment')
            .select('SolveX')
            .eq('userName', window.currentUser)
            .maybeSingle();
        
        currentScore = data ? (data.SolveX || 0) : 0;

        if (currentScore >= 8) problemsNeeded = 2; // Harder but fewer
        else if (currentScore >= 5) problemsNeeded = 3;
        else problemsNeeded = 4;
    } catch (e) {
        currentScore = 0;
        problemsNeeded = 3;
    }

    generateEquations();
    renderSolveXUI();
}

function generateEquations() {
    currentEquations = [];
    
    for (let i = 0; i < problemsNeeded; i++) {
        // High Mastery (6+) includes Decimals and Fractions
        let useAdvancedNumbers = (currentScore >= 6);
        let type = Math.floor(Math.random() * 3); 

        if (type === 0) { 
            // Type: ax + b = c
            let a, b, ans;
            if (useAdvancedNumbers && Math.random() > 0.5) {
                // Decimal Variation
                a = (Math.floor(Math.random() * 20) + 10) / 10; // 1.0 to 3.0
                ans = Math.floor(Math.random() * 10) + 1;
                b = (Math.floor(Math.random() * 50) + 10) / 10; // 1.0 to 6.0
                let c = parseFloat(((a * ans) + b).toFixed(2));
                currentEquations.push({ text: `${a}x + ${b} = ${c}`, ans: ans, displayType: 'text' });
            } else {
                // Standard Integer
                a = Math.floor(Math.random() * 8) + 2;
                ans = Math.floor(Math.random() * 12) - 4;
                b = Math.floor(Math.random() * 15) + 1;
                let c = (a * ans) + b;
                currentEquations.push({ text: `${a}x + ${b} = ${c}`, ans: ans, displayType: 'text' });
            }
        } 
        else if (type === 1) { 
            // Type: a(x + b) = c
            let a = Math.floor(Math.random() * 5) + 2;
            let ans = Math.floor(Math.random() * 10);
            let b = Math.floor(Math.random() * 6) + 1;
            let c = a * (ans + b);
            currentEquations.push({ text: `${a}(x + ${b}) = ${c}`, ans: ans, displayType: 'text' });
        } 
        else { 
            // Type: x/a + b = c (The Fraction Type)
            let a = Math.floor(Math.random() * 4) + 2; // Denominator
            let ans = Math.floor(Math.random() * 8) + 1;
            let b = Math.floor(Math.random() * 10) + 1;
            let x = a * ans; // Ensure x is an integer for the user to find
            let c = (x / a) + b;

            currentEquations.push({ 
                displayType: 'fraction',
                num: 'x', 
                den: a, 
                constant: b, 
                result: c, 
                ans: x 
            });
        }
    }
}

function renderSolveXUI() {
    document.getElementById('q-title').innerText = `Algebra: Multi-Step Equations`;
    let eq = currentEquations[problemsSolved];
    let displayHtml = "";

    if (eq.displayType === 'fraction') {
        displayHtml = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 2.5rem;">
                <div style="text-align: center;">
                    <div style="border-bottom: 3px solid var(--black); padding: 0 10px;">${eq.num}</div>
                    <div>${eq.den}</div>
                </div>
                <span>+ ${eq.constant} = ${eq.result}</span>
            </div>`;
    } else {
        displayHtml = `<div style="font-size: 2.5rem; letter-spacing: 2px;">${eq.text}</div>`;
    }

    document.getElementById('q-content').innerHTML = `
        <div class="card" style="padding: 50px; text-align: center; margin-bottom: 25px;">
            ${displayHtml}
        </div>
        <div style="text-align: center;">
            <p style="color: var(--gray-text); margin-bottom: 15px;">Problem ${problemsSolved + 1} of ${problemsNeeded}</p>
            <div style="display: flex; justify-content: center; gap: 15px; align-items: center;">
                <span style="font-size: 2rem; font-weight: bold;">x =</span>
                <input type="number" id="solve-ans" class="math-input" step="any" placeholder="?" style="width: 120px; font-size: 1.5rem; padding: 10px;">
                <button onclick="checkSolveX()" class="primary-btn">Submit Answer</button>
            </div>
        </div>
    `;
    document.getElementById('feedback-box').style.display = 'none';
}

async function checkSolveX() {
    const userAns = parseFloat(document.getElementById('solve-ans').value);
    const correctAns = currentEquations[problemsSolved].ans;
    const feedback = document.getElementById('feedback-box');

    // 1. Validation: Don't do anything if input is empty
    if (isNaN(userAns)) return;
    feedback.style.display = "block";

    // 2. Accuracy Check: Using your 0.01 tolerance for decimals
    if (Math.abs(userAns - correctAns) < 0.01) {
        problemsSolved++;
        feedback.className = "correct";
        feedback.innerText = "Correct! Excellent work.";

        // 3. Check if the SET is finished
        if (problemsSolved >= problemsNeeded) {
            window.isCurrentQActive = false; // Stop timer immediately

            // 4. Meaningful Growth Logic (The XP System)
            // Perfect set = 1.2 pts, 1-2 errors = 0.6 pts, 3+ errors = 0.2 pts
            let earnedXP = 0;
            if (solveXErrorCount === 0) earnedXP = 1.2;
            else if (solveXErrorCount <= 2) earnedXP = 0.6;
            else earnedXP = 0.2;

            // currentScore was defined at the top of your script during init
            let newScore = Math.min(10, currentScore + earnedXP);
            
            // Log to your Dev Panel so you can see the math happening
            if (typeof log === 'function') {
                log(`Algebra XP: ${currentScore} + ${earnedXP} = ${newScore.toFixed(1)}`);
            }

            // 5. Save to Supabase
            await window.supabaseClient
                .from('assignment')
                .update({ SolveX: parseFloat(newScore.toFixed(1)) })
                .eq('userName', window.currentUser);
            
            feedback.innerText = `Set Complete! Mastery: ${newScore.toFixed(1)}/10`;
            
            // 6. Transition back to the Hub
            setTimeout(() => { loadNextQuestion(); }, 1500);
        } else {
            // Not finished with the set yet? Load the next equation
            setTimeout(renderSolveXUI, 1200);
        }
    } else {
        // 7. Error Handling
        solveXErrorCount++;
        feedback.className = "incorrect";
        feedback.innerText = "Check your calculations. Remember to apply the same operation to both sides!";
    }
}
