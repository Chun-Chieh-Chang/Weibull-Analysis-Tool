// 全域變數
let dataGroupA = [];
let dataGroupB = [];
let chartProb = true;
let chartRel = true;
let analysisResults = null;
let t95PointsData = [];
let markerReliabilityPercent = 95;
let currentBatchGroup = '';

// 初始化
window.onload = function () {
    setupEventListeners();
    // 設定焦點
    const tInputA = document.getElementById('tInputA');
    if (tInputA) tInputA.focus();
};

function setupEventListeners() {
    // 組A Enter鍵監聽
    const tInputA = document.getElementById('tInputA');
    const sInputA = document.getElementById('sInputA');
    if (tInputA) {
        tInputA.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); addData('A'); }
        });
    }
    if (sInputA) {
        sInputA.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); addData('A'); }
        });
    }

    // 組B Enter鍵監聽
    const tInputB = document.getElementById('tInputB');
    const sInputB = document.getElementById('sInputB');
    if (tInputB) {
        tInputB.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); addData('B'); }
        });
    }
    if (sInputB) {
        sInputB.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); addData('B'); }
        });
    }

    // 可靠度輸入即時更新標示
    const inputRel = document.getElementById('inputReliability');
    if (inputRel) {
        const handler = () => {
            const val = parseFloat(inputRel.value);
            if (isNaN(val) || val <= 0 || val >= 100) return;
            markerReliabilityPercent = val;
            updateReliabilityMarkers(markerReliabilityPercent);
        };
        inputRel.addEventListener('input', handler);
        inputRel.addEventListener('change', handler);
    }
}

function addData(group) {
    const tInput = document.getElementById(`tInput${group}`);
    const sInput = document.getElementById(`sInput${group}`);
    const t = parseFloat(tInput.value);
    const s = sInput.value;

    if (isNaN(t) || t <= 0) {
        if (tInput.value !== "") alert("請輸入大於 0 的有效壽命");
        return;
    }

    if (group === 'A') {
        dataGroupA.push({ t: t, s: s });
        sortDataArray('A');
        updateTable('A');
    } else {
        dataGroupB.push({ t: t, s: s });
        sortDataArray('B');
        updateTable('B');
    }

    tInput.value = '';
    tInput.focus();
}

function sortDataArray(group) {
    const data = group === 'A' ? dataGroupA : dataGroupB;
    data.sort((a, b) => {
        if (a.t !== b.t) return a.t - b.t;
        return (a.s === 'F' ? -1 : 1);
    });
}

