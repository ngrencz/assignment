/**
 * skill_similarity.js
 * - REVERTED: To 292-line logic to restore robust shape scaling.
 * - MODIFICATION: Tightened bottom UI container (removed excess padding/gaps).
 * - MODIFICATION: Refined Scale Factors to prevent extreme size differences.
 * - MODIFICATION: Labels forced outside via vector normal.
 * - BUGFIX: Ensured corresponding side for 'y' always renders on the scaled shape.
 */

var similarityData = {
    round: 1,
    maxRounds: 3,
    shapeName: '',
    shapeType: '',
    scaleFactor: 1,
    baseSides: [],
    scaledSides: [],
    solution: { k: 0, x: 0, y: 0 },
    indices: { known: 0, x: 0, y: 0 }
};

window.initSimilarityGame = async function() {
    // Debugger log for test.html
    if (typeof log === 'function') {
        log("🚀 Similarity: 292-line Logic Restored | UI Tightened");
    }

    if (!document.getElementById('q-content')) return;

    similarityData.round = 1;
    if (!window.userMastery) window.userMastery = {};

    try {
        if (window.supabaseClient && window.currentUser) {
            const h = sessionStorage.getItem('target_hour') || "00";
            const { data } = await window.supabaseClient
                .from('assignment')
                .select('Similarity')
                .eq('userName', window.currentUser)
                .eq('hour', h)
                .maybeSingle();
            
            if (data) window.userMastery.Similarity = data.Similarity || 0;
        }
    } catch (e) { 
        console.log("Sync error", e); 
    }

    generateSimilarityProblem();
    renderSimilarityUI();
};

function generateSimilarityProblem() {
    const templates = [
        { name: 'Triangle', sides: [6, 8, 10], type: 'tri' },
        { name: 'Triangle', sides: [9, 12, 15], type: 'tri' },
        { name: 'Rectangle', sides: [8, 14, 8, 14], type: 'rect' },
        { name: 'Trapezoid', sides: [8, 10, 14, 10], type: 'trap' }
    ];
    
    let template = templates[Math.floor(Math.random() * templates.length)];
    similarityData.shapeName = template.name;
    similarityData.shapeType = template.type;
    
    // Scale Factors adjusted to keep shapes within reasonable visual bounds
    const factors = [0.5, 0.75, 1.25, 1.5, 2, 2.5, 3]; 
    similarityData.scaleFactor = factors[Math.floor(Math.random() * factors.length)];
    
    similarityData.baseSides = [...template.sides];
    similarityData.scaledSides = similarityData.baseSides.map(s => s * similarityData.scaleFactor);
    
    similarityData.indices.known = 0;
    similarityData.indices.x = 1;
    similarityData.indices.y = 2;
    
    similarityData.solution.k = similarityData.scaleFactor;
    similarityData.solution.x = similarityData.scaledSides[similarityData.indices.x];
    similarityData.solution.y = similarityData.baseSides[similarityData.indices.y];
}

