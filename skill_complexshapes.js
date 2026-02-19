/**
 * skill_complexshapes.js
 * - 7th/8th Grade Deductive Reasoning Version.
 * - FIXED: All slant lengths and internal heights/radii are explicitly labeled.
 * - FIXED: Labels are offset with background "halos" to prevent overlapping.
 * - LOGIC: Deductive reasoning required for horizontal/vertical rectangle edges.
 * - VERSION: 1.7 - Guaranteed Labels & Logging
 */

var complexData = {
    components: [],
    totalArea: 0,
    totalPerimeter: 0,
    unit: 'units',
};

window.initComplexShapesGame = async function() {
    // Log reference kept for version tracking
    if (typeof log === 'function') {
        log("🚀 Complex Shapes: v1.7 - Full Label Logic & Deduction Active");
    }

    if (!document.getElementById('q-content')) return;

    window.isCurrentQActive = true;
    if (!window.userMastery) window.userMastery = {};

    try {
        if (window.supabaseClient && window.currentUser) {
            const h = sessionStorage.getItem('target_hour') || "00";
            const { data } = await window.supabaseClient
                .from('assignment')
                .select('ComplexShapes')
                .eq('userName', window.currentUser)
                .eq('hour', h)
                .maybeSingle();
            
            window.userMastery.ComplexShapes = data?.ComplexShapes || 0;
        }
    } catch (e) {
        console.log("Supabase sync error", e);
    }
    
    startComplexRound();
};

function startComplexRound() {
    generateComplexProblem();
    renderComplexUI();
}

function generateComplexProblem() {
    const units = ['ft', 'in', 'cm', 'm', 'units'];
    complexData.unit = units[Math.floor(Math.random() * units.length)];
    complexData.components = [];
    
    // 1. Foundation Rectangle (Deductive Base)
    let baseW = Math.floor(Math.random() * 30) + 50;
    let baseH = Math.floor(Math.random() * 30) + 40;
    
    complexData.components.push({
        type: 'rectangle',
        w: baseW, h: baseH, x: 80, y: 100,
        area: baseW * baseH,
        hintA: `Rectangle Area = width × height (${baseW} × ${baseH})`,
        hintP: `Deduction: If the top is ${baseW}, the bottom must also be ${baseW}.`
    });

    // 2. Add Attachment with explicit dimensions
    let typePool = ['triangle', 'semicircle', 'trapezoid'];
    let type = typePool[Math.floor(Math.random() * typePool.length)];
    let attachX = 80 + baseW;

    if (type === 'triangle') {
        let triH = Math.floor(Math.random() * 25) + 30;
        let slantValue = Math.sqrt(Math.pow(baseH/2, 2) + Math.pow(triH, 2)).toFixed(1);
        
        complexData.components.push({
            type: 'triangle', base: baseH, height: triH, x: attachX, y: 100,
            slantLabel: slantValue,
            area: 0.5 * baseH * triH,
            hintA: `Triangle Area = ½ × base (${baseH}) × height (${triH})`,
            hintP: `The two exterior slants are both ${slantValue} ${complexData.unit}.`
        });
        complexData.totalArea = (baseW * baseH) + (0.5 * baseH * triH);
        complexData.totalPerimeter = (baseW * 2) + (parseFloat(slantValue) * 2);

    } else if (type === 'semicircle') {
        let r = baseH / 2;
        let arcValue = (Math.PI * r).toFixed(1);
        
        complexData.components.push({
            type: 'semicircle', r: r, x: attachX, y: 100 + r,
            arcLabel: arcValue,
            area: (Math.PI * Math.pow(r, 2)) / 2,
            hintA: `Semicircle Area = (π × r²) / 2`,
            hintP: `The curved boundary is ${arcValue} ${complexData.unit}.`
        });
        complexData.totalArea = (baseW * baseH) + ((Math.PI * Math.pow(r, 2)) / 2);
        complexData.totalPerimeter = (baseW * 2) + baseH + parseFloat(arcValue);

    } else if (type === 'trapezoid') {
        let topB = Math.floor(baseH * 0.6);
        let trapW = Math.floor(Math.random() * 20) + 25;
        let diff = baseH - topB;
        let slantValue = Math.sqrt(Math.pow(trapW, 2) + Math.pow(diff, 2)).toFixed(1);

        complexData.components.push({
            type: 'trapezoid', b1: baseH, b2: topB, h: trapW, x: attachX, y: 100,
            slantLabel: slantValue,
            area: 0.5 * (baseH + topB) * trapW,
            hintA: `Trapezoid Area = ½(base1 + base2) × height`,
            hintP: `Exterior sides: Top (${trapW}), Right (${topB}), and Slant (${slantValue}).`
        });
        complexData.totalArea = (baseW * baseH) + (0.5 * (baseH + topB) * trapW);
        complexData.totalPerimeter = (baseW * 2) + topB + trapW + parseFloat(slantValue);
    }
}