function updateTable(group) {
    const data = group === 'A' ? dataGroupA : dataGroupB;
    const tbody = document.querySelector(`#dataTable${group} tbody`);
    if (!tbody) return;
    tbody.innerHTML = '';

    const failColor = getComputedStyle(document.documentElement).getPropertyValue('--danger').trim() || '#f72585';
    const suspColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#4361ee';

    data.forEach((item, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="color:#64748b;">${idx + 1}</td>
            <td style="font-weight:600;">${item.t}</td>
            <td style="color:${item.s === 'F' ? failColor : suspColor}; font-weight:600;">
                ${item.s === 'F' ? '失效' : '設限'}
            </td>
            <td><button class="btn-del" onclick="deleteRow('${group}', ${idx})"><i class="fas fa-times"></i>×</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function deleteRow(group, idx) {
    if (group === 'A') {
        dataGroupA.splice(idx, 1);
        updateTable('A');
    } else {
        dataGroupB.splice(idx, 1);
        updateTable('B');
    }
}

function clearData(group) {
    if (!confirm(`確定要清空組別 ${group} 的所有數據嗎？`)) return;

    if (group === 'A') {
        dataGroupA = [];
        updateTable('A');
    } else {
        dataGroupB = [];
        updateTable('B');
    }
}

function clearAllData() {
    if (!confirm('確定要清空兩組的所有數據和圖表嗎？')) return;

    dataGroupA = [];
    dataGroupB = [];
    analysisResults = null;
    t95PointsData = [];

    updateTable('A');
    updateTable('B');

    try {
        Plotly.purge('chartProb');
        Plotly.purge('chartRel');
        chartProb = false;
        chartRel = false;
    } catch (e) {
        console.log('圖表清除:', e);
    }

    document.getElementById('resultPanel').classList.remove('show');
    document.getElementById('groupResultA').classList.remove('show');
    document.getElementById('groupResultB').classList.remove('show');
    document.getElementById('diffPanel').classList.remove('show');

    alert('✅ 已清空所有數據和圖表！');
}

function loadDemo(group) {
    const demoData = [
        { t: 300, s: 'F' }, { t: 100, s: 'F' }, { t: 250, s: 'S' },
        { t: 150, s: 'F' }, { t: 550, s: 'F' }, { t: 120, s: 'S' },
        { t: 400, s: 'F' }, { t: 200, s: 'F' }
    ];

    if (group === 'A') {
        dataGroupA = [...demoData];
        sortDataArray('A');
        updateTable('A');
    } else {
        const demoBData = demoData.map(d => ({ t: Math.round(d.t * 1.25 * 10) / 10, s: d.s }));
        dataGroupB = demoBData;
        sortDataArray('B');
        updateTable('B');
    }

    alert(`✅ 已載入組別 ${group} 的範例數據！`);
}

// 批次輸入功能
function showBatchInput(group) {
    currentBatchGroup = group;
    document.getElementById('batchTitle').textContent = `批次輸入數據 - 組別 ${group}`;
    document.getElementById('batchModal').style.display = 'flex';
    document.getElementById('batchTextarea').value = '';
    document.getElementById('batchTextarea').focus();
}

function closeBatchInput() {
    document.getElementById('batchModal').style.display = 'none';
    currentBatchGroup = '';
}

function processBatchInput() {
    const textarea = document.getElementById('batchTextarea');
    const text = textarea.value.trim();

    if (!text) {
        alert("請輸入數據！");
        return;
    }

    const lines = text.split('\n');
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    lines.forEach((line, index) => {
        line = line.trim();
        if (!line) return;

        const parts = line.split(/[\t,\s]+/);

        if (parts.length < 2) {
            errors.push(`第 ${index + 1} 行：格式錯誤（需要兩欄數據）`);
            errorCount++;
            return;
        }

        const t = parseFloat(parts[0]);
        let s = parts[1].toUpperCase();

        if (isNaN(t) || t <= 0) {
            errors.push(`第 ${index + 1} 行：壽命必須是大於 0 的數字`);
            errorCount++;
            return;
        }

        if (s !== 'F' && s !== 'S') {
            errors.push(`第 ${index + 1} 行：狀態必須是 F 或 S`);
            errorCount++;
            return;
        }

        if (currentBatchGroup === 'A') {
            dataGroupA.push({ t: t, s: s });
        } else {
            dataGroupB.push({ t: t, s: s });
        }
        successCount++;
    });

    if (successCount > 0) {
        if (currentBatchGroup === 'A') {
            sortDataArray('A');
            updateTable('A');
        } else {
            sortDataArray('B');
            updateTable('B');
        }
    }

    closeBatchInput();

    if (errorCount > 0) {
        alert(`✅ 成功加入 ${successCount} 筆數據\n❌ ${errorCount} 筆數據有誤：\n\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...(更多錯誤)' : ''}`);
    } else {
        alert(`✅ 成功加入 ${successCount} 筆數據！`);
    }
}

// ========== Weibull 分析核心功能 ==========
function runAnalysis() {
    const hasDataA = dataGroupA.length > 0;
    const hasDataB = dataGroupB.length > 0;

    if (!hasDataA && !hasDataB) {
        alert("❌ 請至少輸入一組數據！");
        return;
    }

    let resultsA = null;
    if (hasDataA) {
        resultsA = analyzeGroup(dataGroupA, 'A');
        if (!resultsA) return;
    }

    let resultsB = null;
    if (hasDataB) {
        resultsB = analyzeGroup(dataGroupB, 'B');
        if (!resultsB) return;
    }

    analysisResults = {
        groupA: resultsA,
        groupB: resultsB,
        mode: (hasDataA && hasDataB) ? 'dual' : 'single'
    };

    displayResults(resultsA, resultsB);
    drawCharts(resultsA, resultsB);

    alert('✅ 分析完成！\n\n📊 圖表已繪製完成。');
}

function analyzeGroup(data, group) {
    const failures = data.filter(d => d.s === 'F');
    if (failures.length < 2) {
        alert(`❌ 組別 ${group} 至少需要 2 個失效數據才能計算參數。`);
        return null;
    }

    const N = data.length;
    let points = [];
    let previousOrderNumber = 0;

    for (let i = 0; i < N; i++) {
        let item = data[i];
        let reverseRank = N - i;
        let increment = ((N + 1) - previousOrderNumber) / reverseRank;
        let newOrderNumber = previousOrderNumber + increment;

        if (item.s === 'F') {
            let medianRank = (newOrderNumber - 0.3) / (N + 0.4);
            if (medianRank >= 0.99999) medianRank = 0.99999;

            let x = Math.log(item.t);
            let term = -Math.log(1 - medianRank);
            let y = Math.log(term);

            if (isFinite(x) && isFinite(y)) {
                points.push({ x: x, y: y });
            }
        }
        previousOrderNumber = newOrderNumber;
    }

    if (points.length < 2) {
        alert(`❌ 組別 ${group} 有效數據點不足，無法擬合。`);
        return null;
    }

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    let nP = points.length;

    points.forEach(p => {
        sumX += p.x;
        sumY += p.y;
        sumXY += (p.x * p.y);
        sumXX += (p.x * p.x);
    });

    let slope = (nP * sumXY - sumX * sumY) / (nP * sumXX - sumX * sumX);
    let intercept = (sumY - slope * sumX) / nP;

    let beta = slope;
    let eta = Math.exp(-intercept / beta);

    let yMean = sumY / nP;
    let ssTot = points.reduce((acc, p) => acc + Math.pow(p.y - yMean, 2), 0);
    let ssRes = points.reduce((acc, p) => acc + Math.pow(p.y - (slope * p.x + intercept), 2), 0);
    let r2 = 1 - (ssRes / ssTot);

    let typeText = "";
    if (beta < 1) typeText = "早期失效 (Infant Mortality)";
    else if (beta < 1.1) typeText = "隨機失效 (Constant Failure Rate)";
    else typeText = "磨耗失效 (Wear-out)";

    return {
        beta: beta,
        eta: eta,
        r2: r2,
        typeText: typeText,
        points: points,
        slope: slope,
        intercept: intercept,
        maxT: data[data.length - 1].t
    };
}

function displayResults(resultsA, resultsB) {
    const resultPanel = document.getElementById('resultPanel');
    const groupResultA = document.getElementById('groupResultA');
    const groupResultB = document.getElementById('groupResultB');
    const diffPanel = document.getElementById('diffPanel');

    resultPanel.classList.add('show');

    if (resultsA) {
        groupResultA.classList.add('show');
        document.getElementById('groupATitleResult').textContent = document.getElementById('groupNameA').value;
        document.getElementById('valBetaA').textContent = resultsA.beta.toFixed(4);
        document.getElementById('valEtaA').textContent = resultsA.eta.toFixed(2);
        document.getElementById('valR2A').textContent = resultsA.r2.toFixed(4);
        document.getElementById('descTextA').textContent = resultsA.typeText;
    } else {
        groupResultA.classList.remove('show');
    }

    if (resultsB) {
        groupResultB.classList.add('show');
        document.getElementById('groupBTitleResult').textContent = document.getElementById('groupNameB').value;
        document.getElementById('valBetaB').textContent = resultsB.beta.toFixed(4);
        document.getElementById('valEtaB').textContent = resultsB.eta.toFixed(2);
        document.getElementById('valR2B').textContent = resultsB.r2.toFixed(4);
        document.getElementById('descTextB').textContent = resultsB.typeText;
    } else {
        groupResultB.classList.remove('show');
    }

    if (resultsA && resultsB) {
        diffPanel.classList.add('show');
        const betaDiff = ((resultsB.beta - resultsA.beta) / resultsA.beta * 100);
        const etaDiff = ((resultsB.eta - resultsA.eta) / resultsA.eta * 100);

        document.getElementById('diffBeta').textContent = (betaDiff >= 0 ? '+' : '') + betaDiff.toFixed(2) + '%';
        document.getElementById('diffEta').textContent = (etaDiff >= 0 ? '+' : '') + etaDiff.toFixed(2) + '%';
        document.getElementById('diffImprovement').textContent = (etaDiff >= 0 ? '+' : '') + etaDiff.toFixed(2) + '%';

        let interpretation = '';
        if (etaDiff > 10) interpretation = '✅ 組別 B 壽命顯著優於組別 A';
        else if (etaDiff > 0) interpretation = '✓ 組別 B 壽命略優於組別 A';
        else if (etaDiff > -10) interpretation = '≈ 兩組壽命相近';
        else interpretation = '⚠️ 組別 B 壽命低於組別 A';
        document.getElementById('diffInterpretation').textContent = interpretation;
    } else {
        diffPanel.classList.remove('show');
    }
}

// ========== Plotly 圖表繪製功能 ==========
function drawCharts(resultsA, resultsB) {
    t95PointsData = [];
    const groupNameA = document.getElementById('groupNameA').value;
    const groupNameB = document.getElementById('groupNameB').value;

    const colorA = getComputedStyle(document.documentElement).getPropertyValue('--group-a-color').trim() || '#4361ee';
    const colorB = getComputedStyle(document.documentElement).getPropertyValue('--group-b-color').trim() || '#f72585';

    // ===== Probability Plot =====
    let probTraces = [];
    if (resultsA) {
        let minX = Math.min(...resultsA.points.map(p => p.x));
        let maxX = Math.max(...resultsA.points.map(p => p.x));
        probTraces.push({
            x: resultsA.points.map(p => p.x),
            y: resultsA.points.map(p => p.y),
            mode: 'markers',
            type: 'scatter',
            name: `${groupNameA} - 數據點`,
            marker: { color: colorA, size: 8, line: { width: 1, color: 'white' } }
        });
        probTraces.push({
            x: [minX - 0.5, maxX + 0.5],
            y: [resultsA.slope * (minX - 0.5) + resultsA.intercept, resultsA.slope * (maxX + 0.5) + resultsA.intercept],
            mode: 'lines',
            type: 'scatter',
            name: `${groupNameA} - 擬合線`,
            line: { color: colorA, width: 2, dash: 'dash' }
        });
    }

    if (resultsB) {
        let minX = Math.min(...resultsB.points.map(p => p.x));
        let maxX = Math.max(...resultsB.points.map(p => p.x));
        probTraces.push({
            x: resultsB.points.map(p => p.x),
            y: resultsB.points.map(p => p.y),
            mode: 'markers',
            type: 'scatter',
            name: `${groupNameB} - 數據點`,
            marker: { color: colorB, size: 8, line: { width: 1, color: 'white' } }
        });
        probTraces.push({
            x: [minX - 0.5, maxX + 0.5],
            y: [resultsB.slope * (minX - 0.5) + resultsB.intercept, resultsB.slope * (maxX + 0.5) + resultsB.intercept],
            mode: 'lines',
            type: 'scatter',
            name: `${groupNameB} - 擬合線`,
            line: { color: colorB, width: 2, dash: 'dash' }
        });
    }

    const probLayout = {
        title: { text: 'Weibull Probability Plot', font: { family: 'Outfit, sans-serif', size: 18, color: '#1e293b' } },
        xaxis: { title: 'ln(t)', gridcolor: '#f1f5f9' },
        yaxis: { title: 'ln(-ln(1-F(t)))', gridcolor: '#f1f5f9' },
        plot_bgcolor: 'white',
        paper_bgcolor: 'white',
        margin: { l: 60, r: 20, t: 60, b: 60 },
        legend: { x: 0, y: 1, bgcolor: 'rgba(255, 255, 255, 0.8)' },
        font: { family: 'Inter, sans-serif' }
    };

    Plotly.newPlot('chartProb', probTraces, probLayout, { responsive: true, displaylogo: false });

    // ===== Reliability Curve =====
    let relTraces = [];
    if (resultsA) {
        let x = [], y = [];
        let max = resultsA.maxT * 1.5;
        for (let t = 0; t <= max; t += max / 200) {
            x.push(t);
            y.push(Math.exp(-Math.pow(t / resultsA.eta, resultsA.beta)) * 100);
        }
        relTraces.push({ x, y, mode: 'lines', name: `${groupNameA} - R(t)`, line: { color: colorA, width: 3 } });
    }

    if (resultsB) {
        let x = [], y = [];
        let max = resultsB.maxT * 1.5;
        for (let t = 0; t <= max; t += max / 200) {
            x.push(t);
            y.push(Math.exp(-Math.pow(t / resultsB.eta, resultsB.beta)) * 100);
        }
        relTraces.push({ x, y, mode: 'lines', name: `${groupNameB} - R(t)`, line: { color: colorB, width: 3 } });
    }

    const relLayout = {
        title: { text: 'Reliability Curve Comparison', font: { family: 'Outfit, sans-serif', size: 18, color: '#1e293b' } },
        xaxis: { title: '壽命 (t)', gridcolor: '#f1f5f9' },
        yaxis: { title: '可靠度 (%)', range: [0, 100], gridcolor: '#f1f5f9' },
        plot_bgcolor: 'white',
        paper_bgcolor: 'white',
        margin: { l: 60, r: 20, t: 60, b: 60 },
        legend: { x: 1, xanchor: 'right', y: 1 },
        font: { family: 'Inter, sans-serif' }
    };

    Plotly.newPlot('chartRel', relTraces, relLayout, { responsive: true, displaylogo: false });

    if (markerReliabilityPercent) updateReliabilityMarkers(markerReliabilityPercent);
}

function updateReliabilityMarkers(percent) {
    if (!analysisResults || (!analysisResults.groupA && !analysisResults.groupB)) return;
    const R = percent / 100;
    const shapes = [];
    const annotations = [];

    const groupNameA = document.getElementById('groupNameA')?.value || 'A';
    const groupNameB = document.getElementById('groupNameB')?.value || 'B';
    const colorA = getComputedStyle(document.documentElement).getPropertyValue('--group-a-color').trim() || '#4361ee';
    const colorB = getComputedStyle(document.documentElement).getPropertyValue('--group-b-color').trim() || '#f72585';

    const relDiv = document.getElementById('chartRel');
    if (relDiv && relDiv.data) {
        const deleteIdx = [];
        relDiv.data.forEach((tr, i) => {
            if (tr?.name === '__markerA__' || tr?.name === '__markerB__') deleteIdx.push(i);
        });
        if (deleteIdx.length) Plotly.deleteTraces('chartRel', deleteIdx);
    }

    if (analysisResults.groupA) {
        const tA = analysisResults.groupA.eta * Math.pow(-Math.log(R), 1 / analysisResults.groupA.beta);
        shapes.push({ type: 'line', x0: tA, x1: tA, y0: 0, y1: 100, line: { color: colorA, width: 2, dash: 'dot' } });
        annotations.push({ x: tA, y: 85, text: `${groupNameA}: B${100 - percent}=${tA.toFixed(2)}`, showarrow: false, bgcolor: 'white', bordercolor: colorA, borderwidth: 1 });
        Plotly.addTraces('chartRel', [{ x: [tA], y: [percent], mode: 'markers', name: '__markerA__', showlegend: false, marker: { size: 10, color: colorA, line: { width: 2, color: 'white' } } }]);
    }

    if (analysisResults.groupB) {
        const tB = analysisResults.groupB.eta * Math.pow(-Math.log(R), 1 / analysisResults.groupB.beta);
        shapes.push({ type: 'line', x0: tB, x1: tB, y0: 0, y1: 100, line: { color: colorB, width: 2, dash: 'dot' } });
        annotations.push({ x: tB, y: 70, text: `${groupNameB}: B${100 - percent}=${tB.toFixed(2)}`, showarrow: false, bgcolor: 'white', bordercolor: colorB, borderwidth: 1 });
        Plotly.addTraces('chartRel', [{ x: [tB], y: [percent], mode: 'markers', name: '__markerB__', showlegend: false, marker: { size: 10, color: colorB, line: { width: 2, color: 'white' } } }]);
    }

    Plotly.relayout('chartRel', { shapes, annotations });
}

// ========== 數據和圖表匯出功能 ==========
function exportData() {
    if (!analysisResults) { alert("❌ 請先執行分析！"); return; }
    const mode = analysisResults.mode;
    let csv = `\ufeffWeibull Analysis Report\n\n`;
    
    // Simplistic export for brevity in this assistant example
    csv += "Group,Beta,Eta,R2,Mode\n";
    if (analysisResults.groupA) csv += `A,${analysisResults.groupA.beta},${analysisResults.groupA.eta},${analysisResults.groupA.r2},${analysisResults.groupA.typeText}\n`;
    if (analysisResults.groupB) csv += `B,${analysisResults.groupB.beta},${analysisResults.groupB.eta},${analysisResults.groupB.r2},${analysisResults.groupB.typeText}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Weibull_Analysis_${new Date().getTime()}.csv`;
    link.click();
}

function exportCharts() {
    if (!analysisResults) { alert("❌ 請先執行分析！"); return; }
    Plotly.downloadImage('chartProb', { format: 'png', width: 1200, height: 800, filename: 'Weibull_Prob_Plot' });
    setTimeout(() => {
        Plotly.downloadImage('chartRel', { format: 'png', width: 1200, height: 800, filename: 'Weibull_Rel_Curve' });
    }, 500);
}

async function generateReport() {
    if (!analysisResults) { alert("❌ 請先執行分析！"); return; }
    const reportArea = document.getElementById('reportArea');
    const canvas = await html2canvas(reportArea, { scale: 2 });
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `Report_${new Date().getTime()}.png`;
    link.click();
}

function openTheory() { document.getElementById('theoryModal').style.display = 'flex'; }
function closeTheory() { document.getElementById('theoryModal').style.display = 'none'; }
