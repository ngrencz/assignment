/**
 * Similarity & Scale Factor Module
 * - Generates two similar polygons.
 * - Requires user to calculate Scale Factor and solve for x and y.
 * - SUPABASE: Updates 'Similarity' column.
 */

// Global State for Similarity
var simData = {
    shapeType: '',
    scaleFactor: 1,
    baseSides: [],
    scaledSides: [],
    xValue: 0,
    yValue: 0,
    knownIndex: 0, // The side pair shown to find scale factor
    xIndex: 0,     // The side index for x
    yIndex: 0      // The side index for y
};

var simRound = 1;

window.initSimilarityGame = async function() {
    if (!document.getElementById('q-content')) return;

    window.isCurrentQActive = true;
    window.currentQSeconds = 0;
    simRound = 1;

    // Fetch progress for adaptive difficulty if needed
    try {
        if (window.supabaseClient && window.currentUser) {
            const { data } = await window.supabaseClient
                .from('assignment')
                .select('Similarity')
                .eq('userName', window.currentUser)
                .maybeSingle();
            
            window.userProgress.Similarity = data?.Similarity || 0;
        }
    } catch (e) { console.log("Sync error"); }
    
    startSimilarityRound();
};

function startSimilarityRound() {
    generateSimilarityProblem();
    renderSimilarityUI();
}

function generateSimilarityProblem() {
    // 1. Pick a Shape and base side lengths
    const templates = [
        { name: 'Quadrilateral', sides: [8, 12, 10, 6] },
        { name: 'Pentagon', sides: [6, 8, 7, 10, 15] },
        { name: 'Triangle', sides: [5, 12, 13] }
    ];
    
    let template = templates[Math.floor(Math.random() * templates.length)];
    simData.shapeType = template.name;
    
    // 2. Determine Scale Factor (Clean decimals or integers)
    // Range 1.5 to 3.0
    simData.scaleFactor = (Math.floor(Math.random() * 4) + 2) / 2; 
    
    simData.baseSides = [...template.sides];
    simData.scaledSides = simData.baseSides.map(s => s * simData.scaleFactor);
    
    // 3. Assign Roles to sides
    let indices = [...Array(simData.baseSides.length).keys()].sort(() => Math.random() - 0.5);
    simData.knownIndex = indices[0]; // Shows both numbers
    simData.xIndex = indices[1];     // Solve for Large side
    simData.yIndex = indices[2];     // Solve for Small side
    
    simData.xValue = simData.scaledSides[simData.xIndex];
    simData.yValue = simData.baseSides[simData.yIndex];
}

