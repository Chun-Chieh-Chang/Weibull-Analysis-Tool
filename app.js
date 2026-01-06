/**
 * Weibull Analysis Tool - Professional Logic (app.js)
 * High-End Design System Integration v4.5
 */

let dataGroupA = [];
let dataGroupB = [];
let analysisResults = null;
let markerReliabilityPercent = 95;
let currentBatchGroup = '';

/**
 * 載入單組範例數據
 */
function loadDemo(group) {
    const originalData = [
        { t: 300, s: 'F' }, { t: 100, s: 'F' }, { t: 250, s: 'S' },
        { t: 150, s: 'F' }, { t: 550, s: 'F' }, { t: 120, s: 'S' },
        { t: 400, s: 'F' }, { t: 200, s: 'F' }
    ];

    const target = (group === 'A') ? originalData : originalData.map(d => ({ t: Math.round(d.t * 1.25 * 10) / 10, s: d.s }));

    if (group === 'A') dataGroupA = target;
    else dataGroupB = target;

    sortData(group);
    updateTable(group);
    alert(`✅ 已載入組別 ${group} 的範例數據！`);
}

/**
 * 初始化
 */
window.onload = function () {
    setupEventListeners();
};

function setupEventListeners() {
    ['A', 'B'].forEach(group => {
        const tInput = document.getElementById(`tInput${group}`);
        if (tInput) {
            tInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); addData(group); }
            });
        }
    });

    const inputRel = document.getElementById('inputReliability');
    if (inputRel) {
        inputRel.addEventListener('input', () => {
            const val = parseFloat(inputRel.value);
            if (isNaN(val) || val <= 0 || val >= 100) return;
            markerReliabilityPercent = val;
            if (analysisResults) updateReliabilityMarkers(markerReliabilityPercent);
        });
    }
}

/**
 * 數據操作
 */
function addData(group) {
    const tInput = document.getElementById(`tInput${group}`);
    const sInput = document.getElementById(`sInput${group}`);
    const t = parseFloat(tInput.value);
    const s = sInput.value;

    if (isNaN(t) || t <= 0) return;

    const target = (group === 'A') ? dataGroupA : dataGroupB;
    target.push({ t, s });
    sortData(group);
    updateTable(group);

    tInput.value = '';
    tInput.focus();
}

function deleteRow(group, idx) {
    const target = (group === 'A') ? dataGroupA : dataGroupB;
    target.splice(idx, 1);
    updateTable(group);
}

function clearData(group) {
    const name = document.getElementById('groupName' + group).value;
    if (!confirm(`確定要清空「${name}」的所有數據嗎？`)) return;
    if (group === 'A') dataGroupA = []; else dataGroupB = [];
    updateTable(group);
}

function sortData(group) {
    const data = (group === 'A') ? dataGroupA : dataGroupB;
    data.sort((a, b) => (a.t !== b.t) ? (a.t - b.t) : (a.s === 'F' ? -1 : 1));
}

