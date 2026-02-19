/**
 * skill_figuregrowth.js - v2.5.0
 * UPDATED: Context-aware Step 1 hints (m vs b logic).
 * RESTORED: Full production comments and robust error handling.
 */

let currentPattern = {};
var figureErrorCount = 0; 
var currentStep = 1;      
let isVisualMode = false;
let lastM = null; 

// --- DRAG STATE VARIABLES ---
let isDrawing = false;
window.addEventListener('mouseup', () => { isDrawing = false; });

window.initFigureGrowthGame = async function() {
    if (!document.getElementById('q-content')) return;

    window.isCurrentQActive = true;
    window.currentQSeconds = 0;
    figureErrorCount = 0;
    currentStep = 1;
    isVisualMode = Math.random() > 0.5;

    if (!window.userMastery) window.userMastery = {};

    try {
        if (window.supabaseClient && window.currentUser) {
            const currentHour = sessionStorage.getItem('target_hour');
            const { data } = await window.supabaseClient
                .from('assignment')
                .select('FigureGrowth')
                .eq('userName', window.currentUser)
                .eq('hour', currentHour)
                .maybeSingle();
            
            window.userMastery.FigureGrowth = data?.FigureGrowth || 0;
        }
    } catch (e) {
        console.log("Supabase sync error, using local state");
    }

    // Logic: m (3-10), b (1-10)
    let m;
    do { m = Math.floor(Math.random() * 8) + 3; } while (m === lastM); 
    lastM = m;
    const b = Math.floor(Math.random() * 10) + 1; 
    
    const f1 = Math.floor(Math.random() * 2) + 1; 
    const gap = Math.floor(Math.random() * 3) + 2; 
    const f2 = f1 + gap;
    
    let s2Fig;
    do { s2Fig = Math.floor(Math.random() * 98) + 1; } while (s2Fig === f1 || s2Fig === f2);

    let s3Fig;
    let safeLoops = 0;
    do {
        s3Fig = Math.floor(Math.random() * 4) + 1; 
        while ((m * s3Fig) + b > 48 && s3Fig > 1) { s3Fig--; }
        safeLoops++;
    } while ((s3Fig === f1 || s3Fig === f2 || s3Fig === s2Fig) && safeLoops < 20);

    currentPattern = {
        m: m, b: b,
        f1Num: f1, f1Count: (m * f1) + b,
        f2Num: f2, f2Count: (m * f2) + b,
        step2Num: s2Fig, step2Ans: (m * s2Fig) + b,
        step3Num: s3Fig, step3Ans: (m * s3Fig) + b
    };

    renderFigureUI();
};

function generateTileHTML(count, m, b, figNum) {
    const isExpert = (window.userMastery?.FigureGrowth || 0) >= 8;
    let html = `<div style="display: grid; grid-template-columns: repeat(5, 12px); gap: 1px; width: 65px; line-height: 0; margin: 0 auto;">`;
    for (let i = 0; i < count; i++) {
        let color = (i < b && !isExpert) ? '#f97316' : '#3b82f6'; 
        html += `<div style="width:12px; height:12px; background:${color}; border:0.5px solid white;"></div>`;
    }
    html += `</div>`;
    return html;
}

