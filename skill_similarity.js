/**
 * skill_similarity.js - Visual Version
 * - Draws similar polygons with labeled sides.
 * - Tracks 'Similarity' in Supabase.
 */

var similarityData = {
    round: 1,
    maxRounds: 3,
    shapeName: '',
    scaleFactor: 1,
    baseSides: [],
    scaledSides: [],
    solution: { k: 0, x: 0, y: 0 },
    indices: { known: 0, x: 0, y: 0 }
};

window.initSimilarityGame = async function() {
    if (!document.getElementById('q-content')) return;
    similarityData.round = 1;
    if (!window.userMastery) window.userMastery = {};

    try {
        const h = sessionStorage.getItem('target_hour') || "00";
        if (window.supabaseClient && window.currentUser) {
            const { data } = await window.supabaseClient
                .from('assignment')
                .select('Similarity')
                .eq('userName', window.currentUser)
                .eq('hour', h)
                .maybeSingle();
            if (data) window.userMastery.Similarity = data.Similarity || 0;
        }
    } catch (e) { console.log("Sync error", e); }

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
    
    const factors = [1.5, 2, 2.5, 0.5]; 
    similarityData.scaleFactor = factors[Math.floor(Math.random() * factors.length)];
    similarityData.baseSides = [...template.sides];
    similarityData.scaledSides = similarityData.baseSides.map(s => s * similarityData.scaleFactor);
    
    let indices = [0, 1, 2]; // For triangles/rects/traps, use first 3 distinct sides
    similarityData.indices.known = indices[0];
    similarityData.indices.x = indices[1];
    similarityData.indices.y = indices[2];
    
    similarityData.solution.k = similarityData.scaleFactor;
    similarityData.solution.x = similarityData.scaledSides[similarityData.indices.x];
    similarityData.solution.y = similarityData.baseSides[similarityData.indices.y];
}

function renderSimilarityUI() {
    const qContent = document.getElementById('q-content');
    if (!qContent) return;

    qContent.innerHTML = `
        <div style="max-width:650px; margin:0 auto;">
            <div style="text-align:center; margin-bottom:10px; color:#64748b; font-weight:bold;">
                Round ${similarityData.round} of ${similarityData.maxRounds} • ${similarityData.shapeName}
            </div>

            <div style="background:white; border:1px solid #e2e8f0; border-radius:12px; padding:10px; margin-bottom:20px; text-align:center;">
                <canvas id="simCanvas" width="600" height="220" style="max-width:100%; height:auto;"></canvas>
            </div>

            <div style="background:#f8fafc; padding:20px; border-radius:12px; border:1px solid #e2e8f0;">
                <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:15px; margin-bottom:20px;">
                    <div>
                        <label class="sim-label">Scale Factor (k)</label>
                        <input type="number" id="inp-k" class="sim-input" step="0.1" placeholder="k">
                    </div>
                    <div>
                        <label class="sim-label" style="color:#ef4444;">Solve y (Orig)</label>
                        <input type="number" id="inp-y" class="sim-input" step="0.1" placeholder="y">
                    </div>
                    <div>
                        <label class="sim-label" style="color:#2563eb;">Solve x (Scaled)</label>
                        <input type="number" id="inp-x" class="sim-input" step="0.1" placeholder="x">
                    </div>
                </div>
                <div id="sim-feedback" style="text-align:center; min-height:20px; font-weight:bold; margin-bottom:10px; font-size:14px;"></div>
                <button onclick="checkSimilarityAnswer()" class="sim-btn">Submit Answers</button>
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

    // Drawing settings
    const drawScale = 8;
    ctx.lineWidth = 2;
    ctx.font = "bold 14px Arial";

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

        // Labels
        ctx.fillStyle = "#1e293b";
        sides.forEach((val, i) => {
            if (i > 2 && d.shapeType !== 'rect') return; // Only label primary sides
            
            // Find midpoint of side
            let p1 = pts[i];
            let p2 = pts[(i + 1) % pts.length];
            let midX = (p1.x + p2.x) / 2 + offsetX;
            let midY = (p1.y + p2.y) / 2 + offsetY;

            let displayVal = val;
            if (!isScaled && i === idx.y) { displayVal = "y"; ctx.fillStyle = "#ef4444"; }
            else if (isScaled && i === idx.x) { displayVal = "x"; ctx.fillStyle = "#2563eb"; }
            else if (i !== idx.known && i !== idx.x && i !== idx.y) return; // Hide noisy sides
            else ctx.fillStyle = "#1e293b";

            ctx.fillText(displayVal, midX - 5, midY);
        });
    }

    const origPts = getPolygon(d.shapeType, d.baseSides, drawScale);
    const scaledPts = getPolygon(d.shapeType, d.scaledSides, drawScale * 0.8); // slight visual normalize

    drawShape(origPts, 50, 50, d.baseSides, false);
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("➔ k", 260, 110);
    drawShape(scaledPts, 350, 50, d.scaledSides, true);
}

// ... Keep existing checkSimilarityAnswer, updateSimilarityScore, and CSS Injection from your original script ...

window.checkSimilarityAnswer = async function() {
    const kInput = document.getElementById('inp-k');
    const xInput = document.getElementById('inp-x');
    const yInput = document.getElementById('inp-y');
    const feedback = document.getElementById('sim-feedback');

    const uk = parseFloat(kInput.value);
    const ux = parseFloat(xInput.value);
    const uy = parseFloat(yInput.value);

    if (isNaN(uk) || isNaN(ux) || isNaN(uy)) {
        feedback.style.color = "#ef4444";
        feedback.innerText = "Please fill in all three fields.";
        return;
    }

    const sol = similarityData.solution;
    const kOk = Math.abs(uk - sol.k) < 0.05;
    const xOk = Math.abs(ux - sol.x) < 0.05;
    const yOk = Math.abs(uy - sol.y) < 0.05;

    if (kOk && xOk && yOk) {
        feedback.style.color = "#16a34a";
        feedback.innerText = "Correct!";
        await updateSimilarityScore(1);
        similarityData.round++;
        if (similarityData.round > similarityData.maxRounds) {
            setTimeout(finishSimilarityGame, 1000);
        } else {
            setTimeout(() => { generateSimilarityProblem(); renderSimilarityUI(); }, 1000);
        }
    } else {
        feedback.style.color = "#ef4444";
        if (!kOk) feedback.innerText = "Check your Scale Factor (k).";
        else if (!yOk) feedback.innerText = "Check y. Original = Scaled / k";
        else if (!xOk) feedback.innerText = "Check x. Scaled = Original * k";
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
        } catch (e) { console.error(e); }
    }
}

async function finishSimilarityGame() {
    const qContent = document.getElementById('q-content');
    qContent.innerHTML = `<div style="text-align:center; padding:50px;"><h2>Complete!</h2></div>`;
    setTimeout(() => { if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion(); }, 2000);
}

const simStyle = document.createElement('style');
simStyle.innerHTML = `
    .sim-label { display:block; font-size:12px; font-weight:bold; color:#475569; margin-bottom:5px; text-transform:uppercase; }
    .sim-input { width:100%; height:40px; border-radius:8px; border:1px solid #cbd5e1; text-align:center; font-size:18px; font-family:monospace; color:#1e293b; outline:none; transition:0.2s; box-sizing:border-box; }
    .sim-input:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,0.1); }
    .sim-btn { width:100%; height:45px; background:#0f172a; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer; font-size:16px; transition:0.2s; }
    .sim-btn:hover { background:#1e293b; }
`;
document.head.appendChild(simStyle);
