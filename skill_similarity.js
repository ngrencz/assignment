/**
 * skill_similarity.js
 * - Generates two similar polygons (Original -> Scaled).
 * - Requires user to calculate Scale Factor (k), solve for x (on scaled), and y (on original).
 * - Updates 'Similarity' column in Supabase.
 */

var similarityData = {
    round: 1,
    maxRounds: 3,
    shapeName: '',
    scaleFactor: 1,
    baseSides: [],
    scaledSides: [],
    solution: {
        k: 0,
        x: 0,
        y: 0
    },
    indices: {
        known: 0, // The pair shown to find k
        x: 0,     // The missing side on Scaled
        y: 0      // The missing side on Original
    }
};

window.initSimilarityGame = async function() {
    if (!document.getElementById('q-content')) return;

    // Reset State
    similarityData.round = 1;
    
    // Initialize Mastery
    if (!window.userMastery) window.userMastery = {};

    // Sync initial score
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
    } catch (e) { console.log("Sync error", e); }

    generateSimilarityProblem();
    renderSimilarityUI();
};

function generateSimilarityProblem() {
    // 1. Pick a Shape Template
    const templates = [
        { name: 'Triangle', sides: [6, 8, 10] },
        { name: 'Triangle', sides: [5, 12, 13] },
        { name: 'Rectangle', sides: [10, 15, 10, 15] },
        { name: 'Trapezoid', sides: [8, 10, 12, 10] },
        { name: 'Pentagon', sides: [6, 6, 8, 8, 5] }
    ];
    
    let template = templates[Math.floor(Math.random() * templates.length)];
    similarityData.shapeName = template.name;
    
    // 2. Determine Scale Factor (1.5, 2.0, 2.5, 3.0, 0.5)
    // Weighted towards expansion, occasionally reduction
    const factors = [1.5, 2, 2.5, 3, 0.5]; 
    similarityData.scaleFactor = factors[Math.floor(Math.random() * factors.length)];
    
    similarityData.baseSides = [...template.sides];
    similarityData.scaledSides = similarityData.baseSides.map(s => s * similarityData.scaleFactor);
    
    // 3. Assign Roles to sides
    // We need 3 distinct indices: one for Known Pair, one for X, one for Y
    let indices = [...Array(similarityData.baseSides.length).keys()];
    
    // Shuffle indices
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    similarityData.indices.known = indices[0];
    similarityData.indices.x = indices[1];
    similarityData.indices.y = indices[2];
    
    // Store Solutions
    similarityData.solution.k = similarityData.scaleFactor;
    similarityData.solution.x = similarityData.scaledSides[similarityData.indices.x];
    similarityData.solution.y = similarityData.baseSides[similarityData.indices.y];
}