function renderSimilarityUI() {
    const qContent = document.getElementById('q-content');
    if (!qContent) return;

    qContent.innerHTML = `
        <div style="max-width:650px; margin:0 auto; animation: fadeIn 0.5s;">
            <div style="text-align:center; margin-bottom:5px; color:#64748b; font-weight:bold; font-size: 14px;">
                Round ${similarityData.round} of ${similarityData.maxRounds} • ${similarityData.shapeName}
            </div>

            <div style="background:white; border:1px solid #e2e8f0; border-radius:12px; padding:10px; margin-bottom:10px; text-align:center; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);">
                <canvas id="simCanvas" width="600" height="300" style="max-width:100%; height:auto;"></canvas>
            </div>

            <div style="background:#f8fafc; padding:12px 20px; border-radius:12px; border:1px solid #e2e8f0; display: flex; flex-direction: column; gap: 10px;">
                <p style="font-size: 0.85rem; color: #475569; margin: 0; text-align:center;">
                    Enter answers in <b>decimal format</b>.
                </p>
                
                <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:12px;">
                    <div>
                        <label class="sim-label">Scale Factor (k)</label>
                        <input type="number" id="inp-k" class="sim-input" step="0.01" placeholder="Decimal">
                    </div>
                    <div>
                        <label class="sim-label" style="color:#ef4444;">Solve y (Orig)</label>
                        <input type="number" id="inp-y" class="sim-input" step="0.01" placeholder="Decimal">
                    </div>
                    <div>
                        <label class="sim-label" style="color:#2563eb;">Solve x (Scaled)</label>
                        <input type="number" id="inp-x" class="sim-input" step="0.01" placeholder="Decimal">
                    </div>
                </div>

                <div id="sim-feedback" style="text-align:center; min-height:30px; font-weight:bold; font-size:13px; padding: 5px; border-radius: 6px; display: flex; align-items: center; justify-content: center;"></div>
                
                <div style="text-align: center;">
                    <button onclick="checkSimilarityAnswer()" class="sim-btn">Submit Answers</button>
                </div>
            </div>
        </div>
    `;
    setTimeout(drawSimilarShapes, 50);
}

function drawSimilarShapes() {
    const canvas = document.getElementById('simCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const d = similarityData;
    const idx = d.indices;

    const totalRequiredUnits = Math.max(...d.baseSides) + Math.max(...d.scaledSides) + 15;
    const maxUnitsHeight = Math.max(...d.baseSides, ...d.scaledSides);
    
    // Original scaling logic that handles box boundaries
    const dynamicScale = Math.min(600 / totalRequiredUnits, 240 / maxUnitsHeight, 20); 

    ctx.lineWidth = 2;
    ctx.font = "bold 15px Arial";

    function getPolygon(type, sides, scale) {
        let pts = [];
        if (type === 'tri') {
            pts = [{x:0, y:sides[1]}, {x:sides[0], y:sides[1]}, {x:0, y:0}];
        } else if (type === 'rect') {
            pts = [{x:0, y:0}, {x:sides[1], y:0}, {x:sides[1], y:sides[0]}, {x:0, y:sides[0]}];
        } else if (type === 'trap') {
            pts = [{x:2, y:0}, {x:sides[0]+2, y:0}, {x:sides[2], y:sides[1]}, {x:0, y:sides[1]}];
        }
        return pts.map(p => ({x: p.x * scale, y: p.y * scale}));
    }

    function drawShape(pts, offsetX, offsetY, sides, isScaled) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x + offsetX, pts[0].y + offsetY);
        pts.forEach(p => ctx.lineTo(p.x + offsetX, p.y + offsetY));
        ctx.closePath();
        
        ctx.strokeStyle = isScaled ? "#22c55e" : "#64748b";
        ctx.fillStyle = isScaled ? "#f0fdf4" : "#f8fafc";
        ctx.fill();
        ctx.stroke();

        sides.forEach((val, i) => {
            if (i > 2 && d.shapeType !== 'rect') return; 

            let p1 = pts[i];
            let p2 = pts[(i + 1) % pts.length];
            let midX = (p1.x + p2.x) / 2 + offsetX;
            let midY = (p1.y + p2.y) / 2 + offsetY;

            let dx = p2.x - p1.x;
            let dy = p2.y - p1.y;
            let len = Math.sqrt(dx*dx + dy*dy);
            let nx = -dy/len; 
            let ny = dx/len;  

            let displayVal = val;
            ctx.fillStyle = "#1e293b";

            // BUGFIX APPLIED HERE:
            if (!isScaled) {
                if (i === idx.y) { displayVal = "y"; ctx.fillStyle = "#ef4444"; }
                else if (i !== idx.known && i !== idx.x) return; 
            } else {
                if (i === idx.x) { displayVal = "x"; ctx.fillStyle = "#2563eb"; }
                else if (i !== idx.known && i !== idx.y) return; 
            }

            ctx.textAlign = "center";
            ctx.fillText(displayVal, midX + nx*22, midY + ny*22 + 5);
        });
    }

    const oPts = getPolygon(d.shapeType, d.baseSides, dynamicScale);
    const sPts = getPolygon(d.shapeType, d.scaledSides, dynamicScale);

    const oW = Math.max(...oPts.map(p => p.x));
    const oH = Math.max(...oPts.map(p => p.y));
    const sH = Math.max(...sPts.map(p => p.y));

    drawShape(oPts, 50, (300 - oH)/2, d.baseSides, false);
    
    ctx.fillStyle = "#94a3b8";
    ctx.font = "20px Arial";
    ctx.fillText("➔ k", oW + 100, 150);
    
    drawShape(sPts, oW + 180, (300 - sH)/2, d.scaledSides, true);
}

