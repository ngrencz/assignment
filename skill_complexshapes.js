/**
 * skill_complexshapes.js
 * - Grade Level: 7th/8th
 * - VERSION: 2.1
 * - FIXED: Perimeter logic bug (left wall was missing for Tri/Trap).
 * - FIXED: Number inputs now accept commas (e.g., 1,234.5).
 * - FIXED: Hints no longer give away calculated numbers or redundant side lengths.
 */

var complexData = {
    components: [],
    totalArea: 0,
    totalPerimeter: 0,
    unit: 'units',
};

window.initComplexShapesGame = async function() {
    if (typeof log === 'function') {
        log("🚀 Complex Shapes: v2.1 - Commas Allowed & Logic Fixed");
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
    const units = ['ft', 'in', 'cm', 'm', 'yds'];
    complexData.unit = units[Math.floor(Math.random() * units.length)];
    complexData.components = [];
    
    let baseW = Math.floor(Math.random() * 60) + 140;
    let baseH = Math.floor(Math.random() * 60) + 120;
    
    // Component 1: Rectangle data
    let rectComp = {
        type: 'rectangle',
        w: baseW, h: baseH, 
        area: baseW * baseH,
        hintA: `Area = base × height`,
        hintP: `Remember: The bottom edge matches the top edge.`
    };

    let attachComp = {};
    let totalWidth = baseW;

    let typePool = ['triangle', 'semicircle', 'trapezoid'];
    let type = typePool[Math.floor(Math.random() * typePool.length)];

    if (type === 'triangle') {
        let triH = Math.floor(Math.random() * 40) + 60; 
        let slantValue = Math.sqrt(Math.pow(baseH/2, 2) + Math.pow(triH, 2)).toFixed(1);
        
        attachComp = {
            type: 'triangle', base: baseH, height: triH,
            slantLabel: slantValue,
            area: 0.5 * baseH * triH,
            hintA: `Area = ½ × base × height`,
            hintP: `Perimeter: Only add up the outer boundaries.`
        };
        complexData.totalArea = (baseW * baseH) + (0.5 * baseH * triH);
        // FIXED: Added baseH (left wall) to perimeter
        complexData.totalPerimeter = (baseW * 2) + baseH + (parseFloat(slantValue) * 2);
        totalWidth += triH;

    } else if (type === 'semicircle') {
        let r = baseH / 2;
        let arcValue = 3.14 * r; 
        
        attachComp = {
            type: 'semicircle', r: r,
            area: (3.14 * Math.pow(r, 2)) / 2,
            hintA: `Area = (3.14 × r²) / 2`,
            hintP: `Curved Boundary = 3.14 × r`
        };
        complexData.totalArea = (baseW * baseH) + ((3.14 * Math.pow(r, 2)) / 2);
        complexData.totalPerimeter = (baseW * 2) + baseH + arcValue;
        totalWidth += r;

    } else if (type === 'trapezoid') {
        let topB = Math.floor(baseH * 0.5); 
        let trapW = Math.floor(Math.random() * 40) + 50; 
        let diff = (baseH - topB) / 2; 
        let slantValue = Math.sqrt(Math.pow(trapW, 2) + Math.pow(diff, 2)).toFixed(1);

        attachComp = {
            type: 'trapezoid', b1: baseH, b2: topB, h: trapW,
            slantLabel: slantValue,
            area: 0.5 * (baseH + topB) * trapW,
            hintA: `Area = ½ × (base 1 + base 2) × height`,
            hintP: `Perimeter: Only add up the outer boundaries.`
        };
        complexData.totalArea = (baseW * baseH) + (0.5 * (baseH + topB) * trapW);
        // FIXED: Added baseH (left wall) to perimeter
        complexData.totalPerimeter = (baseW * 2) + baseH + topB + (parseFloat(slantValue) * 2);
        totalWidth += trapW;
    }

    const canvasW = 550;
    const canvasH = 300;
    let startX = (canvasW - totalWidth) / 2;
    let startY = (canvasH - baseH) / 2;

    rectComp.x = startX;
    rectComp.y = startY;
    attachComp.x = startX + baseW;
    attachComp.y = startY; 

    complexData.components.push(rectComp);
    complexData.components.push(attachComp);
}

function renderComplexUI() {
    const qContent = document.getElementById('q-content');
    if (!qContent) return;

    // Notice type="text" on inputs to allow commas
    qContent.innerHTML = `
        <div style="max-width:650px; margin:0 auto; font-family: sans-serif;">
            <div style="text-align:center; margin-bottom:8px; color:#64748b; font-weight:bold; font-size:14px;">
                Composite Figure: Area & Perimeter
            </div>
            
            <div style="background: white; padding: 10px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 12px; text-align: center; position: relative; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);">
                <canvas id="complexCanvas" width="550" height="300" style="max-width:100%; height:auto; cursor:help;"></canvas>
                <div id="hint-bubble" style="position: absolute; display: none; background: #1e293b; color: white; padding: 10px; border-radius: 6px; font-size: 14px; z-index: 50; pointer-events:none; text-align:left; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>
            </div>

            <div style="background:#f8fafc; padding:12px 18px; border-radius:12px; border:1px solid #e2e8f0; display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                <div style="background:white; padding:10px; border-radius:8px; border-left:4px solid #3b82f6; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                    <label class="comp-label" style="color:#3b82f6;">TOTAL AREA</label>
                    <div style="display:flex; gap:5px; margin-top:4px;">
                        <input type="text" id="ans-area-val" class="comp-input" placeholder="0.0">
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
                        <input type="text" id="ans-perim-val" class="comp-input" placeholder="0.0">
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
    ctx.clearRect(0, 0, 550, 300);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#334155";

    function drawLabel(text, x, y, color = "#1e293b", isInternal = false) {
        ctx.save();
        ctx.font = "bold 14px Arial";
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        let w = ctx.measureText(text).width;
        ctx.fillRect(x - w/2 - 5, y - 12, w + 10, 18); 
        ctx.fillStyle = isInternal ? "#64748b" : color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, x, y);
        ctx.restore();
    }

    function drawDashedLine(x1, y1, x2, y2) {
        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([6, 6]); 
        ctx.strokeStyle = "#94a3b8";
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
    }

    complexData.components.forEach(p => {
        ctx.fillStyle = "#f1f5f9";
        ctx.beginPath();
        
        if (p.type === 'rectangle') {
            ctx.rect(p.x, p.y, p.w, p.h);
            ctx.fill(); ctx.stroke();
            drawLabel(`${p.w} ${u}`, p.x + p.w/2, p.y - 15); 
            drawLabel(`${p.h} ${u}`, p.x - 45, p.y + p.h/2); 
        } 
        else if (p.type === 'triangle') {
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + p.height, p.y + p.base/2); 
            ctx.lineTo(p.x, p.y + p.base); 
            ctx.closePath();
            ctx.fill(); ctx.stroke();
            
            drawDashedLine(p.x, p.y + p.base/2, p.x + p.height, p.y + p.base/2);

            drawLabel(`${p.slantLabel}`, p.x + p.height/2 + 10, p.y + p.base*0.25 - 20); 
            drawLabel(`${p.slantLabel}`, p.x + p.height/2 + 10, p.y + p.base*0.75 + 20); 
            drawLabel(`h: ${p.height} ${u}`, p.x + p.height/2, p.y + p.base/2 - 15, "#64748b", true);
        } 
        else if (p.type === 'semicircle') {
            let cy = p.y + p.r; 
            ctx.arc(p.x, cy, p.r, -Math.PI/2, Math.PI/2);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
            
            drawDashedLine(p.x, cy, p.x + p.r, cy);
            drawLabel(`r: ${p.r} ${u}`, p.x + p.r/2, cy - 15, "#64748b", true);
        } 
        else if (p.type === 'trapezoid') {
            let vOffset = (p.b1 - p.b2) / 2; 
            
            ctx.moveTo(p.x, p.y); 
            ctx.lineTo(p.x + p.h, p.y + vOffset); 
            ctx.lineTo(p.x + p.h, p.y + vOffset + p.b2); 
            ctx.lineTo(p.x, p.y + p.b1); 
            ctx.closePath();
            ctx.fill(); ctx.stroke();
            
            let midY = p.y + p.b1/2;
            drawDashedLine(p.x, midY, p.x + p.h, midY);

            drawLabel(`${p.b2} ${u}`, p.x + p.h + 45, midY); 
            drawLabel(`${p.slantLabel}`, p.x + p.h/2, p.y - 15); 
            drawLabel(`${p.slantLabel}`, p.x + p.h/2, p.y + p.b1 + 25); 
            drawLabel(`h: ${p.h} ${u}`, p.x + p.h/2, midY - 15, "#64748b", true);
        }
    });

    canvas.onclick = (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
        const my = (e.clientY - rect.top) * (canvas.height / rect.height);
        const bubble = document.getElementById('hint-bubble');
        
        if (mx > complexData.components[0].x && mx < complexData.components[0].x + 400 && 
            my > complexData.components[0].y && my < complexData.components[0].y + 300) {
            
            let part = complexData.components.find(p => {
               if(p.type === 'rectangle') return mx >= p.x && mx <= p.x + p.w;
               return mx > p.x; 
            });
            
            if (part) {
                bubble.innerHTML = `<strong>Formula Help:</strong><br>${part.hintA}<br>${part.hintP}`;
                bubble.style.left = `${mx + 10}px`;
                bubble.style.top = `${my - 40}px`;
                bubble.style.display = 'block';
                setTimeout(() => { bubble.style.display = 'none'; }, 4000);
            }
        }
    };
}

window.checkComplexWin = async function() {
    // Strip commas from input before parsing
    const rawA = document.getElementById('ans-area-val').value.replace(/,/g, '');
    const rawP = document.getElementById('ans-perim-val').value.replace(/,/g, '');
    
    const aVal = parseFloat(rawA);
    const aUnit = document.getElementById('ans-area-unit').value;
    const pVal = parseFloat(rawP);
    const pUnit = document.getElementById('ans-perim-unit').value;

    if (isNaN(aVal) || isNaN(pVal)) {
        showFlash("Please enter numeric values.", "error");
        return;
    }

    const areaOK = (Math.abs(aVal - complexData.totalArea) < 3.0) && (aUnit === 'square');
    const perimOK = (Math.abs(pVal - complexData.totalPerimeter) < 3.0) && (pUnit === 'linear');

    if (areaOK && perimOK) {
        let newVal = Math.min(10, (window.userMastery.ComplexShapes || 0) + 1);
        window.userMastery.ComplexShapes = newVal;
        if (window.supabaseClient && window.currentUser) {
            const h = sessionStorage.getItem('target_hour') || "00";
            await window.supabaseClient.from('assignment').update({ ComplexShapes: newVal }).eq('userName', window.currentUser).eq('hour', h);
        }
        showFlash("✅ Correct! Mastered.", "success");
        setTimeout(() => finishComplex(), 1500);
    } else {
        let msg = !areaOK ? "Check Area calculation." : "Check Perimeter calculation.";
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
