/**
 * skill_complexshapes.js
 * - Grade Level: 7th/8th
 * - VERSION: 3.0 (Dynamic Placement & Level 8 Boss Mode)
 * - NEW: Attachments randomize to Top, Bottom, Left, or Right.
 * - NEW: At mastery level 8+, generates TWO attachments.
 */

var complexData = {
    rect: {},
    attachments: [],
    totalArea: 0,
    totalPerimeter: 0,
    unit: 'units',
};

window.initComplexShapesGame = async function() {
    if (typeof log === 'function') {
        log("🚀 Complex Shapes: v3.0 - Multi-Side Placement & Boss Mode");
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
    complexData.attachments = [];
    
    let baseW = Math.floor(Math.random() * 60) + 140;
    let baseH = Math.floor(Math.random() * 60) + 120;
    
    complexData.rect = { w: baseW, h: baseH };
    complexData.totalArea = baseW * baseH;
    
    // Start with the perimeter of just the rectangle
    complexData.totalPerimeter = (baseW * 2) + (baseH * 2);

    // Level 8+ Boss Mode gets 2 attachments
    let mastery = window.userMastery.ComplexShapes || 0;
    let numAttachments = mastery >= 8 ? 2 : 1;

    let sides = ['top', 'right', 'bottom', 'left'];
    sides.sort(() => Math.random() - 0.5); // Shuffle sides
    let chosenSides = sides.slice(0, numAttachments);

    function createAttachment(side) {
        let isVertical = (side === 'left' || side === 'right');
        let baseLen = isVertical ? baseH : baseW;
        
        let typePool = ['triangle', 'semicircle', 'trapezoid'];
        let type = typePool[Math.floor(Math.random() * typePool.length)];
        let comp = { type: type, side: side, baseLen: baseLen };
        
        let ext = 0;

        if (type === 'triangle') {
            let h = Math.floor(Math.random() * 40) + 60; 
            let slant = Math.sqrt(Math.pow(baseLen/2, 2) + Math.pow(h, 2)).toFixed(1);
            comp.height = h; comp.slant = slant;
            ext = h;
            comp.area = 0.5 * baseLen * h;
            comp.outerP = parseFloat(slant) * 2;
            comp.hintA = `Triangle: ½ × base × height`;
            
        } else if (type === 'semicircle') {
            let r = baseLen / 2;
            comp.r = r;
            ext = r;
            comp.area = (3.14 * Math.pow(r, 2)) / 2;
            comp.outerP = 3.14 * r;
            comp.hintA = `Semicircle: (3.14 × r²) / 2`;
            
        } else if (type === 'trapezoid') {
            let topB = Math.floor(baseLen * 0.5); 
            let h = Math.floor(Math.random() * 30) + 50; 
            let diff = (baseLen - topB) / 2; 
            let slant = Math.sqrt(Math.pow(h, 2) + Math.pow(diff, 2)).toFixed(1);
            comp.b1 = baseLen; comp.b2 = topB; comp.h = h; comp.slant = slant;
            ext = h;
            comp.area = 0.5 * (baseLen + topB) * h;
            comp.outerP = topB + (parseFloat(slant) * 2);
            comp.hintA = `Trapezoid: ½(base1 + base2) × height`;
        }
        
        comp.extent = ext;
        complexData.totalArea += comp.area;
        // Subtract the covered wall, add the new outer boundary
        complexData.totalPerimeter = complexData.totalPerimeter - baseLen + comp.outerP;
        
        return comp;
    }

    // Generate shapes and calculate boundaries to center the canvas
    let minX = 0, maxX = baseW, minY = 0, maxY = baseH;

    chosenSides.forEach(side => {
        let att = createAttachment(side);
        complexData.attachments.push(att);
        
        if (side === 'right') maxX = Math.max(maxX, baseW + att.extent);
        if (side === 'left') minX = Math.min(minX, -att.extent);
        if (side === 'bottom') maxY = Math.max(maxY, baseH + att.extent);
        if (side === 'top') minY = Math.min(minY, -att.extent);
    });

    const canvasW = 550;
    const canvasH = 300;
    let totalW = maxX - minX;
    let totalH = maxY - minY;
    
    complexData.rect.x = (canvasW - totalW) / 2 - minX;
    complexData.rect.y = (canvasH - totalH) / 2 - minY;
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
    const rect = complexData.rect;
    
    ctx.clearRect(0, 0, 550, 300);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#334155";

    function drawLabel(text, x, y, color = "#1e293b", isInternal = false) {
        ctx.save();
        ctx.font = "bold 14px Arial";
        let w = ctx.measureText(text).width;
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fillRect(x - w/2 - 5, y - 12, w + 10, 20); 
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

    // 1. Draw Rectangle Main Body
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.fill(); ctx.stroke();

    // 2. Determine which sides of the rectangle to label based on what is covered
    let hasTop = complexData.attachments.some(a => a.side === 'top');
    let hasBot = complexData.attachments.some(a => a.side === 'bottom');
    let hasLeft = complexData.attachments.some(a => a.side === 'left');
    let hasRight = complexData.attachments.some(a => a.side === 'right');

    if (!hasTop) drawLabel(`${rect.w} ${u}`, rect.x + rect.w/2, rect.y - 15);
    else if (!hasBot) drawLabel(`${rect.w} ${u}`, rect.x + rect.w/2, rect.y + rect.h + 15);
    else drawLabel(`w: ${rect.w} ${u}`, rect.x + rect.w/2, rect.y + rect.h/2 - 15, "#64748b", true);

    if (!hasLeft) drawLabel(`${rect.h} ${u}`, rect.x - 45, rect.y + rect.h/2);
    else if (!hasRight) drawLabel(`${rect.h} ${u}`, rect.x + rect.w + 45, rect.y + rect.h/2);
    else drawLabel(`h: ${rect.h} ${u}`, rect.x + rect.w/2, rect.y + rect.h/2 + 15, "#64748b", true);

    // 3. Draw Attachments dynamically rotated
    complexData.attachments.forEach(p => {
        ctx.save();
        let currentRot = 0;
        
        if (p.side === 'right') {
            ctx.translate(rect.x + rect.w, rect.y);
            currentRot = 0;
        } else if (p.side === 'bottom') {
            ctx.translate(rect.x + rect.w, rect.y + rect.h);
            currentRot = Math.PI / 2;
        } else if (p.side === 'left') {
            ctx.translate(rect.x, rect.y + rect.h);
            currentRot = Math.PI;
        } else if (p.side === 'top') {
            ctx.translate(rect.x, rect.y);
            currentRot = Math.PI * 1.5;
        }
        ctx.rotate(currentRot);

        // Nested helper: draws labels perfectly upright regardless of canvas rotation
        function drawUpright(text, localX, localY, color="#1e293b", isInternal=false) {
            ctx.save();
            ctx.translate(localX, localY);
            ctx.rotate(-currentRot);
            drawLabel(text, 0, 0, color, isInternal);
            ctx.restore();
        }

        ctx.fillStyle = "#f1f5f9";
        ctx.beginPath();
        
        if (p.type === 'triangle') {
            ctx.moveTo(0, 0);
            ctx.lineTo(p.height, p.baseLen/2); 
            ctx.lineTo(0, p.baseLen); 
            ctx.closePath();
            ctx.fill(); ctx.stroke();
            
            drawDashedLine(0, p.baseLen/2, p.height, p.baseLen/2);
            drawUpright(`${p.slant}`, p.height/2 + 10, p.baseLen*0.25 - 20); 
            drawUpright(`${p.slant}`, p.height/2 + 10, p.baseLen*0.75 + 20); 
            drawUpright(`h: ${p.height}`, p.height/2, p.baseLen/2 - 15, "#64748b", true);
        } 
        else if (p.type === 'semicircle') {
            let cy = p.r; 
            ctx.arc(0, cy, p.r, -Math.PI/2, Math.PI/2);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
            
            drawDashedLine(0, cy, p.r, cy);
            drawUpright(`r: ${p.r}`, p.r/2, cy - 15, "#64748b", true);
        } 
        else if (p.type === 'trapezoid') {
            let vOffset = (p.baseLen - p.b2) / 2; 
            ctx.moveTo(0, 0); 
            ctx.lineTo(p.h, vOffset); 
            ctx.lineTo(p.h, vOffset + p.b2); 
            ctx.lineTo(0, p.baseLen); 
            ctx.closePath();
            ctx.fill(); ctx.stroke();
            
            let midY = p.baseLen/2;
            drawDashedLine(0, midY, p.h, midY);

            drawUpright(`${p.b2}`, p.h + 25, midY); 
            drawUpright(`${p.slant}`, p.h/2, -15); 
            drawUpright(`${p.slant}`, p.h/2, p.baseLen + 25); 
            drawUpright(`h: ${p.h}`, p.h/2, midY - 15, "#64748b", true);
        }
        ctx.restore();
    });

    // Unified Hint System
    canvas.onclick = (e) => {
        const r = canvas.getBoundingClientRect();
        const mx = (e.clientX - r.left) * (canvas.width / r.width);
        const my = (e.clientY - r.top) * (canvas.height / r.height);
        const bubble = document.getElementById('hint-bubble');
        
        // If they click generally inside the canvas bounds
        if (mx > 20 && mx < canvas.width - 20 && my > 20 && my < canvas.height - 20) {
            let hintHtml = `<strong style="color:#60a5fa;">Formulas:</strong><br>• Rect: base × height<br>`;
            complexData.attachments.forEach(a => {
                hintHtml += `• ${a.hintA}<br>`;
            });
            hintHtml += `<br><em style="color:#a7f3d0;">Perimeter: Add all OUTER boundaries!</em>`;
            
            bubble.innerHTML = hintHtml;
            // Bound the bubble to the screen so it doesn't get cut off
            bubble.style.left = `${Math.min(mx + 10, 350)}px`;
            bubble.style.top = `${Math.min(my - 20, 200)}px`;
            bubble.style.display = 'block';
            setTimeout(() => { bubble.style.display = 'none'; }, 4500);
        }
    };
}

window.checkComplexWin = async function() {
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
