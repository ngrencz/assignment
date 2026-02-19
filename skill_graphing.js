/**
 * skill_graphing.js
 * - Interactive Coordinate Plane.
 * - Generates CONVEX Triangles or Quadrilaterals (no crossed lines).
 * - Connects dots A->B->C->D automatically as found.
 * - Fills shape when complete.
 * - 4 Rounds.
 * - UPDATED: Numbered axes added to the grid.
 */

var graphData = {
    targetPoints: [], // The solution {x, y, label}
    foundPoints: [],  // Labels of points user has found ['A', 'C', ...]
    scale: 20,        // Pixels per grid unit
    range: 10         // Grid goes from -10 to +10
};

var graphRound = 1;
var totalGraphRounds = 4;

window.initGraphingGame = async function() {
    if (!document.getElementById('q-content')) return;

    window.isCurrentQActive = true;
    window.currentQSeconds = 0;
    graphRound = 1;

    // Initialize Mastery State
    if (!window.userMastery) window.userMastery = {};

    try {
        if (window.supabaseClient && window.currentUser) {
            const currentHour = sessionStorage.getItem('target_hour');
            const { data } = await window.supabaseClient
                .from('assignment')
                .select('Graphing')
                .eq('userName', window.currentUser)
                .eq('hour', currentHour) // Added hour constraint
                .maybeSingle();
            
            window.userMastery.Graphing = data?.Graphing || 0;
        }
    } catch (e) { 
        console.log("Supabase sync error, using local state"); 
    }

    startGraphingRound();
};

function startGraphingRound() {
    generateGraphProblem();
    renderGraphingUI();
}

function generateGraphProblem() {
    graphData.foundPoints = [];
    graphData.targetPoints = [];
    
    // 1. Generate Random Unique Points
    let numPoints = Math.random() > 0.5 ? 3 : 4;
    let tempPoints = [];
    
    while(tempPoints.length < numPoints) {
        let rx = Math.floor(Math.random() * 14) - 7; // Range -7 to 7
        let ry = Math.floor(Math.random() * 14) - 7;
        if (!tempPoints.some(p => p.x === rx && p.y === ry)) {
            tempPoints.push({ x: rx, y: ry });
        }
    }

    // 2. Sort Angularly to ensure Convex Shape (No crossed lines)
    // Find centroid
    let cx = tempPoints.reduce((s, p) => s + p.x, 0) / numPoints;
    let cy = tempPoints.reduce((s, p) => s + p.y, 0) / numPoints;

    // Sort by angle around centroid
    tempPoints.sort((a, b) => {
        return Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx);
    });

    // 3. Assign Labels A, B, C, D in order
    const labels = ['A', 'B', 'C', 'D'];
    graphData.targetPoints = tempPoints.map((p, i) => ({
        x: p.x,
        y: p.y,
        label: labels[i]
    }));
}

function renderGraphingUI() {
    const qContent = document.getElementById('q-content');
    if (!qContent) return;

    let pointsHtml = graphData.targetPoints.map(p => 
        `<div id="pt-${p.label}" style="background:#f1f5f9; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1; font-family:monospace; font-size:16px; transition:0.3s;">
            <strong>${p.label}:</strong> (${p.x}, ${p.y})
         </div>`
    ).join('');

    document.getElementById('q-title').innerText = `Graph the Shape (Round ${graphRound}/${totalGraphRounds})`;

    qContent.innerHTML = `
        <div style="display: flex; gap: 30px; flex-wrap: wrap; justify-content:center;">
            <div style="position:relative; background:white; padding:10px; border-radius:8px; border:1px solid #94a3b8; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                <canvas id="graphCanvas" width="400" height="400" style="cursor:crosshair;"></canvas>
                <div style="text-align:center; font-size:12px; color:#64748b; margin-top:5px;">Click the grid intersections</div>
            </div>

            <div style="flex:1; min-width:250px; display:flex; flex-direction:column; justify-content:center;">
                <h3 style="color:#1e293b; margin-bottom:10px;">Plot coordinates:</h3>
                <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:20px;">
                    ${pointsHtml}
                </div>
                <div id="graph-feedback" style="min-height:30px; color:#ef4444; font-weight:bold; font-size:14px;"></div>
                <div style="background:#f8fafc; padding:15px; border-radius:6px; font-size:13px; color:#475569; border:1px solid #e2e8f0;">
                    <strong>Tip:</strong> The shape connects automatically as you find neighbors (A connects to B, B to C).
                </div>
            </div>
        </div>
        <div id="flash-overlay" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(0,0,0,0.8); color:white; padding:20px 40px; border-radius:12px; font-size:24px; font-weight:bold; display:none; pointer-events:none; text-align:center; z-index:100;"></div>
    `;

    drawGrid();
    setupCanvasInteractions();
}

