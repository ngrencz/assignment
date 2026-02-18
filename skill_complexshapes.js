/**
 * skill_complexshapes.js - Single Round Series Version
 * - Generates complex composite figures from random combinations.
 * - Requires both Area and Perimeter to be correct.
 * - Uses window.userMastery for consistency with other files.
 */

var complexData = {
    components: [],
    totalArea: 0,
    totalPerimeter: 0,
    unit: 'units',
};

window.initComplexShapesGame = async function() {
    if (!document.getElementById('q-content')) return;

    window.isCurrentQActive = true;
    window.currentQSeconds = 0;

    // Consistency Fix: Use the same variable name as the Box Plot game
    if (!window.userMastery) window.userMastery = {};

    try {
        if (window.supabaseClient && window.currentUser) {
            const currentHour = sessionStorage.getItem('target_hour');
            
            const { data } = await window.supabaseClient
                .from('assignment')
                .select('ComplexShapes')
                .eq('userName', window.currentUser)
                .eq('hour', currentHour)
                .maybeSingle();
            
            window.userMastery.ComplexShapes = data?.ComplexShapes || 0;
        }
    } catch (e) {
        console.log("Supabase sync error, using local state");
    }
    
    startComplexRound();
};

function startComplexRound() {
    generateComplexProblem();
    renderComplexUI();
}

function generateComplexProblem() {
    const units = ['ft', 'in', 'cm', 'mm', 'm', 'mi', 'km', 'units'];
    complexData.unit = units[Math.floor(Math.random() * units.length)];
    complexData.components = [];
    
    // 1. Foundation Shape (Rectangle or Square)
    let isSquare = Math.random() > 0.7;
    let baseW = Math.floor(Math.random() * 100) + 50;
    let baseH = isSquare ? baseW : Math.floor(Math.random() * 60) + 40;
    
    complexData.components.push({
        type: isSquare ? 'square' : 'rectangle',
        w: baseW, h: baseH, x: 100, y: 130,
        area: baseW * baseH,
        hintA: isSquare ? `Area of Square = s² (${baseW} × ${baseW})` : `Area of Rectangle = L × W (${baseW} × ${baseH})`,
        hintP: `Perimeter is the sum of all OUTER edges.`
    });

    // 2. Add an attachment (Triangle, Semicircle, or Trapezoid)
    let typePool = ['triangle', 'semicircle', 'trapezoid'];
    let type = typePool[Math.floor(Math.random() * typePool.length)];
    let attachX = 100 + baseW;
    let attachY = 130;

    if (type === 'triangle') {
        let triH = Math.floor(Math.random() * 50) + 30;
        let hyp = Math.sqrt(Math.pow(baseH, 2) + Math.pow(triH, 2));
        
        complexData.components.push({
            type: 'triangle', base: baseH, height: triH, x: attachX, y: attachY,
            area: 0.5 * baseH * triH,
            hintA: `Area of Triangle = ½ × b × h (½ × ${baseH} × ${triH})`,
            hintP: `Slanted edge (hypotenuse) ≈ ${hyp.toFixed(1)}`
        });
        complexData.totalArea = (baseW * baseH) + (0.5 * baseH * triH);
        complexData.totalPerimeter = (baseW * 2) + triH + hyp;

    } else if (type === 'semicircle') {
        let r = baseH / 2;
        let arc = Math.PI * r;
        
        complexData.components.push({
            type: 'semicircle', r: r, x: attachX, y: attachY + r,
            area: (Math.PI * Math.pow(r, 2)) / 2,
            hintA: `Area of Semicircle = (π × r²) / 2 (r = ${r})`,
            hintP: `Curved edge = π × r ≈ ${arc.toFixed(1)}`
        });
        complexData.totalArea = (baseW * baseH) + ((Math.PI * Math.pow(r, 2)) / 2);
        complexData.totalPerimeter = (baseW * 2) + baseH + arc;

    } else if (type === 'trapezoid') {
        let topB = Math.floor(baseH * 0.6);
        let trapW = Math.floor(Math.random() * 40) + 20;
        // Simplified area for right-trapezoid attached to side
        complexData.components.push({
            type: 'trapezoid', b1: baseH, b2: topB, h: trapW, x: attachX, y: attachY,
            area: 0.5 * (baseH + topB) * trapW,
            hintA: `Area of Trapezoid = ½(b1 + b2) × h`,
            hintP: `Sum all exterior sides. Don't count the shared middle wall!`
        });
        let slant = Math.sqrt(Math.pow(trapW, 2) + Math.pow(baseH - topB, 2));
        complexData.totalArea = (baseW * baseH) + (0.5 * (baseH + topB) * trapW);
        complexData.totalPerimeter = (baseW * 2) + topB + trapW + slant;
    }
}

