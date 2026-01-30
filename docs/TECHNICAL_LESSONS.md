# 技術經驗總結：MathJax 與 html2canvas 整合之重影問題

**日期**: 2026-01-24
**專案**: Weibull Reliability Analysis Tool
**問題**: 透過 html2canvas 生成網頁截圖報告時，MathJax 渲染的數學公式出現嚴重重影 (Ghosting) 和模糊現象。

## 🔴 問題現象
- 使用 `html2canvas` 截取包含 MathJax (v3) 公式的區域時，輸出的圖片中，數學公式文字會出現疊加、模糊或雙重殘影。
- 嘗試使用 `imageSmoothingEnabled = false` 無法解決。
- 嘗試在 `onclone` 中移除元素或隱藏元素效果不穩定。

## 🔍 根本原因 (Root Cause)
1.  **隱形輔助層 (`mjx-assistive-mml`)**:
    MathJax 為了無障礙 (a11y) 支援，會在可見的 SVG/HTML 公式後方生成一段 `mjx-assistive-mml` 代碼。這段代碼雖然透過 CSS (如 `clip: rect(1px, 1px, 1px, 1px)`) 對肉眼隱藏，但 `html2canvas` 的渲染引擎會忽略這些特殊的隱藏技巧，將其強制渲染出來，與原本的公式疊加，造成重影。

2.  **Clone 時序問題**:
    `html2canvas` 運作時會複製 DOM。如果在複製後的 `onclone` 回調中才嘗試移除這些元素，往往因渲染時序或樣式計算問題，導致移除無效或為時已晚。

## ✅ 解決方案 (The "Nuclear" Option)

最穩健的解法是**「物理移除 (Physical Removal)」**。不依賴 CSS 隱藏，而是在執行截圖前，直接從 DOM 中刪除干擾元素。

### 關鍵代碼實作

```javascript
async function generateReport() {
    // 1. 強制 MathJax 完成渲染
    if (window.MathJax && window.MathJax.typesetPromise) {
        await window.MathJax.typesetPromise();
    }

    // 2. [關鍵步驟] 截圖前：實體移除所有隱形輔助層
    // 不要只用 display: none，直接 remove() 最保險
    const ghosts = document.querySelectorAll('mjx-assistive-mml');
    if (ghosts.length > 0) {
        ghosts.forEach(el => el.remove());
    }

    // 3. 執行 html2canvas
    const canvas = await html2canvas(element, {
       // ... 其他設定
       onclone: (clonedDoc) => {
           // 4. 雙重保險：在 Clone 的文件中再次清理 (防止有漏網之魚或動態生成的)
           const cloneGhosts = clonedDoc.querySelectorAll('mjx-assistive-mml');
           cloneGhosts.forEach(el => el.remove());
           
           // 5. 強制 CSS 覆蓋 (防止陰影導致的模糊)
           const all = clonedDoc.querySelectorAll('*');
           all.forEach(el => {
               el.style.textShadow = 'none';
               el.style.boxShadow = 'none';
           });
       }
    });
}
```

## 📝 其他優化細節
1.  **降低 Scale**: 過高的 `scale` (如 6x) 容易導致次像素渲染偏移。建議使用 `scale: 2` ~ `scale: 4` 即可獲得清晰且正確的結果。
2.  **CSS 注入**: 為了保險起見，可在全域 CSS 中加入 `mjx-assistive-mml { display: none !important; }`。
3.  **Plotly 圖表匯出**: 若使用 Plotly，應優先使用其原生 `Plotly.downloadImage` API，而非嘗試用 html2canvas 去截取 Plotly 的 DOM，後者常有相容性問題。

---

# GitHub Pages 部署常見問題與解決方案

**日期**: 2026-01-30  
**專案**: Weibull Reliability Analysis Tool  
**環境**: GitHub Pages 靜態網頁部署

## 🔴 問題 1: Favicon 404 錯誤

### 問題現象
- 在 GitHub Pages 部署的網頁中，瀏覽器 Console 出現 `GET https://chun-chieh-chang.github.io/favicon.ico 404 (Not Found)` 錯誤
- 瀏覽器會自動嘗試載入網站根目錄的 `favicon.ico` 文件
- 雖然不影響功能，但會在控制台產生紅色錯誤訊息

### 根本原因
1. **瀏覽器默認行為**: 所有現代瀏覽器都會自動嘗試載入網站的 favicon（網站圖標）
2. **HTML 缺少 favicon 聲明**: 如果 HTML `<head>` 中沒有明確指定 favicon，瀏覽器會自動嘗試從根目錄載入 `favicon.ico`
3. **靜態部署限制**: GitHub Pages 部署時，若未明確包含 favicon 文件，就會產生 404 錯誤