window.checkSimilarityAnswer = async function() {
    const kInput = document.getElementById('inp-k');
    const xInput = document.getElementById('inp-x');
    const yInput = document.getElementById('inp-y');
    const feedback = document.getElementById('sim-feedback');

    const uk = parseFloat(kInput.value);
    const ux = parseFloat(xInput.value);
    const uy = parseFloat(yInput.value);

    if (isNaN(uk) || isNaN(ux) || isNaN(uy)) {
        feedback.style.color = "#991b1b";
        feedback.style.backgroundColor = "#fee2e2";
        feedback.innerText = "Please provide decimal answers.";
        return;
    }

    const sol = similarityData.solution;
    const kOk = Math.abs(uk - sol.k) < 0.05;
    const xOk = Math.abs(ux - sol.x) < 0.05;
    const yOk = Math.abs(uy - sol.y) < 0.05;

    if (kOk && xOk && yOk) {
        feedback.style.color = "#166534";
        feedback.style.backgroundColor = "#dcfce7";
        feedback.innerText = "✅ Correct!";
        
        await updateSimilarityScore(1);
        similarityData.round++;
        
        if (similarityData.round > similarityData.maxRounds) {
            setTimeout(finishSimilarityGame, 1000);
        } else {
            setTimeout(() => { 
                generateSimilarityProblem(); 
                renderSimilarityUI(); 
            }, 1000);
        }
    } else {
        feedback.style.backgroundColor = "#fee2e2";
        feedback.style.color = "#991b1b";
        
        if (!kOk) feedback.innerText = "❌ Check your Scale Factor.";
        else if (!yOk) feedback.innerText = "❌ Check value for y.";
        else feedback.innerText = "❌ Check value for x.";
    }
};

async function updateSimilarityScore(amount) {
    if (!window.userMastery) window.userMastery = {};
    let current = window.userMastery.Similarity || 0;
    let next = Math.max(0, Math.min(10, current + amount));
    window.userMastery.Similarity = next;

    if (window.supabaseClient && window.currentUser) {
        try {
            const h = sessionStorage.getItem('target_hour') || "00";
            await window.supabaseClient.from('assignment')
                .update({ Similarity: next })
                .eq('userName', window.currentUser)
                .eq('hour', h);
        } catch (e) { console.error("Supabase error", e); }
    }
}

function finishSimilarityGame() {
    const qContent = document.getElementById('q-content');
    qContent.innerHTML = `
        <div style="text-align:center; padding: 40px;">
            <h2>Module Complete!</h2>
            <p>Mastery achieved.</p>
        </div>
    `;
    setTimeout(() => { 
        if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion(); 
    }, 2000);
}

const simStyle = document.createElement('style');
simStyle.innerHTML = `
    .sim-label { display:block; font-size:11px; font-weight:bold; color:#475569; margin-bottom:4px; text-transform:uppercase; }
    .sim-input { width:100%; height:40px; border-radius:8px; border:1px solid #cbd5e1; text-align:center; font-size:18px; outline:none; box-sizing:border-box; }
    .sim-btn { width:200px; height:45px; background:#6366f1; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer; font-size:16px; transition:0.2s; }
    .sim-btn:hover { background:#4f46e5; }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
`;
document.head.appendChild(simStyle);