function renderComplexUI() {
    const qContent = document.getElementById('q-content');
    if (!qContent) return;

    document.getElementById('q-title').innerText = `Complex Shapes: Area & Perimeter`;

    qContent.innerHTML = `
        <div style="display: flex; gap: 20px; flex-wrap: wrap; position: relative;">
            <div style="background: white; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1;">
                <canvas id="complexCanvas" width="480" height="380" style="cursor: help;"></canvas>
                <div id="hint-bubble" style="position: absolute; display: none; background: #1e293b; color: white; padding: 10px; border-radius: 6px; font-size: 13px; z-index: 50; pointer-events:none; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>
                <p style="font-size: 11px; color: #64748b; text-align: center; margin-top: 5px;">Click a shape for hints!</p>
            </div>

            <div style="flex: 1; min-width: 280px; background: #f8fafc; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0;">
                <h3 style="margin: 0 0 10px 0; color: #1e293b;">Final Totals</h3>
                <p style="font-size: 13px; margin-bottom: 15px;">Units must match the property (Linear vs Square).</p>

                <div style="background: white; padding: 12px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #3b82f6; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <label style="font-weight:bold; font-size:11px; color:#3b82f6; letter-spacing:1px;">PART A: TOTAL AREA</label>
                    <div style="display:flex; gap:5px; margin-top:5px;">
                        <input type="number" id="ans-area-val" placeholder="0.0" step="0.1" style="flex:2; height:38px; border-radius:4px; border:1px solid #cbd5e1; text-align:center; font-size:16px;">
                        <select id="ans-area-unit" style="flex:1.2; height:38px; border-radius:4px; border:1px solid #cbd5e1; font-size:13px;">
                            <option value="">Unit</option>
                            <option value="linear">${complexData.unit}</option>
                            <option value="square">${complexData.unit}²</option>
                        </select>
                    </div>
                </div>

                <div style="background: white; padding: 12px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <label style="font-weight:bold; font-size:11px; color:#10b981; letter-spacing:1px;">PART B: PERIMETER</label>
                    <div style="display:flex; gap:5px; margin-top:5px;">
                        <input type="number" id="ans-perim-val" placeholder="0.0" step="0.1" style="flex:2; height:38px; border-radius:4px; border:1px solid #cbd5e1; text-align:center; font-size:16px;">
                        <select id="ans-perim-unit" style="flex:1.2; height:38px; border-radius:4px; border:1px solid #cbd5e1; font-size:13px;">
                            <option value="">Unit</option>
                            <option value="linear">${complexData.unit}</option>
                            <option value="square">${complexData.unit}²</option>
                        </select>
                    </div>
                </div>

                <button onclick="checkComplexWin()" style="width:100%; height:50px; background:#1e293b; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer; transition: background 0.2s;">SUBMIT FINAL ANSWERS</button>
            </div>
        </div>
        <div id="flash-overlay" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(0,0,0,0.8); color:white; padding:20px 40px; border-radius:12px; font-size:20px; font-weight:bold; display:none; pointer-events:none; text-align:center; z-index:100;"></div>
    `;

    drawComplex();
}

