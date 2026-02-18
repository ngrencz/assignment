/**
 * skill_solve_x.js
 * - Generates multi-step algebraic equations.
 * - Supports: ax + b = c, a(x + b) = c, and x/a + b = c.
 * - Adapts difficulty based on current mastery score.
 * - Updates 'SolveX' column in Supabase.
 */

var solveXData = {
    equations: [],
    currentIndex: 0,
    needed: 5,
    score: 0,
    isFirstAttempt: true
};

window.initSolveXGame = async function() {
    if (!document.getElementById('q-content')) return;

    // Reset State
    solveXData.currentIndex = 0;
    solveXData.isFirstAttempt = true;
    solveXData.equations = [];

    // Initialize Mastery
    if (!window.userMastery) window.userMastery = {};

    // 1. Sync initial score & Determine Difficulty
    try {
        if (window.supabaseClient && window.currentUser) {
            const h = sessionStorage.getItem('target_hour') || "00";
            const { data } = await window.supabaseClient
                .from('assignment')
                .select('SolveX')
                .eq('userName', window.currentUser)
                .eq('hour', h)
                .maybeSingle();
            
            solveXData.score = data ? (data.SolveX || 0) : 0;
            window.userMastery.SolveX = solveXData.score;
        }
    } catch (e) { console.log("Sync error", e); }

    // Difficulty Logic: Higher score = fewer reps needed to maintain
    if (solveXData.score >= 8) solveXData.needed = 3; 
    else if (solveXData.score >= 5) solveXData.needed = 4;
    else solveXData.needed = 5;

    generateXEquations();
    renderSolveXUI();
};

