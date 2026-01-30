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
    setAnalysisMode('dual'); // 預設雙組比對

    // 確保輸入框焦點
    const tInputA = document.getElementById('tInputA');
    if (tInputA) tInputA.focus();

    // 更新主題按鈕圖示
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
        const isDark = !document.body.classList.contains('light-mode');
        btn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }
};

/**
 * 設置分析模式
 */
function setAnalysisMode(mode) {
    const container = document.querySelector('.container');
    const panelB = document.getElementById('panelGroupB');
    const runBtn = document.querySelector('.btn-calc');

    if (mode === 'single') {
        container.classList.add('mode-single');
        container.classList.remove('mode-dual');
        if (panelB) panelB.style.display = 'none';
        if (runBtn) runBtn.innerHTML = '🔍 開始分析';
    } else {
        container.classList.remove('mode-single');
        container.classList.add('mode-dual');
        if (panelB) panelB.style.display = 'block';
        if (runBtn) runBtn.innerHTML = '🔍 開始比對';
    }

    // 如果已有結果，根據模式隱藏/顯示 B 組結果
    if (analysisResults) {
        displayUIResults(analysisResults.groupA, analysisResults.groupB);
    }
}

function setupEventListeners() {
    ['A', 'B'].forEach(group => {
        const tInput = document.getElementById(`tInput${group}`);
        if (tInput) {
            tInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); addData(group); }
            });
        }
    });

    const inputRel = document.getElementById('markerRInput');
    if (inputRel) {
        inputRel.addEventListener('change', () => {
            let val = parseFloat(inputRel.value);
            if (isNaN(val)) return;
            if (val < 0) val = 0.1;
            if (val > 99.9) val = 99.9;
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
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 20px; color: var(--text-sub);">尚未輸入數據</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map((item, idx) => `
        <tr>
            <td style="color: var(--text-sub);">#${idx + 1}</td>
            <td style="font-weight: 600;">${item.t.toLocaleString()}</td>
            <td>
                <span class="p-badge ${item.s === 'F' ? 'p-badge-rose' : 'p-badge-blue'}">
                    ${item.s === 'F' ? '失效(F)' : '設限(S)'}
                </span>
            </td>
            <td>
                <button onclick="deleteRow('${group}', ${idx})" style="border:none; background:none; cursor:pointer; color: #f43f5e; opacity:0.8;">
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
        const badge = document.getElementById(`group${tag}NameBadge`);
        const resultCard = document.querySelector(`.group-result.group-${tag.toLowerCase()}`);

        if (res) {
            if (resultCard) resultCard.style.display = 'block';
            if (badge) badge.textContent = ` (${document.getElementById(`groupName${tag}`).value})`;

            document.getElementById(`valBeta${tag}`).textContent = res.beta.toFixed(3);
            document.getElementById(`valEta${tag}`).textContent = Math.round(res.eta).toLocaleString();
            document.getElementById(`valR2${tag}`).textContent = res.r2.toFixed(4);
            document.getElementById(`descText${tag}`).textContent = `失效判定: ${res.typeText}`;
        } else {
            if (resultCard) resultCard.style.display = 'none';
        }
    };

    updateStats('A', resA);
    updateStats('B', resB);

    const diffPanel = document.getElementById('diffPanel');
    const isDual = document.querySelector('.container').classList.contains('mode-dual');

    if (resA && resB && isDual) {
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
    const isDark = !document.body.classList.contains('light-mode');
    const colA = isDark ? '#38bdf8' : '#0ea5e9';
    const colB = isDark ? '#fb7185' : '#f43f5e';
    const textColor = isDark ? '#f1f5f9' : '#0f172a';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#f1f5f9';
    const lineColor = isDark ? 'rgba(255, 255, 255, 0.2)' : '#e2e8f0';
    const bgColor = 'rgba(0,0,0,0)';

    const sharedLayout = {
        font: { family: 'Inter, system-ui, sans-serif', color: textColor },
        plot_bgcolor: bgColor,
        paper_bgcolor: bgColor,
        margin: { l: 80, r: 40, t: 30, b: 80 },
        showlegend: true,
        legend: {
            x: 0.05,
            y: 0.95,
            bgcolor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255,255,255,0.8)',
            bordercolor: lineColor,
            borderwidth: 1,
            font: { color: textColor }
        },
        xaxis: {
            gridcolor: gridColor,
            linecolor: lineColor,
            zerolinecolor: gridColor,
            title: { font: { size: 12, weight: 600, color: textColor } },
            tickfont: { color: textColor }
        },
        yaxis: {
            gridcolor: gridColor,
            linecolor: lineColor,
            zerolinecolor: gridColor,
            title: { font: { size: 12, weight: 600, color: textColor } },
            tickfont: { color: textColor }
        }
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

    // Dynamic fill color for theme compatibility
    const fillcolor = color.startsWith('#')
        ? `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 0.1)`
        : color;

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
    const isDark = !document.body.classList.contains('light-mode');
    const shapes = [], annotations = [];
    ['A', 'B'].forEach(tag => {
        const res = analysisResults[`group${tag}`];
        if (!res) return;
        const color = tag === 'A' ? (isDark ? '#38bdf8' : '#0ea5e9') : (isDark ? '#fb7185' : '#f43f5e');
        const t = res.eta * Math.pow(-Math.log(pct / 100), 1 / res.beta);
        shapes.push({ type: 'line', x0: t, x1: t, y0: 0, y1: pct, line: { color, width: 2, dash: 'dash' } });
        annotations.push({
            x: t,
            y: pct + 5,
            text: `B${Math.round(100 - pct)}=${Math.round(t)}`,
            showarrow: false,
            font: { weight: 700, color: color }
        });
    });
    Plotly.relayout('chartRel', { shapes, annotations });
}

function exportSingleChart(id) {
    Plotly.downloadImage(id, { format: 'png', width: 1200, height: 800, filename: `Mouldex_Chart_${new Date().getTime()}` });
}

function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }
function openTheoryTab(id) { document.getElementById('theoryModal').style.display = 'flex'; switchTheoryTab(id); }
function openTheory() { openTheoryTab('basics'); }
function closeTheory() { document.getElementById('theoryModal').style.display = 'none'; }
function switchTheoryTab(id) {
    document.querySelectorAll('.p-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.theory-section').forEach(s => s.style.display = 'none');
    document.getElementById(`theory-${id}`).style.display = 'block';
    const activeTab = Array.from(document.querySelectorAll('.p-tab')).find(t => t.innerText.includes(id === 'basics' ? '基礎' : id === 'params' ? '參數' : id === 'blife' ? 'B-Life' : '樣本'));
    if (activeTab) activeTab.classList.add('active');
}

function exportData() {
    if (!analysisResults) return alert("❌ 無分析數據可匯出，請先執行分析。");

    const nameA = document.getElementById('groupNameA').value;
    const nameB = document.getElementById('groupNameB').value;

    let csvContent = "\ufeffMouldex Weibull 專業版分析報告\n";
    csvContent += `匯出日期,${new Date().toLocaleString()}\n\n`;

    // 1. 彙總統計
    csvContent += "=== 1. 核心參數彙總統計 ===\n";
    csvContent += "項目,實驗組 A,實驗組 B,差異率 (%)\n";

    const betaA = analysisResults.groupA ? analysisResults.groupA.beta : 0;
    const betaB = analysisResults.groupB ? analysisResults.groupB.beta : 0;
    const etaA = analysisResults.groupA ? analysisResults.groupA.eta : 0;
    const etaB = analysisResults.groupB ? analysisResults.groupB.eta : 0;

    csvContent += `形狀參數 (Beta β),${betaA ? betaA.toFixed(4) : '-'},${betaB ? betaB.toFixed(4) : '-'},${(betaA && betaB) ? (((betaB - betaA) / betaA * 100).toFixed(2) + '%') : '-'}\n`;
    csvContent += `特徵壽命 (Eta η),${etaA ? etaA.toFixed(2) : '-'},${etaB ? etaB.toFixed(2) : '-'},${(etaA && etaB) ? (((etaB - etaA) / etaA * 100).toFixed(2) + '%') : '-'}\n`;
    csvContent += `擬合優度 (R²),${analysisResults.groupA ? analysisResults.groupA.r2.toFixed(4) : '-'},${analysisResults.groupB ? analysisResults.groupB.r2.toFixed(4) : '-'}\n`;
    csvContent += `失效模式判定,${analysisResults.groupA ? analysisResults.groupA.typeText : '-'},${analysisResults.groupB ? analysisResults.groupB.typeText : '-'}\n\n`;

    // 2. 原始數據
    csvContent += "=== 2. 原始數據對照表 ===\n";
    csvContent += `,,[ ${nameA} ],,,,[ ${nameB} ]\n`;
    csvContent += "ID,壽命 (t),狀態 (F/S),,ID,壽命 (t),狀態 (F/S)\n";

    const maxLen = Math.max(dataGroupA.length, dataGroupB.length);
    for (let i = 0; i < maxLen; i++) {
        const rowA = dataGroupA[i] ? `${i + 1},${dataGroupA[i].t},${dataGroupA[i].s}` : ",,";
        const rowB = dataGroupB[i] ? `${i + 1},${dataGroupB[i].t},${dataGroupB[i].s}` : ",,";
        csvContent += `${rowA},,,,${rowB}\n`;
    }
    csvContent += "\n";

    // 3. B-Life
    csvContent += "=== 3. 工程預測 B-Life 指標 ===\n";
    csvContent += "指標機率 (Bx),實驗組 A 預估值,實驗組 B 預估值,改進比例\n";

    [1, 5, 10, 20, 50].forEach(b => {
        const R = (100 - b) / 100;
        const calc = (res) => res ? Math.round(res.eta * Math.pow(-Math.log(R), 1 / res.beta)) : 0;
        const tA = calc(analysisResults.groupA), tB = calc(analysisResults.groupB);
        csvContent += `B${b},${tA || '-'},${tB || '-'},${(tA && tB) ? (((tB - tA) / tA * 100).toFixed(1) + '%') : '-'}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Mouldex_Weibull_FullReport.csv`;
    link.click();
}

function generateReport() {
    const element = document.getElementById('reportArea');
    const isDark = !document.body.classList.contains('light-mode');

    // 增加導出時的穩定性，暫時強制背景與寬度
    const originalStyle = element.style.cssText;
    element.style.background = isDark ? "#0f172a" : "#f8fafc";
    element.style.padding = "40px";

    html2canvas(element, {
        scale: 2, // 提高解析度
        useCORS: true,
        backgroundColor: isDark ? "#0f172a" : "#f8fafc",
        windowWidth: 1400,
        onclone: (clonedDoc) => {
            // 在副本中移除可能導致干擾的元素
            const report = clonedDoc.getElementById('reportArea');
            report.style.width = "1400px";
            report.style.margin = "0";
        }
    }).then(canvas => {
        element.style.cssText = originalStyle; // 還原樣式
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `Mouldex_Weibull_Report_${new Date().getTime()}.png`;
        link.click();
    });
}

/**
 * 主題切換功能
 */
function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const btn = document.getElementById('themeToggleBtn');
    const isDark = !document.body.classList.contains('light-mode');
    btn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';

    // 如果已有圖表，則重新繪製以適應新主題
    if (analysisResults) {
        drawAnalytics(analysisResults.groupA, analysisResults.groupB);
    }
}

// 確保全域可用 (Explicitly export to window)
window.toggleTheme = toggleTheme;
window.runAnalysis = runAnalysis;
window.addData = addData;
window.deleteRow = deleteRow;
window.clearData = clearData;
window.clearAllData = resetAll; // 別名整合
window.loadDemo = loadDemo;
window.showBatchInput = showBatchInput;
window.closeBatchInput = closeBatchInput;
window.processBatchInput = processBatchInput;
window.openTheory = openTheory;
window.closeTheory = closeTheory;
window.setAnalysisMode = setAnalysisMode;
window.generateReport = generateReport;
window.exportData = exportData;
