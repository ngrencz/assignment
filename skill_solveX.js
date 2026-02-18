// Unique variables for this module
let currentEquations = [];
let problemsSolved = 0;
let problemsNeeded = 4;
let currentScore = 0;
let isFirstAttempt = true; // Tracks status of the current specific problem

async function initSolveXGame() {
    window.isCurrentQActive = true;
    window.currentQSeconds = 0;
    
    problemsSolved = 0;

    // 1. Get current score to determine difficulty
    try {
        if (window.supabaseClient && window.currentUser) {
            const { data } = await window.supabaseClient
                .from('assignment')
                .select('SolveX')
                .eq('userName', window.currentUser)
                .maybeSingle();
            
            currentScore = data ? (data.SolveX || 0) : 0;

            // Difficulty Setting
            if (currentScore >= 8) problemsNeeded = 3; 
            else if (currentScore >= 5) problemsNeeded = 4;
            else problemsNeeded = 5; // More practice for lower scores
        }
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
                a = (Math.floor(Math.random() * 20) + 10) / 10; // 1.1 to 3.0
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
    // RESET Attempt Tracker for the new problem
    isFirstAttempt = true;

    const titleEl = document.getElementById('q-title');
    if (titleEl) titleEl.innerText = `Algebra: Multi-Step Equations`;

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

    // HTML Structure with Feedback Box
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
            <div id="feedback-box" style="display:none; margin-top:20px; font-weight:bold; padding:10px; border-radius:8px;"></div>
        </div>
    `;
}

async function checkSolveX() {
    const userAns = parseFloat(document.getElementById('solve-ans').value);
    const correctAns = currentEquations[problemsSolved].ans;
    const feedback = document.getElementById('feedback-box');

    if (isNaN(userAns)) return;
    
    const successStyle = "background: #dcfce7; color: #166534; border: 1px solid #86efac;";
    const errorStyle = "background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;";
    const warningStyle = "background: #fef9c3; color: #854d0e; border: 1px solid #fde047;";

    // --- CHECK ANSWER ---
    if (Math.abs(userAns - correctAns) < 0.01) {
        // 1. Calculate Score Change
        let scoreChange = 0;
        let msg = "";

        if (isFirstAttempt) {
            scoreChange = 1;
            msg = "Correct! (+1 Skill)";
            feedback.style.cssText = `display:block; ${successStyle} margin-top:20px; padding:10px; border-radius:8px;`;
        } else {
            scoreChange = -1;
            msg = "Correct, but you needed help. (-1 Skill)";
            feedback.style.cssText = `display:block; ${warningStyle} margin-top:20px; padding:10px; border-radius:8px;`;
        }

        // 2. Update Local State
        let oldScore = currentScore;
        currentScore = Math.max(0, Math.min(10, currentScore + scoreChange));
        problemsSolved++;

        // 3. Update Database IMMEDIATELY
        if (typeof log === 'function') log(`SolveX: ${oldScore} -> ${currentScore} (Delta: ${scoreChange})`);

        if (window.supabaseClient && window.currentUser) {
            await window.supabaseClient
                .from('assignment')
                .update({ SolveX: currentScore })
                .eq('userName', window.currentUser);
        }

        feedback.innerText = msg;

        // 4. Decide Next Step
        if (problemsSolved >= problemsNeeded) {
            // STOP the timer immediately
            window.isCurrentQActive = false;

            // Update UI to show the set is finished
            document.getElementById('q-content').innerHTML = `
                <div style="text-align:center; padding:50px; animation: fadeIn 0.5s;">
                    <div style="font-size: 50px; margin-bottom: 20px;">✅</div>
                    <h2 style="color: var(--black);">Set Complete!</h2>
                    <p style="color: var(--gray-text);">Mastery Level: ${currentScore}/10</p>
                    <p style="font-size: 0.9rem; color: var(--kelly-green);">Loading next activity...</p>
                </div>
            `;

            // Wait 2 seconds so the student can see their progress, then load next
            setTimeout(() => { 
                if (typeof window.loadNextQuestion === 'function') {
                    window.loadNextQuestion(); 
                } else {
                    // Fallback if loadNextQuestion isn't defined
                    console.log("Session complete. No further questions found.");
                }
            }, 2000);

        } else {
            // Set not finished yet, move to the next individual problem
            setTimeout(renderSolveXUI, 1500);
        }
}