function generateXEquations() {
    solveXData.equations = [];
    
    for (let i = 0; i < solveXData.needed; i++) {
        // High Mastery (6+) includes Decimals
        let useAdvanced = (solveXData.score >= 6);
        let type = Math.floor(Math.random() * 3); 

        if (type === 0) { 
            // Type: ax + b = c
            let a, b, ans;
            if (useAdvanced && Math.random() > 0.5) {
                // Decimal Variation
                a = (Math.floor(Math.random() * 20) + 10) / 10; // 1.1 to 3.0
                ans = Math.floor(Math.random() * 10) + 1;
                b = (Math.floor(Math.random() * 50) + 10) / 10; 
                let c = parseFloat(((a * ans) + b).toFixed(2));
                solveXData.equations.push({ 
                    html: `${a}x + ${b} = ${c}`, 
                    ans: ans, 
                    type: 'standard' 
                });
            } else {
                // Integer Variation
                a = Math.floor(Math.random() * 8) + 2;
                ans = Math.floor(Math.random() * 12) - 4; // Allow negative answers
                b = Math.floor(Math.random() * 15) + 1;
                let c = (a * ans) + b;
                solveXData.equations.push({ 
                    html: `${a}x + ${b} = ${c}`, 
                    ans: ans, 
                    type: 'standard' 
                });
            }
        } 
        else if (type === 1) { 
            // Type: a(x + b) = c
            let a = Math.floor(Math.random() * 5) + 2;
            let ans = Math.floor(Math.random() * 10);
            let b = Math.floor(Math.random() * 6) + 1;
            let c = a * (ans + b);
            solveXData.equations.push({ 
                html: `${a}(x + ${b}) = ${c}`, 
                ans: ans, 
                type: 'standard' 
            });
        } 
        else { 
            // Type: x/a + b = c (Fraction)
            let a = Math.floor(Math.random() * 4) + 2; // Denominator
            let ans = Math.floor(Math.random() * 8) + 1;
            let b = Math.floor(Math.random() * 10) + 1;
            let x = a * ans; // Ensure x is an integer
            let c = (x / a) + b;

            solveXData.equations.push({ 
                type: 'fraction',
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
    const qContent = document.getElementById('q-content');
    if (!qContent) return;

    // Reset attempt for new problem
    solveXData.isFirstAttempt = true;

    if(solveXData.currentIndex >= solveXData.equations.length) {
        finishSolveXGame();
        return;
    }

    let eq = solveXData.equations[solveXData.currentIndex];
    let displayHtml = "";

    if (eq.type === 'fraction') {
        // Flexbox fraction layout
        displayHtml = `
            <div class="eq-container">
                <div class="fraction">
                    <div class="numer">${eq.num}</div>
                    <div class="denom">${eq.den}</div>
                </div>
                <div class="rest">+ ${eq.constant} = ${eq.result}</div>
            </div>`;
    } else {
        displayHtml = `<div class="eq-container text-eq">${eq.html}</div>`;
    }

    qContent.innerHTML = `
        <div style="max-width:500px; margin:0 auto;">
            <div style="text-align:center; color:#64748b; margin-bottom:10px;">
                Problem ${solveXData.currentIndex + 1} of ${solveXData.needed}
            </div>
            
            <div class="card">
                ${displayHtml}
            </div>

            <div style="margin-top:20px; text-align:center;">
                <div style="display:inline-flex; align-items:center; gap:10px;">
                    <span style="font-size:24px; font-weight:bold; color:#334155;">x =</span>
                    <input type="number" id="inp-solve" class="solve-input" step="any" placeholder="?">
                    <button onclick="handleSolveSubmit()" class="solve-btn">Check</button>
                </div>
                <div id="solve-feedback" style="margin-top:15px; height:24px; font-weight:bold;"></div>
            </div>
        </div>
    `;

    // Focus input
    setTimeout(() => {
        const inp = document.getElementById('inp-solve');
        if(inp) inp.focus();
    }, 100);
}

window.handleSolveSubmit = async function() {
    const inp = document.getElementById('inp-solve');
    const feedback = document.getElementById('solve-feedback');
    if (!inp) return;

    const userAns = parseFloat(inp.value);
    const correctAns = solveXData.equations[solveXData.currentIndex].ans;

    if (isNaN(userAns)) {
        feedback.innerText = "Please enter a number.";
        feedback.style.color = "#ef4444";
        return;
    }

    // Check Answer (allow tiny float margin)
    if (Math.abs(userAns - correctAns) < 0.01) {
        // Correct
        feedback.innerText = solveXData.isFirstAttempt ? "Correct!" : "Correct (Second Try)";
        feedback.style.color = "#16a34a";
        inp.disabled = true;

        // Calculate Score Change
        let change = solveXData.isFirstAttempt ? 1 : -1; 
        // Note: -1 if they missed it first, effectively canceling previous progress or punishing guessing
        
        await updateSolveXScore(change);

        solveXData.currentIndex++;
        
        setTimeout(() => {
            renderSolveXUI();
        }, 1200);

    } else {
        // Incorrect
        solveXData.isFirstAttempt = false;
        feedback.innerText = "Not quite. Try again.";
        feedback.style.color = "#ef4444";
        inp.value = "";
        inp.focus();
    }
};

async function updateSolveXScore(amount) {
    let current = solveXData.score;
    let next = Math.max(0, Math.min(10, current + amount));
    
    solveXData.score = next;
    window.userMastery.SolveX = next;

    if (window.supabaseClient && window.currentUser) {
        try {
            const h = sessionStorage.getItem('target_hour') || "00";
            await window.supabaseClient.from('assignment')
                .update({ SolveX: next })
                .eq('userName', window.currentUser)
                .eq('hour', h);
        } catch(e) { console.error(e); }
    }
}

function finishSolveXGame() {
    const qContent = document.getElementById('q-content');
    qContent.innerHTML = `
        <div style="text-align:center; padding:50px; animation: fadeIn 0.5s;">
            <div style="font-size: 50px; margin-bottom: 20px;">✅</div>
            <h2 style="color: #1e293b;">Set Complete!</h2>
            <p style="color: #64748b;">Mastery Level: ${solveXData.score}/10</p>
            <p style="font-size: 0.9rem; color: #16a34a; margin-top:15px;">Loading next activity...</p>
        </div>
    `;
    setTimeout(() => { 
        if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion(); 
    }, 2000);
}

// CSS Injection
const solveStyle = document.createElement('style');
solveStyle.innerHTML = `
    .card { background:white; padding:40px 20px; border-radius:12px; border:1px solid #e2e8f0; box-shadow:0 2px 4px rgba(0,0,0,0.05); display:flex; justify-content:center; }
    .eq-container { display:flex; align-items:center; font-size:32px; font-family:monospace; color:#1e293b; }
    .fraction { display:inline-flex; flex-direction:column; align-items:center; margin-right:10px; vertical-align:middle; }
    .numer { border-bottom:2px solid #1e293b; padding:0 5px; text-align:center; width:100%; }
    .denom { padding:0 5px; text-align:center; width:100%; }
    .text-eq { letter-spacing:1px; }
    .solve-input { width:100px; padding:10px; font-size:20px; border:2px solid #cbd5e1; border-radius:8px; text-align:center; outline:none; transition:0.2s; }
    .solve-input:focus { border-color:#3b82f6; }
    .solve-btn { padding:10px 20px; background:#0f172a; color:white; border:none; border-radius:8px; font-size:16px; cursor:pointer; font-weight:bold; }
    .solve-btn:hover { background:#1e293b; }
`;
document.head.appendChild(solveStyle);