function renderSimilarityUI() {
    const qContent = document.getElementById('q-content');
    if (!qContent) return;

    const d = similarityData;
    const idx = d.indices;

    // Helper to format side labels
    // Side A, Side B, Side C...
    const labels = "ABCDE"; 

    // Build Original Side List
    let originalHtml = '';
    d.baseSides.forEach((s, i) => {
        let val = s;
        let color = "#334155";
        let weight = "normal";
        
        if (i === idx.y) {
            val = "y"; // Missing on Original
            color = "#ef4444";
            weight = "bold";
        }
        
        // Only show relevant sides to reduce noise
        if (i === idx.known || i === idx.x || i === idx.y) {
            originalHtml += `<div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px dashed #e2e8f0;">
                <span style="color:#94a3b8;">Side ${labels[i]}</span>
                <span style="color:${color}; font-weight:${weight}; font-size:16px;">${val}</span>
            </div>`;
        }
    });

    // Build Scaled Side List
    let scaledHtml = '';
    d.scaledSides.forEach((s, i) => {
        let val = s;
        let color = "#334155";
        let weight = "normal";

        if (i === idx.x) {
            val = "x"; // Missing on Scaled
            color = "#2563eb";
            weight = "bold";
        }

        if (i === idx.known || i === idx.x || i === idx.y) {
            scaledHtml += `<div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px dashed #e2e8f0;">
                <span style="color:#94a3b8;">Side ${labels[i]}'</span>
                <span style="color:${color}; font-weight:${weight}; font-size:16px;">${val}</span>
            </div>`;
        }
    });

    qContent.innerHTML = `
        <div style="max-width:600px; margin:0 auto;">
            <div style="text-align:center; margin-bottom:15px; color:#64748b;">
                Round ${d.round} of ${d.maxRounds} • <span style="font-weight:bold;">${d.shapeName}</span>
            </div>

            <div style="display: flex; justify-content: center; align-items: stretch; gap: 10px; margin-bottom: 25px;">
                
                <div style="flex:1; background:#fff; border:2px solid #94a3b8; border-radius:12px; padding:15px; display:flex; flex-direction:column;">
                    <div style="text-align:center; font-weight:bold; color:#64748b; margin-bottom:10px; text-transform:uppercase; font-size:12px; letter-spacing:1px;">Original</div>
                    <div style="font-family:monospace; flex:1;">
                        ${originalHtml}
                    </div>
                </div>

                <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; color:#cbd5e1; font-size:24px;">
                    ➔
                    <div style="font-size:10px; color:#94a3b8; margin-top:5px;">Scale k</div>
                </div>

                <div style="flex:1; background:#f0fdf4; border:2px solid #22c55e; border-radius:12px; padding:15px; display:flex; flex-direction:column;">
                    <div style="text-align:center; font-weight:bold; color:#16a34a; margin-bottom:10px; text-transform:uppercase; font-size:12px; letter-spacing:1px;">Scaled</div>
                    <div style="font-family:monospace; flex:1;">
                        ${scaledHtml}
                    </div>
                </div>
            </div>

            <div style="background:#f8fafc; padding:20px; border-radius:12px; border:1px solid #e2e8f0;">
                <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:15px; margin-bottom:20px;">
                    <div>
                        <label class="sim-label">Scale Factor (k)</label>
                        <input type="number" id="inp-k" class="sim-input" step="0.1" placeholder="?">
                    </div>
                    <div>
                        <label class="sim-label" style="color:#ef4444;">Solve y</label>
                        <input type="number" id="inp-y" class="sim-input" step="0.1" placeholder="Original">
                    </div>
                    <div>
                        <label class="sim-label" style="color:#2563eb;">Solve x</label>
                        <input type="number" id="inp-x" class="sim-input" step="0.1" placeholder="Scaled">
                    </div>
                </div>
                
                <div id="sim-feedback" style="text-align:center; min-height:20px; font-weight:bold; margin-bottom:10px; font-size:14px;"></div>

                <button onclick="checkSimilarityAnswer()" class="sim-btn">Submit Answers</button>
            </div>
        </div>
    `;
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
        feedback.style.color = "#ef4444";
        feedback.innerText = "Please fill in all three fields.";
        return;
    }

    const sol = similarityData.solution;
    
    // Validate (allow tiny float margin)
    const kOk = Math.abs(uk - sol.k) < 0.05;
    const xOk = Math.abs(ux - sol.x) < 0.05;
    const yOk = Math.abs(uy - sol.y) < 0.05;

    if (kOk && xOk && yOk) {
        // Correct
        feedback.style.color = "#16a34a";
        feedback.innerText = "Correct!";
        
        // Update Score (+1 per correct round)
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
        // Error handling
        feedback.style.color = "#ef4444";
        if (!kOk) feedback.innerText = "Check your Scale Factor (k). Compare the known matching sides.";
        else if (!yOk) feedback.innerText = "Check y. Remember: Original × k = Scaled.";
        else if (!xOk) feedback.innerText = "Check x. Remember: Original × k = Scaled.";
        
        // Minor penalty logic could go here, but usually we just block progress until correct
    }
};

async function finishSimilarityGame() {
    const qContent = document.getElementById('q-content');
    qContent.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:300px; animation: fadeIn 0.5s;">
            <div style="font-size:50px;">📐</div>
            <h2 style="color:#1e293b; margin:15px 0;">Similarity Module Complete!</h2>
            <p style="color:#64748b;">Good work calculating scale factors.</p>
        </div>
    `;

    setTimeout(() => {
        if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion();
    }, 2000);
}

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

// CSS Injection
const simStyle = document.createElement('style');
simStyle.innerHTML = `
    .sim-label { display:block; font-size:12px; font-weight:bold; color:#475569; margin-bottom:5px; text-transform:uppercase; }
    .sim-input { width:100%; height:40px; border-radius:8px; border:1px solid #cbd5e1; text-align:center; font-size:18px; font-family:monospace; color:#1e293b; outline:none; transition:0.2s; box-sizing:border-box; }
    .sim-input:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,0.1); }
    .sim-btn { width:100%; height:45px; background:#0f172a; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer; font-size:16px; transition:0.2s; }
    .sim-btn:hover { background:#1e293b; }
    @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
`;
document.head.appendChild(simStyle);
