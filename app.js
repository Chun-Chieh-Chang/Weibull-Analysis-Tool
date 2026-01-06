/**
 * Weibull Analysis Tool - Enterprise Logic (app.js)
 * Refined for Mouldex Professional v4.5
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

// --- Initialization ---
window.onload = function () {
    setupEventListeners();
    const tInputA = document.getElementById('tInputA');
    if (tInputA) tInputA.focus();
};

function setupEventListeners() {
    ['A', 'B'].forEach(group => {
        const tInput = document.getElementById(`tInput${group}`);
        const sInput = document.getElementById(`sInput${group}`);
        if (tInput) {
            tInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); addData(group); }
            });
        }
        if (sInput) {
            sInput.addEventListener('keydown', (e) => {
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

// --- Data Operations ---
function addData(group) {
    const tInput = document.getElementById(`tInput${group}`);
    const sInput = document.getElementById(`sInput${group}`);
    const t = parseFloat(tInput.value);
    const s = sInput.value;

    if (isNaN(t) || t <= 0) {
        if (tInput.value !== "") alert("❌ 請輸入有效的正數壽命值");
        return;
    }

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
    if (!confirm(`確定要抹除「${document.getElementById('groupName' + group).value}」的所有數據嗎？`)) return;
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
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #94a3b8; padding: 40px;">尚未選取數據點</td></tr>`;
        return;
    }

    const accentColor = getComputedStyle(document.documentElement).getPropertyValue(group === 'A' ? '--brand-accent-a' : '--brand-accent-b').trim();

    tbody.innerHTML = data.map((item, idx) => `
        <tr>
            <td style="color: #94a3b8; font-weight: 500;">#${idx + 1}</td>
            <td style="font-weight: 600;">${item.t.toLocaleString()}</td>
            <td>
                <span style="display:inline-flex; align-items:center; gap:6px; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; background: ${item.s === 'F' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(37, 99, 235, 0.1)'}; color: ${item.s === 'F' ? '#dc2626' : '#2563eb'};">
                    <i class="fas ${item.s === 'F' ? 'fa-times-circle' : 'fa-check-circle'}"></i>
                    ${item.s === 'F' ? '失效 (Failure)' : '設限 (Suspended)'}
                </span>
            </td>
            <td>
                <button class="row-action" onclick="deleteRow('${group}', ${idx})" title="刪除此筆">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// --- Batch Management ---
function showBatchInput(group) {
    currentBatchGroup = group;
    document.getElementById('batchTitle').textContent = `[${group}] 數據批次匯入引擎`;
    document.getElementById('batchModal').style.display = 'flex';
    document.getElementById('batchTextarea').value = '';
    document.getElementById('batchTextarea').focus();
}

function closeBatchInput() {
    document.getElementById('batchModal').style.display = 'none';
}

function processBatchInput() {
    const lines = document.getElementById('batchTextarea').value.trim().split('\n');
    let success = 0;

    lines.forEach(line => {
        const parts = line.split(/[,\t\s]+/);
        if (parts.length < 2) return;
        const t = parseFloat(parts[0]);
        const s = parts[1].toUpperCase();
        if (!isNaN(t) && t > 0 && (s === 'F' || s === 'S')) {
            if (currentBatchGroup === 'A') dataGroupA.push({ t, s });
            else dataGroupB.push({ t, s });
            success++;
        }
    });

    if (success > 0) {
        sortData(currentBatchGroup);
        updateTable(currentBatchGroup);
        alert(`✅ 成功整合 ${success} 筆外部數據！`);
    }
    closeBatchInput();
}

// --- Analysis Engine ---
function runAnalysis() {
    if (dataGroupA.length < 2 && dataGroupB.length < 2) {
        alert("⚠️ 樣本數不足：單組至少需要 2 筆失效數據進行數學擬合。");
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
        if (el) {
            if (res) {
                el.style.display = 'block';
                document.getElementById(`group${tag}TitleResult`).textContent = document.getElementById(`groupName${tag}`).value;
                document.getElementById(`valBeta${tag}`).textContent = res.beta.toFixed(3);
                document.getElementById(`valEta${tag}`).textContent = Math.round(res.eta).toLocaleString();
                document.getElementById(`valR2${tag}`).textContent = res.r2.toFixed(4);
                document.getElementById(`descText${tag}`).textContent = res.typeText;
            } else {
                el.style.display = 'none';
            }
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

        let interpret = '⚠️ 改進效果不明顯';
        if (eDiff > 10) interpret = '🚀 優化成效卓越';
        else if (eDiff > 0) interpret = '✅ 方案具有小幅優勢';
        document.getElementById('diffInterpretation').textContent = interpret;
    } else {
        diffPanel.style.display = 'none';
    }
}

// --- Visualizations ---
function drawAnalytics(resA, resB) {
    const colA = '#2563eb', colB = '#e11d48';

    const chartLayout = {
        font: { family: 'Inter', color: '#1e293b' },
        plot_bgcolor: '#ffffff',
        paper_bgcolor: '#ffffff',
        margin: { l: 70, r: 30, t: 60, b: 70 },
        showlegend: true,
        legend: {
            bgcolor: 'rgba(255,255,255,0.8)',
            bordercolor: '#f1f5f9',
            borderwidth: 1,
            font: { size: 11 }
        },
        xaxis: {
            gridcolor: '#f1f5f9',
            linecolor: '#e2e8f0',
            zerolinecolor: '#e2e8f0',
            title: { font: { size: 13, weight: 600 } }
        },
        yaxis: {
            gridcolor: '#f1f5f9',
            linecolor: '#e2e8f0',
            zerolinecolor: '#e2e8f0',
            title: { font: { size: 13, weight: 600 } }
        }
    };

    // 1. Prob Plot
    let probTraces = [];
    if (resA) addTracesToProb(probTraces, resA, document.getElementById('groupNameA').value, colA);
    if (resB) addTracesToProb(probTraces, resB, document.getElementById('groupNameB').value, colB);

    const layoutProb = JSON.parse(JSON.stringify(chartLayout));
    layoutProb.title = { text: 'Weibull Probability Plot (擬合優度分析)', font: { size: 16, weight: 700 } };
    layoutProb.xaxis.title.text = 'ln(t) - 自然對數時間';
    layoutProb.yaxis.title.text = 'ln(-ln(1-F(t))) - 失效轉換值';
    layoutProb.legend.x = 0; layoutProb.legend.y = 1;

    Plotly.newPlot('chartProb', probTraces, layoutProb, { responsive: true, displaylogo: false });

    // 2. Reliability Curve
    let relTraces = [];
    if (resA) addTracesToRel(relTraces, resA, document.getElementById('groupNameA').value, colA);
    if (resB) addTracesToRel(relTraces, resB, document.getElementById('groupNameB').value, colB);

    const layoutRel = JSON.parse(JSON.stringify(chartLayout));
    layoutRel.title = { text: 'Reliability Evaluation (可靠度衰減趨勢)', font: { size: 16, weight: 700 } };
    layoutRel.xaxis.title.text = '壽命週期 (Time / Cycles)';
    layoutRel.yaxis.title.text = '可靠度機率 R(t) %';
    layoutRel.yaxis.range = [0, 105];
    layoutRel.legend.x = 1; layoutRel.legend.xanchor = 'right'; layoutRel.legend.y = 1;

    Plotly.newPlot('chartRel', relTraces, layoutRel, { responsive: true, displaylogo: false });

    updateReliabilityMarkers(markerReliabilityPercent);
}

function addTracesToProb(traces, res, name, color) {
    traces.push({
        x: res.points.map(p => p.x), y: res.points.map(p => p.y),
        mode: 'markers', name: `${name} (數據點)`, marker: { color, size: 8, line: { width: 1, color: '#fff' } }
    });
    const minX = Math.min(...res.points.map(p => p.x)), maxX = Math.max(...res.points.map(p => p.x));
    traces.push({
        x: [minX - 0.5, maxX + 0.5], y: [res.slope * (minX - 0.5) + res.intercept, res.slope * (maxX + 0.5) + res.intercept],
        mode: 'lines', name: `${name} (擬合線)`, line: { color, dash: 'dot', width: 3, opacity: 0.6 }
    });
}

function addTracesToRel(traces, res, name, color) {
    let x = [], y = [];
    const displayRange = Math.max(res.eta * 2.2, res.maxT * 1.5);
    for (let t = 0; t <= displayRange; t += displayRange / 200) {
        x.push(t);
        const Rt = Math.exp(-Math.pow(t / res.eta, res.beta)) * 100;
        y.push(Rt);
    }

    // 修正：處理十六進位顏色透明度 (Hex to RGBA)
    let fillcolor = color;
    if (color.startsWith('#')) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        fillcolor = `rgba(${r}, ${g}, ${b}, 0.08)`;
    }

    traces.push({
        x, y, mode: 'lines', name: `${name} 可靠度`,
        line: { color, width: 3, shape: 'spline' },
        fill: 'tozeroy', fillcolor: fillcolor
    });
}

function updateReliabilityMarkers(pct) {
    if (!analysisResults) return;
    const shapes = [], annotations = [];
    const R = pct / 100;

    ['A', 'B'].forEach(tag => {
        const res = analysisResults[`group${tag}`];
        if (!res) return;
        const color = getComputedStyle(document.documentElement).getPropertyValue(tag === 'A' ? '--brand-accent-a' : '--brand-accent-b').trim();
        const t = res.eta * Math.pow(-Math.log(R), 1 / res.beta);
        shapes.push({ type: 'line', x0: t, x1: t, y0: 0, y1: pct, line: { color, width: 2, dash: 'dash' } });
        annotations.push({ x: t, y: pct + 5, text: `B${Math.round(100 - pct)}=${Math.round(t)}`, showarrow: false, font: { weight: 700, color } });
    });

    Plotly.relayout('chartRel', { shapes, annotations });
}

// --- Utils & UI ---
function loadDemoCombined() {
    // 採用更具真實感的工程磨耗失效數據 (Beta > 2)
    // 基準方案 (Group A): 典型磨耗失效
    dataGroupA = [
        { t: 450, s: 'F' }, { t: 580, s: 'F' }, { t: 690, s: 'F' }, { t: 780, s: 'F' },
        { t: 870, s: 'F' }, { t: 950, s: 'F' }, { t: 1080, s: 'F' }, { t: 1250, s: 'S' },
        { t: 1350, s: 'S' }
    ];
    // 優化方案 (Group B): 具有更高的一致性 (更高 Beta) 與更長壽命 (更高 Eta)
    dataGroupB = [
        { t: 750, s: 'F' }, { t: 880, s: 'F' }, { t: 990, s: 'F' }, { t: 1120, s: 'F' },
        { t: 1250, s: 'F' }, { t: 1400, s: 'F' }, { t: 1550, s: 'F' }, { t: 1800, s: 'S' },
        { t: 2000, s: 'S' }
    ];

    updateTable('A');
    updateTable('B');
    runAnalysis();

    document.getElementById('resultPanel').scrollIntoView({ behavior: 'smooth' });
    alert("✅ 專業工程範例已載入：\n\n組別 A：基準方案 (典型磨耗模式，Beta ~ 2.5)\n組別 B：優化方案 (高一致性加工，Beta ~ 3.5)\n此組數據更能體現 Mouldex 設計優化後的顯著差異。");
}

function resetAll() {
    if (!confirm("⚠️ 確定要抹除工作區內所有數據並重置圖表嗎？")) return;

    dataGroupA = [];
    dataGroupB = [];
    analysisResults = null;

    updateTable('A');
    updateTable('B');

    document.getElementById('resultPanel').style.display = 'none';
    document.getElementById('diffPanel').style.display = 'none';

    // 清除圖表內容
    Plotly.purge('chartProb');
    Plotly.purge('chartRel');

    // 重置快速輸入
    ['A', 'B'].forEach(tag => {
        document.getElementById(`tInput${tag}`).value = '';
    });

    alert("✨ 工作區已重置：數據與曲線已全面清空。");
}

function exportSingleChart(chartId) {
    if (!document.getElementById(chartId)) return;
    const title = chartId === 'chartProb' ? 'Weibull_Prob_Plot' : 'Reliability_Curve';
    Plotly.downloadImage(chartId, {
        format: 'png',
        width: 1200,
        height: 800,
        filename: `Mouldex_${title}_${new Date().getTime()}`
    });
}

function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

function openTheoryTab(id) {
    document.getElementById('theoryModal').style.display = 'flex';
    switchTheoryTab(id);
}

function switchTheoryTab(id) {
    document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
    document.querySelectorAll('.theory-section').forEach(s => s.style.display = 'none');

    const targetLink = Array.from(document.querySelectorAll('.tab-link')).find(l => l.innerText.includes(
        id === 'basics' ? '基礎' : id === 'params' ? '參數' : id === 'blife' ? 'B-Life' : '樣本'
    ));
    if (targetLink) targetLink.classList.add('active');
    document.getElementById(`theory-${id}`).style.display = 'block';
}

function closeTheory() { document.getElementById('theoryModal').style.display = 'none'; }

function exportData() {
    if (!analysisResults) return alert("❌ 無分析數據可匯出，請先執行分析。");

    const nameA = document.getElementById('groupNameA').value;
    const nameB = document.getElementById('groupNameB').value;

    let csvContent = "\ufeffMouldex Weibull 分析完整數據報告\n";
    csvContent += `匯出時間,${new Date().toLocaleString()}\n\n`;

    // 1. 彙總統計摘要
    csvContent += "=== 1. 核心參數彙總統計 ===\n";
    csvContent += "項目,Group A (實驗組A),Group B (實驗組B),Delta (差異)\n";

    const getVal = (g, key) => (analysisResults[`group${g}`] ? analysisResults[`group${g}`][key] : '-');
    const betaA = getVal('A', 'beta'), betaB = getVal('B', 'beta');
    const etaA = getVal('A', 'eta'), etaB = getVal('B', 'eta');

    csvContent += `形狀參數 (Beta β),${typeof betaA === 'number' ? betaA.toFixed(4) : '-'},${typeof betaB === 'number' ? betaB.toFixed(4) : '-'},${(typeof betaA === 'number' && typeof betaB === 'number') ? (((betaB - betaA) / betaA * 100).toFixed(2) + '%') : '-'}\n`;
    csvContent += `特徵壽命 (Eta η),${typeof etaA === 'number' ? etaA.toFixed(2) : '-'},${typeof etaB === 'number' ? etaB.toFixed(2) : '-'},${(typeof etaA === 'number' && typeof etaB === 'number') ? (((etaB - etaA) / etaA * 100).toFixed(2) + '%') : '-'}\n`;
    csvContent += `擬合優度 (R²),${typeof getVal('A', 'r2') === 'number' ? getVal('A', 'r2').toFixed(4) : '-'},${typeof getVal('B', 'r2') === 'number' ? getVal('B', 'r2').toFixed(4) : '-'}\n`;
    csvContent += `失效模式判讀,${getVal('A', 'typeText')},${getVal('B', 'typeText')}\n\n`;

    // 2. 原始數據對照表
    csvContent += "=== 2. 原始壽命試驗數據對照 ===\n";
    csvContent += `,,[ ${nameA} ],,,,[ ${nameB} ]\n`;
    csvContent += "序號,壽命 (t),狀態 (F/S),,序號,壽命 (t),狀態 (F/S)\n";

    const maxLen = Math.max(dataGroupA.length, dataGroupB.length);
    for (let i = 0; i < maxLen; i++) {
        const rowA = dataGroupA[i] ? `${i + 1},${dataGroupA[i].t},${dataGroupA[i].s === 'F' ? '失效(F)' : '設限(S)'}` : ",,";
        const rowB = dataGroupB[i] ? `${i + 1},${dataGroupB[i].t},${dataGroupB[i].s === 'F' ? '失效(F)' : '設限(S)'}` : ",,";
        csvContent += `${rowA},,,,${rowB}\n`;
    }
    csvContent += "\n";

    // 3. B-Life 計算結果
    csvContent += "=== 3. 工程指標 B-Life 壽命預測 ===\n";
    csvContent += "指標機率 (Bx),Group A 預估壽命,Group B 預估壽命,改善率 (%)\n";

    const bLifeLevels = [1, 5, 10, 20, 50, 63.2];
    bLifeLevels.forEach(b => {
        const R = (100 - b) / 100;
        const calcT = (g) => {
            const res = analysisResults[`group${g}`];
            if (!res) return null;
            return res.eta * Math.pow(-Math.log(R), 1 / res.beta);
        };
        const tA = calcT('A'), tB = calcT('B');
        const impr = (tA && tB) ? ((tB - tA) / tA * 100).toFixed(1) + '%' : '-';
        csvContent += `B${b},${tA ? Math.round(tA) : '-'},${tB ? Math.round(tB) : '-'},${impr}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Mouldex_Weibull_FullReport_${new Date().getTime()}.csv`;
    link.click();
}

function generateReport() {
    html2canvas(document.getElementById('reportArea')).then(canvas => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `Mouldex_Weibull_Report.png`;
        link.click();
    });
}