function renderComplexUI() {
    const qContent = document.getElementById('q-content');
    if (!qContent) return;

    qContent.innerHTML = `
        <div style="max-width:650px; margin:0 auto; font-family: sans-serif;">
            <div style="text-align:center; margin-bottom:8px; color:#64748b; font-weight:bold; font-size:14px;">
                Composite Figure: Area & Perimeter
            </div>
            
            <div style="background: white; padding: 10px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 12px; text-align: center; position: relative; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);">
                <canvas id="complexCanvas" width="550" height="280" style="max-width:100%; height:auto; cursor:help;"></canvas>
                <div id="hint-bubble" style="position: absolute; display: none; background: #1e293b; color: white; padding: 10px; border-radius: 6px; font-size: 12px; z-index: 50; pointer-events:none; text-align:left; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>
            </div>

            <div style="background:#f8fafc; padding:12px 18px; border-radius:12px; border:1px solid #e2e8f0; display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                <div style="background:white; padding:10px; border-radius:8px; border-left:4px solid #3b82f6; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                    <label class="comp-label" style="color:#3b82f6;">TOTAL AREA</label>
                    <div style="display:flex; gap:5px; margin-top:4px;">
                        <input type="number" id="ans-area-val" step="0.1" class="comp-input" placeholder="0.0">
                        <select id="ans-area-unit" class="comp-select">
                            <option value="">Unit</option>
                            <option value="linear">${complexData.unit}</option>
                            <option value="square">${complexData.unit}²</option>
                        </select>
                    </div>
                </div>

                <div style="background:white; padding:10px; border-radius:8px; border-left:4px solid #10b981; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                    <label class="comp-label" style="color:#10b981;">TOTAL PERIMETER</label>
                    <div style="display:flex; gap:5px; margin-top:4px;">
                        <input type="number" id="ans-perim-val" step="0.1" class="comp-input" placeholder="0.0">
                        <select id="ans-perim-unit" class="comp-select">
                            <option value="">Unit</option>
                            <option value="linear">${complexData.unit}</option>
                            <option value="square">${complexData.unit}²</option>
                        </select>
                    </div>
                </div>

                <div style="grid-column: span 2; text-align: center; margin-top:5px;">
                    <button onclick="checkComplexWin()" class="comp-btn">Submit Final Answers</button>
                </div>
            </div>
        </div>
        <div id="flash-overlay" style="position:fixed; top:20px; left:50%; transform:translateX(-50%); padding:12px 25px; border-radius:8px; color:white; font-weight:bold; display:none; z-index:1000; box-shadow: 0 4px 12px rgba(0,0,0,0.2);"></div>
    `;

    setTimeout(drawComplex, 50);
}