function renderFigureUI() {
    const qContent = document.getElementById('q-content');
    if (!qContent) return;

    document.getElementById('q-title').innerText = `Figure Growth Analysis`;

    let headerHTML = "";
    if (isVisualMode && currentPattern.f2Count <= 30) { 
        headerHTML = `<div style="display:flex; justify-content:center; align-items:flex-end; gap:30px; margin-bottom:20px; background: white; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <div style="text-align:center;"><small style="color:#64748b">Fig ${currentPattern.f1Num}</small>${generateTileHTML(currentPattern.f1Count, currentPattern.m, currentPattern.b, currentPattern.f1Num)}</div>
                        <div style="text-align:center;"><small style="color:#64748b">Fig ${currentPattern.f2Num}</small>${generateTileHTML(currentPattern.f2Count, currentPattern.m, currentPattern.b, currentPattern.f2Num)}</div>
                    </div>`;
    } else {
        headerHTML = `<div style="background:#f1f5f9; padding:15px; border-radius:12px; margin-bottom:20px; border: 1px solid #cbd5e1; text-align:center;">
                        <p style="color:#1e293b; margin:0;"><strong>Figure ${currentPattern.f1Num}:</strong> ${currentPattern.f1Count} tiles &nbsp;|&nbsp; <strong>Figure ${currentPattern.f2Num}:</strong> ${currentPattern.f2Count} tiles</p>
                    </div>`;
    }

    let ruleDisplay = (currentStep > 1) ? `
        <div style="background: #ecfdf5; border: 1px dashed #10b981; padding: 10px; border-radius: 8px; margin-bottom: 15px; text-align: center; color: #065f46;">
            <strong>Your Rule:</strong> y = ${currentPattern.m}x + ${currentPattern.b}
        </div>` : "";

    let stepHTML = "";
    if (currentStep === 1) {
        stepHTML = `<p style="text-align:center; color:#475569;"><strong>Step 1:</strong> Find the linear rule (y = mx + b).</p>
            <div style="font-size: 1.5rem; text-align: center; margin: 20px 0; color:#1e293b;">
                y = <input type="number" id="input-m" placeholder="m" style="width:70px; padding:5px; text-align:center; border:1px solid #94a3b8; border-radius:4px; font-size:1.2rem;"> x + 
                <input type="number" id="input-b" placeholder="b" style="width:70px; padding:5px; text-align:center; border:1px solid #94a3b8; border-radius:4px; font-size:1.2rem;">
            </div>`;
    } else if (currentStep === 2) {
        stepHTML = ruleDisplay + `<p style="text-align:center; color:#475569;"><strong>Step 2:</strong> Intermediate Prediction.</p>
            <p style="text-align:center;">How many tiles are in <strong>Figure ${currentPattern.step2Num}</strong>?</p>
            <div style="font-size: 1.5rem; text-align: center; margin: 20px 0;">
                Tiles = <input type="number" id="input-step2" placeholder="?" style="width:100px; padding:5px; text-align:center; border:1px solid #94a3b8; border-radius:4px; font-size:1.2rem;">
            </div>`;
    } else {
        stepHTML = ruleDisplay + `
            <p style="text-align:center; color:#475569;"><strong>Step 3:</strong> Draw Figure ${currentPattern.step3Num}.</p>
            <p style="text-align:center; font-size:14px; color:#1e293b;">Click and drag on the grid to draw the shape:</p>
            <div id="drawing-grid" style="display: grid; grid-template-columns: repeat(10, 32px); gap: 4px; justify-content: center; margin: 20px 0; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; touch-action: none;"></div>`;
    }

    qContent.innerHTML = headerHTML + stepHTML + `
        <div style="text-align:center; margin-top:15px; display: flex; justify-content: center; gap: 10px;">
            <button onclick="checkFigureAns()" style="background:#1e293b; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:bold;">Submit Answer</button>
        </div>
        <div id="feedback-box" style="margin-top:10px; text-align:center; font-weight:bold; min-height:20px;"></div>
        <div id="hint-display" style="margin-top: 15px; padding: 12px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; display: none; font-size: 0.95rem; color: #92400e; text-align:center; line-height:1.4;"></div>`;

    if (currentStep === 3) setupDrawingGrid();
}

function setupDrawingGrid() {
    const grid = document.getElementById('drawing-grid');
    if (!grid) return;
    grid.innerHTML = ""; 
    grid.ondragstart = () => false;
    let paintMode = true;

    for (let i = 0; i < 50; i++) {
        const tile = document.createElement('div');
        tile.className = 'drawing-tile';
        tile.style = "width:30px; height:30px; border:1px solid #cbd5e1; background:white; cursor:pointer; border-radius: 4px; user-select: none;";
        
        const setTileState = (isActive) => {
            if (isActive) {
                tile.classList.add('active');
                tile.style.background = "#3b82f6";
                tile.style.borderColor = "#2563eb";
            } else {
                tile.classList.remove('active');
                tile.style.background = "white";
                tile.style.borderColor = "#cbd5e1";
            }
        };

        tile.onmousedown = function(e) {
            e.preventDefault();
            isDrawing = true;
            paintMode = !tile.classList.contains('active');
            setTileState(paintMode);
        };

        tile.onmouseenter = function() {
            if (isDrawing) setTileState(paintMode);
        };

        grid.appendChild(tile);
    }
}

/**
 * Enhanced Hint Logic
 * Checks specific user inputs for Step 1 to give targeted feedback.
 */