function drawComplex() {
    const canvas = document.getElementById('complexCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 480, 380);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#334155";
    ctx.fillStyle = "#f1f5f9";

    complexData.components.forEach(p => {
        ctx.beginPath();
        if (p.type === 'rectangle' || p.type === 'square') {
            ctx.rect(p.x, p.y, p.w, p.h);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = "#000";
            ctx.font = "bold 13px Arial";
            ctx.fillText(`${p.w} ${complexData.unit}`, p.x + p.w/2 - 15, p.y - 12);
            ctx.fillText(`${p.h} ${complexData.unit}`, p.x - 55, p.y + p.h/2);
        } else if (p.type === 'triangle') {
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + p.height, p.y + p.base/2);
            ctx.lineTo(p.x, p.y + p.base);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = "#475569";
            ctx.fillText(`h: ${p.height}`, p.x + 10, p.y + p.base/2 + 5);
        } else if (p.type === 'semicircle') {
            ctx.arc(p.x, p.y, p.r, -Math.PI/2, Math.PI/2);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = "#475569";
            ctx.fillText(`r: ${p.r}`, p.x + 5, p.y + 5);
        } else if (p.type === 'trapezoid') {
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + p.h, p.y);
            ctx.lineTo(p.x + p.h, p.y + p.b2);
            ctx.lineTo(p.x, p.y + p.b1);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = "#000";
            ctx.fillText(`b2: ${p.b2}`, p.x + p.h + 5, p.y + p.b2/2);
            ctx.fillText(`h: ${p.h}`, p.x + p.h/2 - 10, p.y - 10);
        }
        ctx.fillStyle = "#f1f5f9";
    });

    canvas.onclick = (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const bubble = document.getElementById('hint-bubble');
        
        let part = complexData.components.find(p => mx > p.x - 20 && mx < p.x + 150 && my > p.y - 20 && my < p.y + 120);
        
        if (part) {
            bubble.innerHTML = `<strong>Formula:</strong><br>${part.hintA}<br>${part.hintP}`;
            bubble.style.left = `${mx + 15}px`;
            bubble.style.top = `${my - 40}px`;
            bubble.style.display = 'block';
            setTimeout(() => { bubble.style.display = 'none'; }, 4000);
        }
    };
}

window.checkComplexWin = async function() {
    const aVal = parseFloat(document.getElementById('ans-area-val').value);
    const aUnit = document.getElementById('ans-area-unit').value;
    const pVal = parseFloat(document.getElementById('ans-perim-val').value);
    const pUnit = document.getElementById('ans-perim-unit').value;

    // Tolerance check for PI and rounding
    const areaOK = (Math.abs(aVal - complexData.totalArea) < 2.5) && (aUnit === 'square');
    const perimOK = (Math.abs(pVal - complexData.totalPerimeter) < 2.5) && (pUnit === 'linear');

    if (areaOK && perimOK) {
        // Consistency Fix: Update userMastery
        let newVal = Math.min(10, (window.userMastery.ComplexShapes || 0) + 1);
        window.userMastery.ComplexShapes = newVal;

        if (window.supabaseClient && window.currentUser) {
            const currentHour = sessionStorage.getItem('target_hour') || "00";
            // Ensure you have a 'ComplexShapes' column in your Supabase 'assignment' table!
            await window.supabaseClient
                .from('assignment')
                .update({ ComplexShapes: newVal })
                .eq('userName', window.currentUser)
                .eq('hour', currentHour);
        }

        showFlash("Great Job! Area and Perimeter mastered.", "success");
        setTimeout(() => finishComplex(), 1800);
    } else {
        let msg = "";
        if (!areaOK && !perimOK) msg = "Both values need double-checking.";
        else if (!areaOK) msg = (aUnit !== 'square') ? "Area needs square units!" : "Area value is incorrect.";
        else msg = (pUnit !== 'linear') ? "Perimeter needs linear units!" : "Perimeter value is incorrect.";
        
        showFlash(msg, "error");
    }
};

function finishComplex() {
    window.isCurrentQActive = false;
    document.getElementById('q-content').innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:400px; text-align:center;">
            <div style="font-size:70px; margin-bottom:10px;">🏆</div>
            <h2 style="color:#1e293b; margin-bottom:5px;">Composite Shape Mastered</h2>
            <p style="color:#64748b;">Loading your next challenge...</p>
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
    overlay.style.backgroundColor = type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)';
    setTimeout(() => { overlay.style.display = 'none'; }, 2500);
}