### ✅ 解決方案

**方法 1: 使用 SVG data URI（推薦）**

直接在 HTML `<head>` 中嵌入 SVG 格式的 favicon，無需額外文件：

```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Page Title</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📊</text></svg>">
    <!-- 其他資源 -->
</head>
```

**優點**:
- ✅ 無需額外文件，一站式解決
- ✅ 支持 emoji 或簡單圖形
- ✅ 體積小，載入快速
- ✅ 適合快速開發和原型

**方法 2: 使用透明 PNG data URI**

如果需要相容性更好的方案：

```html
<link rel="icon" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==">
```

**方法 3: 上傳實體 favicon 文件**

將 favicon.ico 或 favicon.png 文件放在項目根目錄，並在 HTML 中引用：

```html
<link rel="icon" type="image/png" href="./favicon.png">
```

### 最佳實踐
- 🎯 **開發階段**: 使用 data URI 方式，快速且不需要管理額外文件
- 🎯 **正式產品**: 考慮使用專業設計的 favicon.ico，提升品牌形象
- 🎯 **多尺寸支援**: 可以添加多個不同尺寸的 favicon 以支援不同設備

## 🔴 問題 2: CSS 語法錯誤 - 多餘的閉合大括號

### 問題現象
- CSS 出現 `at-rule or selector expected` 錯誤
- 樣式表無法正確解析
- 部分 CSS 規則失效

### 根本原因
在編輯 CSS 過程中，不小心在 `@media` 查詢區塊或其他選擇器後添加了多餘的閉合大括號 `}`，導致語法結構錯誤。

**錯誤示例**:
```css
@media (max-width: 1200px) {
    .charts-container {
        width: 95%;
    }
}
}  /* ❌ 多餘的閉合大括號 */
}  /* ❌ 多餘的閉合大括號 */

/* 以下的 CSS 規則可能無法正確解析 */
.mode-dual .group-panel {
    flex: 0 0 auto;
}
```

### ✅ 解決方案

**檢查和修復步驟**:

1. **使用 IDE 的語法檢查**: 現代編輯器（如 VSCode）會自動標註 CSS 語法錯誤
2. **檢查大括號配對**: 確保每個 `{` 都有對應的 `}`
3. **使用 CSS 格式化工具**: 使用 Prettier 或內建格式化功能可以幫助發現結構問題
4. **逐塊註釋測試**: 如果錯誤難以定位，可以逐塊註釋 CSS，縮小問題範圍

**正確的代碼**:
```css
@media (max-width: 1200px) {
    .charts-container {
        width: 95%;
    }
}  /* ✅ 只有一個閉合大括號 */

/* 以下的 CSS 規則正常解析 */
.mode-dual .group-panel {
    flex: 0 0 auto;
}
```

### 預防措施
- 🛡️ **使用代碼編輯器的自動補全**: 讓編輯器自動管理大括號
- 🛡️ **啟用 Linter**: 使用 stylelint 等工具提前發現語法錯誤
- 🛡️ **代碼審查**: 在提交前檢查 Console 是否有 CSS 錯誤
- 🛡️ **使用 Git**: 透過版本控制可以輕鬆回溯到正確的版本

## 📋 開發流程最佳實踐總結

### 部署前檢查清單
- [ ] 確認所有資源路徑正確（相對路徑 vs 絕對路徑）
- [ ] 檢查 Console 無任何錯誤（404、語法錯誤等）
- [ ] 確認 favicon 已正確設置
- [ ] CSS 和 JavaScript 語法驗證通過
- [ ] 在本地測試完整功能
- [ ] 檢查響應式設計在不同設備上的表現

### 除錯技巧
1. **優先查看 Console**: 瀏覽器開發者工具的 Console 是第一診斷工具
2. **逐步排除法**: 將問題縮小到最小可重現範圍
3. **版本對比**: 使用 Git 對比最近的更改，找出引入問題的提交
4. **文檔先行**: 遇到問題立即記錄，形成知識庫

### 代碼品質管理
- ✨ **定期重構**: 清理冗餘代碼和樣式
- ✨ **模塊化設計**: 將功能拆分成獨立模塊
- ✨ **註釋說明**: 在關鍵邏輯處添加註釋
- ✨ **保持一致性**: 遵循統一的命名規範和代碼風格

---
*此文件由 AI 助手與開發者共同調試後歸檔，以備參考。*  
*最後更新: 2026-01-30*