function updateTable(group) {
    const data = (group === 'A') ? dataGroupA : dataGroupB;
    const tbody = document.querySelector(`#dataTable${group} tbody`);
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 20px; color: #94a3b8;">尚未輸入數據</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map((item, idx) => `
        <tr>
            <td style="color: #64748b;">#${idx + 1}</td>
            <td style="font-weight: 600;">${item.t.toLocaleString()}</td>
            <td>
                <span class="p-badge ${item.s === 'F' ? 'p-badge-rose' : 'p-badge-blue'}">
                    ${item.s === 'F' ? '失效(F)' : '設限(S)'}
                </span>
            </td>
            <td>
                <button onclick="deleteRow('${group}', ${idx})" style="border:none; background:none, cursor:pointer, color: #f43f5e; opacity:0.6;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * 分析引擎
 */
function runAnalysis() {
    if (dataGroupA.length < 2 && dataGroupB.length < 2) {
        alert("⚠️ 請輸入至少一組數據（每組最少 2 筆失效點）以執行分析。");
        return;
    }

    const resA = (dataGroupA.length >= 2) ? analyzeGroup(dataGroupA, 'A') : null;
    const resB = (dataGroupB.length >= 2) ? analyzeGroup(dataGroupB, 'B') : null;

    analysisResults = { groupA: resA, groupB: resB };
    displayUIResults(resA, resB);
    drawAnalytics(resA, resB);
}

function analyzeGroup(data, tag) {
    const fData = data.filter(d => d.s === 'F');
    if (fData.length < 2) return null;

    const N = data.length;
    let points = [];
    let prevOrder = 0;

    data.forEach((item, i) => {
        const revRank = N - i;
        const increment = ((N + 1) - prevOrder) / revRank;
        const curOrder = prevOrder + increment;

        if (item.s === 'F') {
            let mRank = (curOrder - 0.3) / (N + 0.4);
            if (mRank >= 0.999) mRank = 0.999;
            const x = Math.log(item.t);
            const y = Math.log(-Math.log(1 - mRank));
            if (isFinite(x) && isFinite(y)) points.push({ x, y });
        }
        prevOrder = curOrder;
    });

    if (points.length < 2) return null;

    // Linear Regression
    let sX = 0, sY = 0, sXY = 0, sXX = 0;
    points.forEach(p => {
        sX += p.x; sY += p.y; sXY += p.x * p.y; sXX += p.x * p.x;
    });

    const slope = (points.length * sXY - sX * sY) / (points.length * sXX - sX * sX);
    const intercept = (sY - slope * sX) / points.length;

    const beta = slope;
    const eta = Math.exp(-intercept / beta);

    const yMean = sY / points.length;
    const ssTot = points.reduce((acc, p) => acc + Math.pow(p.y - yMean, 2), 0);
    const ssRes = points.reduce((acc, p) => acc + Math.pow(p.y - (slope * p.x + intercept), 2), 0);
    const r2 = 1 - (ssRes / (ssTot || 1));

    let typeText = "磨耗失效 (Wear-out)";
    if (beta < 1) typeText = "早期失效 (Infant Mortality)";
    else if (beta < 1.1) typeText = "隨機失效 (Random Chance)";

    return { beta, eta, r2, typeText, points, slope, intercept, maxT: data[data.length - 1].t };
}

function displayUIResults(resA, resB) {
    document.getElementById('resultPanel').style.display = 'block';

    const updateStats = (tag, res) => {
        const el = document.getElementById(`groupResult${tag}`);
        if (!el) return;
        if (res) {
            el.style.display = 'block';
            document.getElementById(`group${tag}TitleResult`).textContent = document.getElementById(`groupName${tag}`).value;
            document.getElementById(`valBeta${tag}`).textContent = res.beta.toFixed(3);
            document.getElementById(`valEta${tag}`).textContent = Math.round(res.eta).toLocaleString();
            document.getElementById(`valR2${tag}`).textContent = res.r2.toFixed(4);
            document.getElementById(`descText${tag}`).textContent = `失效判定: ${res.typeText}`;
        } else {
            el.style.display = 'none';
        }
    };

    updateStats('A', resA);
    updateStats('B', resB);

    const diffPanel = document.getElementById('diffPanel');
    if (resA && resB) {
        diffPanel.style.display = 'block';
        const bDiff = ((resB.beta - resA.beta) / resA.beta * 100);
        const eDiff = ((resB.eta - resA.eta) / resA.eta * 100);
        document.getElementById('diffBeta').textContent = `${bDiff >= 0 ? '+' : ''}${bDiff.toFixed(1)}%`;
        document.getElementById('diffEta').textContent = `${eDiff >= 0 ? '+' : ''}${eDiff.toFixed(1)}%`;
        document.getElementById('diffImprovement').textContent = `${eDiff >= 0 ? '+' : ''}${eDiff.toFixed(1)}%`;

        let interpret = '⚠️ 改進建議進一步驗證';
        if (eDiff > 10) interpret = '🚀 優化成效顯著';
        else if (eDiff > 0) interpret = '✅ 方案具有小幅優勢';
        document.getElementById('diffInterpretation').textContent = interpret;
    } else {
        diffPanel.style.display = 'none';
    }
}

/**
 * 視覺化同步中心 (Fixing Alignment)
 */
function drawAnalytics(resA, resB) {
    const colA = '#0ea5e9', colB = '#f43f5e';

    // 共享佈局參數 - 確保 X 座標物理位置與間距完全一致
    const sharedLayout = {
        font: { family: 'Plus Jakarta Sans, sans-serif', color: '#0f172a' },
        plot_bgcolor: '#ffffff',
        margin: { l: 80, r: 40, t: 30, b: 80 },
        showlegend: true,
        legend: { x: 0.05, y: 0.95, bgcolor: 'rgba(255,255,255,0.8)', bordercolor: '#e2e8f0', borderwidth: 1 },
        xaxis: { gridcolor: '#f1f5f9', linecolor: '#e2e8f0', title: { font: { size: 12, weight: 600 } } },
        yaxis: { gridcolor: '#f1f5f9', linecolor: '#e2e8f0', title: { font: { size: 12, weight: 600 } } }
    };

    // 1. Prob Plot
    let probTraces = [];
    if (resA) addTracesToProb(probTraces, resA, document.getElementById('groupNameA').value, colA);
    if (resB) addTracesToProb(probTraces, resB, document.getElementById('groupNameB').value, colB);

    const layoutProb = JSON.parse(JSON.stringify(sharedLayout));
    layoutProb.xaxis.title.text = 'Scale: ln(t)';
    layoutProb.yaxis.title.text = 'ln(-ln(1-F(t)))';
    Plotly.newPlot('chartProb', probTraces, layoutProb, { responsive: true, displaylogo: false });

    // 2. Reliability Plot
    let relTraces = [];
    if (resA) addTracesToRel(relTraces, resA, document.getElementById('groupNameA').value, colA);
    if (resB) addTracesToRel(relTraces, resB, document.getElementById('groupNameB').value, colB);

    const layoutRel = JSON.parse(JSON.stringify(sharedLayout));
    layoutRel.xaxis.title.text = 'Time / Life Cycles';
    layoutRel.yaxis.title.text = 'Reliability R(t) %';
    layoutRel.yaxis.range = [0, 105];
    layoutRel.legend.x = 0.95; layoutRel.legend.xanchor = 'right';
    Plotly.newPlot('chartRel', relTraces, layoutRel, { responsive: true, displaylogo: false });

    updateReliabilityMarkers(markerReliabilityPercent);
}

function addTracesToProb(traces, res, name, color) {
    traces.push({
        x: res.points.map(p => p.x), y: res.points.map(p => p.y),
        mode: 'markers', name: `${name} (點)`, marker: { color, size: 7 }
    });
    const minX = Math.min(...res.points.map(p => p.x)), maxX = Math.max(...res.points.map(p => p.x));
    traces.push({
        x: [minX - 0.5, maxX + 0.5], y: [res.slope * (minX - 0.5) + res.intercept, res.slope * (maxX + 0.5) + res.intercept],
        mode: 'lines', name: `${name} (擬合)`, line: { color, dash: 'dot', width: 2 }
    });
}

function addTracesToRel(traces, res, name, color) {
    let x = [], y = [];
    const displayRange = Math.max(res.eta * 2.2, res.maxT * 1.5);
    for (let t = 0; t <= displayRange; t += displayRange / 100) {
        x.push(t);
        const Rt = Math.exp(-Math.pow(t / res.eta, res.beta)) * 100;
        y.push(Rt);
    }

    let fillcolor = color.startsWith('#') ? `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 0.05)` : color;

    traces.push({
        x, y, mode: 'lines', name: `${name}`,
        line: { color, width: 3, shape: 'spline' },
        fill: 'tozeroy', fillcolor: fillcolor
    });
}

/**
 * 輔助功能
 */
function loadDemoCombined() {
    dataGroupA = [
        { t: 450, s: 'F' }, { t: 580, s: 'F' }, { t: 690, s: 'F' }, { t: 780, s: 'F' },
        { t: 870, s: 'F' }, { t: 950, s: 'F' }, { t: 1080, s: 'F' }, { t: 1250, s: 'S' }, { t: 1350, s: 'S' }
    ];
    dataGroupB = [
        { t: 750, s: 'F' }, { t: 880, s: 'F' }, { t: 990, s: 'F' }, { t: 1120, s: 'F' },
        { t: 1250, s: 'F' }, { t: 1400, s: 'F' }, { t: 1550, s: 'F' }, { t: 1800, s: 'S' }, { t: 2000, s: 'S' }
    ];
    updateTable('A'); updateTable('B');
    runAnalysis();
    document.getElementById('resultPanel').scrollIntoView({ behavior: 'smooth' });
}

function resetAll() {
    if (!confirm("⚠️ 確定要重置工作區嗎？")) return;
    dataGroupA = []; dataGroupB = []; analysisResults = null;
    updateTable('A'); updateTable('B');
    document.getElementById('resultPanel').style.display = 'none';
    Plotly.purge('chartProb'); Plotly.purge('chartRel');
}

function showBatchInput(group) {
    currentBatchGroup = group;
    document.getElementById('batchModal').style.display = 'flex';
}

function closeBatchInput() { document.getElementById('batchModal').style.display = 'none'; }

function processBatchInput() {
    const lines = document.getElementById('batchTextarea').value.trim().split('\n');
    lines.forEach(l => {
        const p = l.split(/[,\t\s]+/);
        if (p.length < 2) return;
        const t = parseFloat(p[0]), s = p[1].toUpperCase();
        if (!isNaN(t) && t > 0 && (s === 'F' || s === 'S')) {
            if (currentBatchGroup === 'A') dataGroupA.push({ t, s }); else dataGroupB.push({ t, s });
        }
    });
    sortData(currentBatchGroup); updateTable(currentBatchGroup);
    closeBatchInput();
}

function updateReliabilityMarkers(pct) {
    if (!analysisResults) return;
    const shapes = [], annotations = [];
    ['A', 'B'].forEach(tag => {
        const res = analysisResults[`group${tag}`];
        if (!res) return;
        const color = tag === 'A' ? '#0ea5e9' : '#f43f5e';
        const t = res.eta * Math.pow(-Math.log(pct / 100), 1 / res.beta);
        shapes.push({ type: 'line', x0: t, x1: t, y0: 0, y1: pct, line: { color, width: 2, dash: 'dash' } });
        annotations.push({ x: t, y: pct + 5, text: `B${Math.round(100 - pct)}=${Math.round(t)}`, showarrow: false, font: { weight: 700, color } });
    });
    Plotly.relayout('chartRel', { shapes, annotations });
}

function exportSingleChart(id) {
    Plotly.downloadImage(id, { format: 'png', width: 1200, height: 800, filename: `Mouldex_Chart_${new Date().getTime()}` });
}

function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }
function openTheoryTab(id) { document.getElementById('theoryModal').style.display = 'flex'; switchTheoryTab(id); }
function closeTheory() { document.getElementById('theoryModal').style.display = 'none'; }
function switchTheoryTab(id) {
    document.querySelectorAll('.p-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.theory-section').forEach(s => s.style.display = 'none');
    document.getElementById(`theory-${id}`).style.display = 'block';
    const activeTab = Array.from(document.querySelectorAll('.p-tab')).find(t => t.innerText.includes(id === 'basics' ? '基礎' : id === 'params' ? '參數' : id === 'blife' ? 'B-Life' : '樣本'));
    if (activeTab) activeTab.classList.add('active');
}

function exportData() {
    if (!analysisResults) return alert("❌ 無分析數據。");
    let csv = "\ufeff實驗組,Beta,Eta,R2,模式\n";
    ['groupA', 'groupB'].forEach(k => { if (analysisResults[k]) csv += `${k},${analysisResults[k].beta.toFixed(4)},${analysisResults[k].eta.toFixed(2)},${analysisResults[k].r2.toFixed(4)},${analysisResults[k].typeText}\n`; });
    const b = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const l = document.createElement('a'); l.href = URL.createObjectURL(b); l.download = `Report_${new Date().getTime()}.csv`; l.click();
}

function generateReport() {
    html2canvas(document.getElementById('reportArea')).then(c => {
        const l = document.createElement('a'); l.href = c.toDataURL('image/png'); l.download = `Mouldex_Full_Report.png`; l.click();
    });
}
