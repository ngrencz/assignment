let currentPattern = {};
var figureErrorCount = 0; 
var currentStep = 1;      
let isVisualMode = false;
let lastM = null; 

// --- DRAG STATE VARIABLES ---
let isDrawing = false;

// Global listener to catch mouseup anywhere (stops painting if you drag off-screen)
window.addEventListener('mouseup', () => {
    isDrawing = false;
});

window.initFigureGrowthGame = async function() {
    window.isCurrentQActive = true;
    window.currentQSeconds = 0;
    figureErrorCount = 0;
    currentStep = 1;
    isVisualMode = Math.random() > 0.5;

    // 1. Generate Slope (m): 3 to 10
    let m;
    do { m = Math.floor(Math.random() * 8) + 3; } while (m === lastM); 
    lastM = m;

    // 2. Generate Intercept (b): 1 to 10
    const b = Math.floor(Math.random() * 10) + 1; 
    
    // 3. Prompt Figures (The "Examples")
    const f1 = Math.floor(Math.random() * 2) + 1; 
    const gap = Math.floor(Math.random() * 3) + 2; 
    const f2 = f1 + gap;
    
    // 4. Step 2 Figure: Any number up to 99 (not f1 or f2)
    let s2Fig;
    do { s2Fig = Math.floor(Math.random() * 98) + 1; } while (s2Fig === f1 || s2Fig === f2);

    // 5. Step 3 Figure: Drawing (Calculated to stay under 50 tiles)
    // Ensure Step 3 figure is NOT the same as f1, f2, or the step 2 prediction
    let s3Fig;
    let safeLoops = 0;
    do {
        s3Fig = Math.floor(Math.random() * 4) + 1; 
        
        // If random generated a big one that doesn't fit, reduce it
        while ((m * s3Fig) + b > 48 && s3Fig > 1) {
            s3Fig--;
        }
        safeLoops++;
    } while ((s3Fig === f1 || s3Fig === f2 || s3Fig === s2Fig) && safeLoops < 20);

    currentPattern = {
        m: m,
        b: b,
        f1Num: f1,
        f1Count: (m * f1) + b,
        f2Num: f2,
        f2Count: (m * f2) + b,
        step2Num: s2Fig,
        step2Ans: (m * s2Fig) + b,
        step3Num: s3Fig,
        step3Ans: (m * s3Fig) + b
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
                y = <input type="number" id="input-m" placeholder="m" class="math-input" style="width:85px"> x + 
                <input type="number" id="input-b" placeholder="b" class="math-input" style="width:85px">
            </div>`;
    } else if (currentStep === 2) {
        stepHTML = ruleDisplay + `<p><strong>Step 2:</strong> Intermediate Prediction.</p>
            <p>How many tiles are in <strong>Figure ${currentPattern.step2Num}</strong>?</p>
            <div style="font-size: 1.5rem; text-align: center; margin: 20px 0;">
                Tiles = <input type="number" id="input-step2" placeholder="?" class="math-input" style="width:110px">
            </div>`;
    } else {
        stepHTML = ruleDisplay + `
            <p><strong>Step 3:</strong> Draw Figure ${currentPattern.step3Num}.</p>
            <p>Click and drag on the grid to draw Figure ${currentPattern.step3Num}:</p>
            <div id="drawing-grid" style="display: grid; grid-template-columns: repeat(10, 32px); gap: 4px; justify-content: center; margin: 20px 0; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; touch-action: none;"></div>`;
    }

    qContent.innerHTML = headerHTML + stepHTML + `
        <div style="text-align:center; margin-top:15px; display: flex; justify-content: center; gap: 10px;">
            <button onclick="checkFigureAns()" class="primary-btn">Submit Answer</button>
            <button onclick="showFigureHint()" class="secondary-btn" style="background: #64748b; color: white; border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer;">Get Hint</button>
        </div>
        <div id="feedback-box" style="margin-top:10px; text-align:center; font-weight:bold; min-height:20px;"></div>
        <div id="hint-display" style="margin-top: 15px; padding: 10px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; display: none; font-size: 0.9rem; color: #92400e;"></div>`;

    if (currentStep === 3) setupDrawingGrid();
}

// --- UPDATED DRAWING LOGIC FOR CLICK-AND-DRAG ---
function setupDrawingGrid() {
    const grid = document.getElementById('drawing-grid');
    if (!grid) return;
    grid.innerHTML = ""; 
    
    // Prevent default drag/select behavior on the grid container
    grid.ondragstart = () => false;

    let paintMode = true; // Determines if we are Painting (true) or Erasing (false)

    for (let i = 0; i < 50; i++) {
        const tile = document.createElement('div');
        tile.className = 'drawing-tile';
        tile.style = "width:30px; height:30px; border:1px solid #cbd5e1; background:white; cursor:pointer; border-radius: 4px; user-select: none;";
        
        // Helper to set visual state
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

        // 1. Mouse Down: Start the drag and determine intent (Paint vs Erase)
        tile.onmousedown = function(e) {
            e.preventDefault(); // Stop text selection
            isDrawing = true;
            
            // If the tile we clicked is already active, we want to ERASE.
            // If it's empty, we want to PAINT.
            paintMode = !tile.classList.contains('active');
            
            setTileState(paintMode);
        };

        // 2. Mouse Enter: If dragging, apply the current paint mode
        tile.onmouseenter = function() {
            if (isDrawing) {
                setTileState(paintMode);
            }
        };

        grid.appendChild(tile);
    }
}

window.showFigureHint = function() {
    const hintBox = document.getElementById('hint-display');
    if(hintBox) hintBox.style.display = "block";
    
    let message = "";
    if (currentStep === 1) {
        message = `Compare the figures! The growth (m) is the change in tiles divided by the change in figure numbers.`;
    } else if (currentStep === 2) {
        message = `Plug ${currentPattern.step2Num} into your rule: (${currentPattern.m} × ${currentPattern.step2Num}) + ${currentPattern.b}`;
    } else {
        message = `Apply your rule (y = mx + b) using Figure ${currentPattern.step3Num} as 'x' to find how many tiles to draw.`;
    }
    if(hintBox) hintBox.innerHTML = message;
};
    
window.checkFigureAns = async function() {
    let isCorrect = false;
    const feedback = document.getElementById('feedback-box');
    if (feedback) feedback.style.display = "block";

    // Gather inputs
    if (currentStep === 1) {
        const mInput = document.getElementById('input-m');
        const bInput = document.getElementById('input-b');
        if(!mInput || !bInput) return; 
        
        const uM = parseInt(mInput.value);
        const uB = parseInt(bInput.value);
        isCorrect = (uM === currentPattern.m && uB === currentPattern.b);
    } else if (currentStep === 2) {
        const step2Input = document.getElementById('input-step2');
        if(!step2Input) return;
        const uAns = parseInt(step2Input.value);
        isCorrect = (uAns === currentPattern.step2Ans);
    } else {
        const activeTiles = document.querySelectorAll('.drawing-tile.active').length;
        isCorrect = (activeTiles === currentPattern.step3Ans);
    }

    if (isCorrect) {
        if(feedback) {
            feedback.className = "correct";
            feedback.style.color = "#16a34a"; 
            feedback.innerText = "✅ Correct!";
        }
        
        if (currentStep < 3) {
            currentStep++;
            setTimeout(() => { 
                if(feedback) feedback.style.display = "none"; 
                renderFigureUI(); 
            }, 1000);
        } else {
            finishFigureGame();
        } 
    } else {
        figureErrorCount++;
        if(feedback) {
            feedback.className = "incorrect";
            feedback.style.color = "#dc2626";
            feedback.innerText = "Not quite! Try again.";
        }
    }
};

async function finishFigureGame() {
    // 1. STOP the timer immediately
    window.isCurrentQActive = false;

    // 2. Consistent Visual Transition (replaces current content)
    document.getElementById('q-content').innerHTML = `
        <div style="text-align:center; padding:50px; animation: fadeIn 0.5s;">
            <div style="font-size: 50px; margin-bottom: 20px;">🟦</div>
            <h2 style="color: var(--black);">Pattern Mastered!</h2>
            <p style="color: var(--gray-text);">You successfully modeled the growth rule.</p>
            <p style="font-size: 0.9rem; color: var(--kelly-green); margin-top: 10px;">Loading next activity...</p>
        </div>
    `;

    if (window.supabaseClient && window.currentUser) {
        try {
            const { data } = await window.supabaseClient
                .from('assignment')
                .select('FigureGrowth')
                .eq('userName', window.currentUser)
                .maybeSingle();

            let currentScore = data ? (data.FigureGrowth || 0) : 0;
            
            // Standard Logic: 0 errors = +1, 2+ errors = -1
            let adjustment = 0;
            if (figureErrorCount === 0) adjustment = 1;
            else if (figureErrorCount >= 2) adjustment = -1;
            
            let newScore = Math.max(0, Math.min(10, currentScore + adjustment));

            await window.supabaseClient
                .from('assignment')
                .update({ FigureGrowth: newScore })
                .eq('userName', window.currentUser);
            
        } catch(e) { 
            console.error("Database sync failed:", e); 
        }
    }

    // 3. Hand over to Hub after 2 seconds
    setTimeout(() => { 
        if (typeof window.loadNextQuestion === 'function') {
            window.loadNextQuestion();
        } else {
            location.reload();
        }
    }, 2000);
}
