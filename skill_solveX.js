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

    if (isNaN(userAns)) return;
    feedback.style.display = "block";

    if (Math.abs(userAns - correctAns) < 0.01) {
        problemsSolved++;
        feedback.className = "correct";
        feedback.innerText = "Correct! Excellent work.";

        // --- SECTION A: THE SET IS FINISHED ---
        if (problemsSolved >= problemsNeeded) {
            window.isCurrentQActive = false; // Stop timer

            let adjustment = 0;
            if (solveXErrorCount === 0) {
                adjustment = 1;  
            } else if (solveXErrorCount >= 3) {
                adjustment = -1; 
            } else {
                adjustment = 0;  
            }

            let newScore = Math.max(0, Math.min(10, currentScore + adjustment));
            
            if (typeof log === 'function') {
                log(`SolveX Balance: ${currentScore} -> ${newScore} (Adj: ${adjustment})`);
            }

            await window.supabaseClient
                .from('assignment')
                .update({ SolveX: newScore })
                .eq('userName', window.currentUser);
            
            feedback.innerText = adjustment > 0 ? "Mastery Increasing!" : (adjustment < 0 ? "Keep practicing!" : "Set Complete.");
            
            // Go back to the Hub for a new skill
            setTimeout(() => { loadNextQuestion(); }, 1500);

        } else {
            // --- SECTION B: THE SET IS NOT FINISHED ---
            // Just load the next equation in this same module
            setTimeout(renderSolveXUI, 1200);
        }

    } else {
        // --- SECTION C: WRONG ANSWER ---
        solveXErrorCount++;
        feedback.className = "incorrect";
        feedback.innerText = "Check your calculations. Remember to apply the same operation to both sides!";
    }
}