function drawComplex() {
    const canvas = document.getElementById('complexCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const u = complexData.unit;
    ctx.clearRect(0, 0, 550, 280);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#334155";
    ctx.font = "bold 13px Arial";

    function drawLabel(text, x, y, color = "#1e293b", isInternal = false) {
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        let w = ctx.measureText(text).width;
        ctx.fillRect(x - w/2 - 4, y - 11, w + 8, 15); 
        ctx.fillStyle = isInternal ? "#64748b" : color;
        ctx.textAlign = "center";
        ctx.fillText(text, x, y);
    }

    complexData.components.forEach(p => {
        ctx.fillStyle = "#f1f5f9";
        ctx.beginPath();
        if (p.type === 'rectangle') {
            ctx.rect(p.x, p.y, p.w, p.h);
            ctx.fill(); ctx.stroke();
            drawLabel(`${p.w} ${u}`, p.x + p.w/2, p.y - 12); 
            drawLabel(`${p.h} ${u}`, p.x - 45, p.y + p.h/2 + 5); 
        } else if (p.type === 'triangle') {
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + p.height, p.y + p.base/2);
            ctx.lineTo(p.x, p.y + p.base);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
            drawLabel(`${p.slantLabel} ${u}`, p.x + p.height/2 + 45, p.y + p.base/4 - 10); 
            drawLabel(`${p.slantLabel} ${u}`, p.x + p.height/2 + 45, p.y + (p.base*0.75) + 20);
            drawLabel(`h: ${p.height} ${u}`, p.x + 35, p.y + p.base/2 + 5, "#64748b", true);
        } else if (p.type === 'semicircle') {
            ctx.arc(p.x, p.y, p.r, -Math.PI/2, Math.PI/2);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
            drawLabel(`${p.arcLabel} ${u}`, p.x + p.r + 45, p.y + 5);
            drawLabel(`r: ${p.r} ${u}`, p.x + p.r/2, p.y + 5, "#64748b", true);
        } else if (p.type === 'trapezoid') {
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + p.h, p.y);
            ctx.lineTo(p.x + p.h, p.y + p.b2);
            ctx.lineTo(p.x, p.y + p.b1);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
            drawLabel(`${p.h} ${u}`, p.x + p.h/2, p.y - 12); 
            drawLabel(`${p.b2} ${u}`, p.x + p.h + 40, p.y + p.b2/2 + 5); 
            drawLabel(`${p.slantLabel} ${u}`, p.x + p.h/2 - 30, p.y + p.b1 + 25);
        }
    });

    canvas.onclick = (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
        const my = (e.clientY - rect.top) * (canvas.height / rect.height);
        const bubble = document.getElementById('hint-bubble');
        
        let part = complexData.components.find(p => mx > p.x - 20 && mx < p.x + 180 && my > p.y - 20 && my < p.y + 180);
        if (part) {
            bubble.innerHTML = `<strong>Formula Help:</strong><br>${part.hintA}<br>${part.hintP}`;
            bubble.style.left = `${mx + 10}px`;
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

    if (isNaN(aVal) || isNaN(pVal)) {
        showFlash("Please enter numeric values.", "error");
        return;
    }

    const areaOK = (Math.abs(aVal - complexData.totalArea) < 2.5) && (aUnit === 'square');
    const perimOK = (Math.abs(pVal - complexData.totalPerimeter) < 2.5) && (pUnit === 'linear');

    if (areaOK && perimOK) {
        let newVal = Math.min(10, (window.userMastery.ComplexShapes || 0) + 1);
        window.userMastery.ComplexShapes = newVal;
        if (window.supabaseClient && window.currentUser) {
            const h = sessionStorage.getItem('target_hour') || "00";
            await window.supabaseClient.from('assignment').update({ ComplexShapes: newVal }).eq('userName', window.currentUser).eq('hour', h);
        }
        showFlash("✅ Correct! Mastery updated.", "success");
        setTimeout(() => finishComplex(), 1500);
    } else {
        let msg = !areaOK ? "Check Area calculation or units." : "Check Perimeter calculation or units.";
        if (aUnit !== 'square' && !areaOK) msg = "Area requires square units!";
        if (pUnit !== 'linear' && !perimOK) msg = "Perimeter requires linear units!";
        showFlash(msg, "error");
    }
};

function finishComplex() {
    document.getElementById('q-content').innerHTML = `
        <div style="text-align:center; padding:50px; animation: fadeIn 0.5s;">
            <div style="font-size:50px; margin-bottom:10px;">🏆</div>
            <h2 style="color:#1e293b;">Composite Shape Mastered!</h2>
        </div>
    `;
    setTimeout(() => { if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion(); }, 2000);
}

function showFlash(msg, type) {
    const o = document.getElementById('flash-overlay');
    o.innerText = msg;
    o.style.display = 'block';
    o.style.backgroundColor = type === 'success' ? '#10b981' : '#ef4444';
    setTimeout(() => { o.style.display = 'none'; }, 2500);
}

const compStyles = document.createElement('style');
compStyles.innerHTML = `
    .comp-label { font-weight:bold; font-size:10px; letter-spacing:1px; margin-bottom: 2px; display:block; }
    .comp-input { flex:2; height:38px; border-radius:6px; border:1px solid #cbd5e1; text-align:center; font-size:16px; outline:none; }
    .comp-select { flex:1.2; height:38px; border-radius:6px; border:1px solid #cbd5e1; font-size:12px; cursor:pointer; }
    .comp-btn { width:220px; height:46px; background:#1e293b; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer; font-size: 15px; transition: 0.2s; }
    .comp-btn:hover { background: #334155; transform: translateY(-1px); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
`;
document.head.appendChild(compStyles);
