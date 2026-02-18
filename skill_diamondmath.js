/**
 * skill_diamondmath.js
 * - Solves Diamond Problems (X Puzzles).
 * - Covers ALL missing variable combinations.
 * - Supports Integers, Negatives, Decimals, and Fractions.
 * - Order independent checking for factoring cases.
 */

var diamondData = {
    A: 0,            // Left Factor
    B: 0,            // Right Factor
    top: 0,          // Product
    bottom: 0,       // Sum
    missing: [],     // Array of keys ['A', 'B', 'top', 'bottom'] that are hidden
    level: 0        
};

var diamondRound = 1;
var totalDiamondRounds = 4;

window.initDiamondMath = async function() {
    if (!document.getElementById('q-content')) return;

    window.isCurrentQActive = true;
    window.currentQSeconds = 0;
    diamondRound = 1;

    // Initialize Mastery State
    if (!window.userMastery) window.userMastery = {};

    try {
        if (window.supabaseClient && window.currentUser) {
            const currentHour = sessionStorage.getItem('target_hour');
            const { data } = await window.supabaseClient
                .from('assignment')
                .select('DiamondMath')
                .eq('userName', window.currentUser)
                .eq('hour', currentHour)
                .maybeSingle();
            
            window.userMastery.DiamondMath = data?.DiamondMath || 0;
        }
    } catch (e) { 
        console.log("Supabase sync error, using local state"); 
    }
    
    startDiamondRound();
};

function startDiamondRound() {
    generateDiamondProblem();
    renderDiamondUI();
}

function generateDiamondProblem() {
    const lvl = window.userMastery.DiamondMath || 0;
    diamondData.level = lvl;
    
    let a, b;

    // --- GENERATION (Difficulty tiers based on Mastery) ---
    if (lvl < 4) {
        // Positive Ints
        a = Math.floor(Math.random() * 12) + 1;
        b = Math.floor(Math.random() * 12) + 1;
    } else if (lvl < 7) {
        // Negatives allowed
        a = Math.floor(Math.random() * 25) - 12; 
        b = Math.floor(Math.random() * 25) - 12;
        if (a === 0) a = 1; if (b === 0) b = -1;
    } else if (lvl < 9) {
        // Decimals
        a = (Math.floor(Math.random() * 40) - 20) / 2; 
        b = (Math.floor(Math.random() * 40) - 20) / 2;
    } else {
        // Fractions (0.25, 0.5 steps)
        const denoms = [2, 4];
        a = (Math.floor(Math.random() * 20) - 10) / denoms[Math.floor(Math.random()*2)];
        b = (Math.floor(Math.random() * 20) - 10) / denoms[Math.floor(Math.random()*2)];
        if(a===0) a=0.5; if(b===0) b=-0.5;
    }

    diamondData.A = a;
    diamondData.B = b;
    diamondData.top = a * b;    
    diamondData.bottom = a + b; 

    // --- HIDING LOGIC (Covers ALL combos) ---
    const r = Math.random();
    
    if (r < 0.25) {
        // Case 1: Given Sides -> Find Top/Bottom (Easy)
        diamondData.missing = ['top', 'bottom'];
    } 
    else if (r < 0.50) {
        // Case 2: Given Top/Bottom -> Find Sides (Factoring)
        diamondData.missing = ['A', 'B'];
    } 
    else if (r < 0.75) {
        // Case 3: Given Sum (Bottom) & One Side -> Find Product & Other Side
        const sideToHide = Math.random() > 0.5 ? 'A' : 'B';
        diamondData.missing = ['top', sideToHide];
    } 
    else {
        // Case 4: Given Product (Top) & One Side -> Find Sum & Other Side
        const sideToHide = Math.random() > 0.5 ? 'A' : 'B';
        diamondData.missing = ['bottom', sideToHide];
    }
}