window.showFigureHint = function(wrongM, wrongB) {
    const hintBox = document.getElementById('hint-display');
    if(!hintBox) return;
    hintBox.style.display = "block";
    
    let message = "";
    if (currentStep === 1) {
        if (wrongM) {
            // Prioritize M hint
            message = `<strong>How to find growth (m):</strong><br>
                       The number of tiles increased by <b>${currentPattern.f2Count - currentPattern.f1Count}</b> over <b>${currentPattern.f2Num - currentPattern.f1Num}</b> figures.<br>
                       Divide those to find <b>m</b>.`;
        } else if (wrongB) {
            // M is correct, but B is wrong
            message = `<strong>How to find starting value (b):</strong><br>
                       Figure ${currentPattern.f1Num} has ${currentPattern.f1Count} tiles. <br>
                       Subtract the growth: ${currentPattern.f1Count} - (${currentPattern.m} × ${currentPattern.f1Num}) = <b>b</b>.`;
        }
    } else if (currentStep === 2) {
        message = `Plug Figure ${currentPattern.step2Num} into your rule: (${currentPattern.m} × ${currentPattern.step2Num}) + ${currentPattern.b}`;
    } else {
        message = `<strong>Reminder:</strong> Apply your rule (y = ${currentPattern.m}x + ${currentPattern.b}) using Figure ${currentPattern.step3Num} as 'x' to see how many tiles to draw.`;
    }
    hintBox.innerHTML = message;
};
    
window.checkFigureAns = async function() {
    let isCorrect = false;
    let wrongM = false;
    let wrongB = false;

    const feedback = document.getElementById('feedback-box');
    const hintBox = document.getElementById('hint-display');

    if (currentStep === 1) {
        const uM = parseInt(document.getElementById('input-m').value);
        const uB = parseInt(document.getElementById('input-b').value);
        
        wrongM = (uM !== currentPattern.m);
        wrongB = (uB !== currentPattern.b);
        isCorrect = (!wrongM && !wrongB);
    } else if (currentStep === 2) {
        const uAns = parseInt(document.getElementById('input-step2').value);
        isCorrect = (uAns === currentPattern.step2Ans);
    } else {
        const activeTiles = document.querySelectorAll('.drawing-tile.active').length;
        isCorrect = (activeTiles === currentPattern.step3Ans);
    }

    if (isCorrect) {
        if(feedback) {
            feedback.style.color = "#16a34a"; 
            feedback.innerText = "✅ Correct!";
        }
        if(hintBox) hintBox.style.display = "none";
        
        if (currentStep < 3) {
            currentStep++;
            setTimeout(() => { 
                if(feedback) feedback.innerText = ""; 
                renderFigureUI(); 
            }, 1000);
        } else {
            finishFigureGame();
        } 
    } else {
        figureErrorCount++;
        if(feedback) {
            feedback.style.color = "#dc2626";
            feedback.innerText = "Not quite! Try again.";
        }
        // Trigger context-aware hint
        showFigureHint(wrongM, wrongB);
    }
};

async function finishFigureGame() {
    window.isCurrentQActive = false;
    document.getElementById('q-content').innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:400px; text-align:center;">
            <div style="font-size:60px; margin-bottom:10px;">🟦</div>
            <h2 style="color:#1e293b; margin-bottom:5px;">Pattern Mastered!</h2>
            <p style="color:#64748b;">You successfully modeled the growth rule.</p>
            <p style="font-size: 14px; color: #10b981; margin-top: 10px;">Loading next activity...</p>
        </div>
    `;

    let adjustment = 0;
    if (figureErrorCount === 0) adjustment = 1;
    else if (figureErrorCount >= 2) adjustment = -1;

    let currentScore = window.userMastery.FigureGrowth || 0;
    let newScore = Math.max(0, Math.min(10, currentScore + adjustment));
    window.userMastery.FigureGrowth = newScore;

    if (window.supabaseClient && window.currentUser) {
        try {
            const currentHour = sessionStorage.getItem('target_hour') || "00";
            await window.supabaseClient
                .from('assignment')
                .update({ FigureGrowth: newScore })
                .eq('userName', window.currentUser)
                .eq('hour', currentHour);
        } catch(e) { console.error("Database sync failed:", e); }
    }

    setTimeout(() => { 
        if (typeof window.loadNextQuestion === 'function') {
            window.loadNextQuestion();
        }
    }, 2000);
}