function renderSimilarityUI() {
    const qContent = document.getElementById('q-content');
    if (!qContent) return;

    document.getElementById('q-title').innerText = `Similarity & Scale (Round ${simRound}/3)`;

    qContent.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px; text-align: center;">
            <p style="font-size: 16px; color: #334155; margin-bottom: 20px;">
                The two figures below are <strong>similar</strong>. Find the scale factor, then solve for <b>x</b> and <b>y</b>.
            </p>
            
            <div style="display: flex; justify-content: space-around; align-items: center; flex-wrap: wrap; gap: 20px;">
                <div style="padding: 15px; border: 2px solid #94a3b8; border-radius: 8px; background: #f8fafc;">
                    <div style="font-weight: bold; color: #64748b; margin-bottom: 5px;">Original</div>
                    <div style="font-family: monospace; font-size: 14px;">
                        Side A: ${simData.baseSides[simData.knownIndex]}<br>
                        Side B: ${simData.baseSides[simData.xIndex]}<br>
                        Side C: <span style="color: #ef4444; font-weight: bold;">y</span>
                    </div>
                </div>

                <div style="font-size: 24px; color: #cbd5e1;">➔</div>

                <div style="padding: 15px; border: 2px solid #22c55e; border-radius: 8px; background: #f0fdf4;">
                    <div style="font-weight: bold; color: #16a34a; margin-bottom: 5px;">Scaled</div>
                    <div style="font-family: monospace; font-size: 14px;">
                        Side A: ${simData.scaledSides[simData.knownIndex]}<br>
                        Side B: <span style="color: #2563eb; font-weight: bold;">x</span><br>
                        Side C: ${simData.scaledSides[simData.yIndex]}
                    </div>
                </div>
            </div>
        </div>

        <div id="control-panel" style="background:#f1f5f9; border:1px solid #cbd5e1; padding:20px; border-radius:10px; display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
            <div style="grid-column: span 2;">
                <label style="display:block; font-size:12px; font-weight:bold; color:#475569; margin-bottom:5px;">SCALE FACTOR (Small to Large)</label>
                <input type="number" id="input-sf" step="0.1" placeholder="?" style="width:100%; height:40px; border-radius:6px; border:1px solid #cbd5e1; text-align:center; font-size:18px;">
            </div>
            
            <div>
                <label style="display:block; font-size:12px; font-weight:bold; color:#2563eb; margin-bottom:5px;">SOLVE FOR X</label>
                <input type="number" id="input-x" step="0.01" placeholder="x" style="width:100%; height:40px; border-radius:6px; border:1px solid #cbd5e1; text-align:center; font-size:18px;">
            </div>

            <div>
                <label style="display:block; font-size:12px; font-weight:bold; color:#ef4444; margin-bottom:5px;">SOLVE FOR Y</label>
                <input type="number" id="input-y" step="0.01" placeholder="y" style="width:100%; height:40px; border-radius:6px; border:1px solid #cbd5e1; text-align:center; font-size:18px;">
            </div>

            <button onclick="checkSimilarityWin()" style="grid-column: span 2; height:50px; background:#0f172a; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer; font-size:16px; margin-top:10px;">
                SUBMIT ANSWERS
            </button>
        </div>
        <div id="flash-overlay" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(0,0,0,0.8); color:white; padding:20px 40px; border-radius:12px; font-size:24px; font-weight:bold; display:none; pointer-events:none; text-align:center; z-index:10;"></div>
    `;
}

window.checkSimilarityWin = async function() {
    const userSF = parseFloat(document.getElementById('input-sf').value);
    const userX = parseFloat(document.getElementById('input-x').value);
    const userY = parseFloat(document.getElementById('input-y').value);

    const isSFCorrect = Math.abs(userSF - simData.scaleFactor) < 0.01;
    const isXCorrect = Math.abs(userX - simData.xValue) < 0.01;
    const isYCorrect = Math.abs(userY - simData.yValue) < 0.01;

    if (isSFCorrect && isXCorrect && isYCorrect) {
        // --- MATCHING YOUR TRANSFORMATION LOGIC ---
        // 1. Calculate Skill Delta
        let currentVal = window.userProgress.Similarity || 0;
        let newVal = Math.max(0, Math.min(10, currentVal + 1)); // Standard +1 for correct
        
        // 2. Update Local Global State
        window.userProgress.Similarity = newVal;
        
        // 3. Prepare Update Object
        let updates = { Similarity: newVal };

        // 4. Send to Supabase IMMEDIATELY
        if (window.supabaseClient && window.currentUser) {
            try {
                const currentHour = sessionStorage.getItem('target_hour') || "00";
                await window.supabaseClient
                    .from('assignment')
                    .update(updates)
                    .eq('userName', window.currentUser)
                    .eq('hour', currentHour);
            } catch (e) {
                console.error("Similarity DB Update Failed:", e);
            }
        }

        showFlash("Perfect!", "success");
        simRound++;

        setTimeout(() => {
            if (simRound > 3) finishSimilarityGame();
            else startSimilarityRound();
        }, 1500);
    } else {
        let errorMsg = !isSFCorrect ? "Check Scale Factor" : (!isXCorrect ? "Check x" : "Check y");
        showFlash(errorMsg, "error");
    }
};
function finishSimilarityGame() {
    window.isCurrentQActive = false;
    const qContent = document.getElementById('q-content');
    qContent.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:400px;">
            <div style="font-size:60px;">📏</div>
            <h2 style="color:#1e293b; margin:10px 0;">Similarity Mastered!</h2>
            <p style="color:#64748b; font-size:16px;">Moving to next skill...</p>
        </div>
    `;
    setTimeout(() => {
        if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion();
    }, 2500);
}

// Reuse your existing showFlash function
function showFlash(msg, type) {
    const overlay = document.getElementById('flash-overlay');
    if (!overlay) return;
    overlay.innerText = msg;
    overlay.style.display = 'block';
    overlay.style.backgroundColor = type === 'success' ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)';
    setTimeout(() => { overlay.style.display = 'none'; }, 1500);
}