function renderDiamondUI() {
    const qContent = document.getElementById('q-content');
    if (!qContent) return;

    // Helper to decide if we show Input or Text
    const renderField = (key, val) => {
        if (diamondData.missing.includes(key)) {
            return `<input type="text" id="ans-${key}" placeholder="?" autocomplete="off" 
                    style="width:60px; height:40px; text-align:center; font-size:18px; border:2px solid #3b82f6; border-radius:8px; outline:none; background:white;">`;
        }
        // Format display value to avoid long decimals
        let displayVal = Number.isInteger(val) ? val : parseFloat(val.toFixed(2));
        return `<span style="font-size:24px; font-weight:bold; color:#1e293b;">${displayVal}</span>`;
    };

    document.getElementById('q-title').innerText = `Diamond Problems (Round ${diamondRound}/${totalDiamondRounds})`;

    qContent.innerHTML = `
        <div style="display: flex; gap: 40px; flex-wrap: wrap; justify-content:center; align-items:flex-start;">
            
            <div style="position:relative; width:300px; height:300px;">
                <svg width="300" height="300" style="position:absolute; top:0; left:0; z-index:0;">
                    <line x1="50" y1="50" x2="250" y2="250" stroke="#cbd5e1" stroke-width="6" stroke-linecap="round" />
                    <line x1="250" y1="50" x2="50" y2="250" stroke="#cbd5e1" stroke-width="6" stroke-linecap="round" />
                    <rect x="148" y="2" width="4" height="296" fill="none" /> 
                </svg>

                <div style="position:absolute; top:10px; left:50%; transform:translateX(-50%); width:80px; text-align:center;">
                    ${renderField('top', diamondData.top)}
                </div>

                <div style="position:absolute; bottom:10px; left:50%; transform:translateX(-50%); width:80px; text-align:center;">
                    ${renderField('bottom', diamondData.bottom)}
                </div>

                <div style="position:absolute; top:50%; left:10px; transform:translateY(-50%); width:80px; text-align:center;">
                    ${renderField('A', diamondData.A)}
                </div>

                <div style="position:absolute; top:50%; right:10px; transform:translateY(-50%); width:80px; text-align:center;">
                    ${renderField('B', diamondData.B)}
                </div>
            </div>

            <div style="flex:1; min-width:220px; max-width:300px; background:#f8fafc; padding:20px; border-radius:12px; border:1px solid #e2e8f0;">
                <h3 style="margin-top:0; color:#475569; font-size:14px; text-transform:uppercase; letter-spacing:1px;">Pattern Key</h3>
                <div style="display:flex; justify-content:center; margin-bottom:15px;">
                     <div style="position:relative; width:100px; height:100px;">
                        <svg width="100" height="100" style="position:absolute;">
                            <line x1="10" y1="10" x2="90" y2="90" stroke="#94a3b8" stroke-width="3" />
                            <line x1="90" y1="10" x2="10" y2="90" stroke="#94a3b8" stroke-width="3" />
                        </svg>
                        <div style="position:absolute; top:-5px; width:100%; text-align:center; font-size:11px; font-weight:bold; color:#ef4444;">PRODUCT (xy)</div>
                        <div style="position:absolute; bottom:-5px; width:100%; text-align:center; font-size:11px; font-weight:bold; color:#3b82f6;">SUM (x+y)</div>
                        <div style="position:absolute; top:42px; left:-10px; font-size:11px; font-weight:bold; color:#64748b;">x</div>
                        <div style="position:absolute; top:42px; right:-10px; font-size:11px; font-weight:bold; color:#64748b;">y</div>
                     </div>
                </div>
                <button onclick="checkDiamondWin()" style="width:100%; margin-top:10px; height:45px; background:#1e293b; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">CHECK ANSWER</button>
            </div>
        </div>
        <div id="flash-overlay" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(0,0,0,0.8); color:white; padding:20px 40px; border-radius:12px; font-size:24px; font-weight:bold; display:none; pointer-events:none; text-align:center; z-index:100;"></div>
    `;
}

function parseMathInput(str) {
    if (!str) return NaN;
    str = str.trim();
    if (str.includes('/')) {
        const parts = str.split('/');
        return parts.length === 2 ? parseFloat(parts[0]) / parseFloat(parts[1]) : NaN;
    }
    return parseFloat(str);
}