function drawGrid() {
    const canvas = document.getElementById('graphCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const scale = graphData.scale; 
    const center = w / 2; 

    // Clear
    ctx.clearRect(0, 0, w, h);
    
    // 1. Draw Grid
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#e2e8f0";
    ctx.beginPath();
    for (let i = 0; i <= w; i += scale) {
        ctx.moveTo(i, 0); ctx.lineTo(i, h);
        ctx.moveTo(0, i); ctx.lineTo(w, i);
    }
    ctx.stroke();

    // 2. Draw Axes
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#475569";
    ctx.beginPath();
    ctx.moveTo(center, 0); ctx.lineTo(center, h);
    ctx.moveTo(0, center); ctx.lineTo(w, center);
    ctx.stroke();

    // 2.5 Draw Axis Numbers
    ctx.fillStyle = "#64748b";
    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = -graphData.range; i <= graphData.range; i++) {
        if (i === 0) continue; // Skip the origin (0,0) to prevent center clutter
        
        // Draw every 2 units to prevent text overlapping
        if (i % 2 === 0) {
            // X-axis text (placed slightly below the line)
            ctx.fillText(i, center + (i * scale), center + 12);
            
            // Y-axis text (placed slightly left of the line)
            // Note: Standard math graphs have positive Y moving UP, 
            // but HTML Canvas coordinates have positive Y moving DOWN.
            ctx.fillText(i, center - 12, center - (i * scale));
        }
    }

    // 3. Draw Connections (The Shape Logic)
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#3b82f6";
    
    // Check if ALL found (for fill)
    const allFound = graphData.targetPoints.every(p => graphData.foundPoints.includes(p.label));
    
    if (allFound) {
        // Fill the shape if complete
        ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
        ctx.beginPath();
        const start = graphData.targetPoints[0];
        ctx.moveTo(center + start.x*scale, center - start.y*scale);
        for(let i=1; i<graphData.targetPoints.length; i++) {
            const p = graphData.targetPoints[i];
            ctx.lineTo(center + p.x*scale, center - p.y*scale);
        }
        ctx.closePath();
        ctx.fill();
    }

    // Draw individual segments
    ctx.beginPath();
    for (let i = 0; i < graphData.targetPoints.length; i++) {
        const current = graphData.targetPoints[i];
        const next = graphData.targetPoints[(i + 1) % graphData.targetPoints.length];

        // Draw line only if BOTH endpoints are found
        if (graphData.foundPoints.includes(current.label) && graphData.foundPoints.includes(next.label)) {
            ctx.moveTo(center + current.x*scale, center - current.y*scale);
            ctx.lineTo(center + next.x*scale, center - next.y*scale);
        }
    }
    ctx.stroke();

    // 4. Draw The Dots (Vertices)
    graphData.targetPoints.forEach(p => {
        // Only draw points the user has actually found
        if (graphData.foundPoints.includes(p.label)) {
            const px = center + (p.x * scale);
            const py = center - (p.y * scale);
            
            ctx.beginPath();
            ctx.arc(px, py, 6, 0, Math.PI * 2);
            ctx.fillStyle = "#2563eb"; // Found = Blue
            ctx.fill();
            
            // Label
            ctx.fillStyle = "#000";
            ctx.font = "bold 14px Arial";
            ctx.fillText(p.label, px + 10, py - 10);
        }
    });
}

function setupCanvasInteractions() {
    const canvas = document.getElementById('graphCanvas');
    
    canvas.onclick = (e) => {
        // If done, ignore
        if (graphData.foundPoints.length === graphData.targetPoints.length) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate grid coordinates based on click
        let gridX = Math.round((mouseX - 200) / 20);
        let gridY = Math.round((200 - mouseY) / 20);

        // Find which target point was clicked
        const match = graphData.targetPoints.find(p => p.x === gridX && p.y === gridY);
        const feedback = document.getElementById('graph-feedback');

        if (match) {
            if (graphData.foundPoints.includes(match.label)) {
                feedback.innerText = "Already found that one!";
                return;
            }

            // Success: Add label to found list
            graphData.foundPoints.push(match.label);
            
            // Visual Update
            const item = document.getElementById(`pt-${match.label}`);
            if(item) {
                item.style.background = "#dcfce7";
                item.style.borderColor = "#22c55e";
            }
            feedback.innerText = "";
            
            drawGrid(); // Redraw grid (lines appear now)

            // Win Check
            if (graphData.foundPoints.length === graphData.targetPoints.length) {
                handleRoundWin();
            }

        } else {
            feedback.innerText = `Missed! You clicked (${gridX}, ${gridY})`;
        }
    };
}

async function handleRoundWin() {
    showFlash("Nice Shape!", "success");
    
    let current = window.userMastery.Graphing || 0;
    let nextScore = Math.min(10, current + 1);
    window.userMastery.Graphing = nextScore;

    if (window.supabaseClient && window.currentUser) {
        try {
            const currentHour = sessionStorage.getItem('target_hour') || "00";
            await window.supabaseClient
                .from('assignment')
                .update({ Graphing: nextScore })
                .eq('userName', window.currentUser)
                .eq('hour', currentHour);
        } catch (e) { 
            console.error("DB Save Fail", e); 
        }
    }

    graphRound++;
    setTimeout(() => {
        if (graphRound > totalGraphRounds) finishGraphingGame();
        else startGraphingRound();
    }, 1500);
}

function finishGraphingGame() {
    window.isCurrentQActive = false;
    document.getElementById('q-content').innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:400px; text-align:center;">
            <div style="font-size:60px; margin-bottom:10px;">📉</div>
            <h2 style="color:#1e293b;">Graphing Completed!</h2>
            <p style="color:#64748b;">Loading next skill...</p>
        </div>
    `;
    setTimeout(() => {
        if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion();
    }, 2500);
}

function showFlash(msg, type) {
    const overlay = document.getElementById('flash-overlay');
    if (!overlay) return;
    overlay.innerText = msg;
    overlay.style.display = 'block';
    overlay.style.backgroundColor = type === 'success' ? 'rgba(34, 197, 94, 0.95)' : 'rgba(239, 68, 68, 0.95)';
    setTimeout(() => { overlay.style.display = 'none'; }, 1500);
}