window.checkDiamondWin = async function() {
    let allCorrect = true;
    const inputs = {}; // Store user inputs for cross-check

    // 1. Gather Inputs
    diamondData.missing.forEach(key => {
        const el = document.getElementById(`ans-${key}`);
        if(el) inputs[key] = { el: el, val: parseMathInput(el.value) };
    });

    // 2. Validation Logic
    // Special Case: If BOTH sides are missing (Factoring), order doesn't matter.
    if (diamondData.missing.includes('A') && diamondData.missing.includes('B')) {
        const valA = inputs['A'].val;
        const valB = inputs['B'].val;
        
        // Check if they multiply to Top AND add to Bottom
        // Tolerance 0.05
        const prod = valA * valB;
        const sum = valA + valB;
        
        const prodOK = Math.abs(prod - diamondData.top) < 0.05;
        const sumOK = Math.abs(sum - diamondData.bottom) < 0.05;

        if (prodOK && sumOK) {
            inputs['A'].el.style.backgroundColor = "#dcfce7"; inputs['A'].el.style.borderColor = "#22c55e";
            inputs['B'].el.style.backgroundColor = "#dcfce7"; inputs['B'].el.style.borderColor = "#22c55e";
        } else {
            allCorrect = false;
            inputs['A'].el.style.backgroundColor = "#fee2e2"; inputs['A'].el.style.borderColor = "#ef4444";
            inputs['B'].el.style.backgroundColor = "#fee2e2"; inputs['B'].el.style.borderColor = "#ef4444";
        }
    } 
    else {
        // Standard strict check for other cases
        for (let key in inputs) {
            let target = diamondData[key];
            let userVal = inputs[key].val;
            
            if (isNaN(userVal) || Math.abs(userVal - target) > 0.05) {
                allCorrect = false;
                inputs[key].el.style.backgroundColor = "#fee2e2";
                inputs[key].el.style.borderColor = "#ef4444";
            } else {
                inputs[key].el.style.backgroundColor = "#dcfce7";
                inputs[key].el.style.borderColor = "#22c55e";
            }
        }
    }

    if (allCorrect) {
        showFlash("Correct!", "success");
        
        // Update Mastery (+1 for every correct round)
        let current = window.userMastery.DiamondMath || 0;
        let nextScore = Math.min(10, current + 1);
        window.userMastery.DiamondMath = nextScore;

        if (window.supabaseClient && window.currentUser) {
            try {
                const hour = sessionStorage.getItem('target_hour') || "00";
                await window.supabaseClient.from('assignment')
                    .update({ DiamondMath: nextScore })
                    .eq('userName', window.currentUser)
                    .eq('hour', hour);
            } catch (e) {
                console.error("Supabase update failed:", e);
            }
        }

        diamondRound++;
        setTimeout(() => {
            if (diamondRound > totalDiamondRounds) finishDiamondGame();
            else startDiamondRound();
        }, 1200);
    } else {
        showFlash("Check your math.", "error");
    }
};

function finishDiamondGame() {
    window.isCurrentQActive = false;
    document.getElementById('q-content').innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:400px; text-align:center;">
            <div style="font-size:60px; margin-bottom:10px;">💎</div>
            <h2 style="color:#1e293b; margin-bottom:5px;">Diamond Set Complete!</h2>
            <p style="color:#64748b;">Great work.</p>
            <p style="font-size: 14px; color: #10b981; margin-top: 10px;">Loading next activity...</p>
        </div>
    `;
    setTimeout(() => {
        if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion();
    }, 2000);
}

function showFlash(msg, type) {
    const overlay = document.getElementById('flash-overlay');
    if (!overlay) return;
    overlay.innerText = msg;
    overlay.style.display = 'block';
    overlay.style.backgroundColor = type === 'success' ? 'rgba(34, 197, 94, 0.95)' : 'rgba(239, 68, 68, 0.95)';
    setTimeout(() => { overlay.style.display = 'none'; }, 1500);
}
