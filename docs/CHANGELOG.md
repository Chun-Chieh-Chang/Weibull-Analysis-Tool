# 版本更新記錄 (Changelog)

本文件記錄 Weibull 可靠度分析工具的所有重要更新。

格式基於 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/)，
版本號遵循 [語意化版本](https://semver.org/lang/zh-TW/)。

## [未發布] - 2026-01-30

### 新增
- 📁 基於 MECE 原則重新組織項目結構
- 📝 新增 `REORGANIZATION_PLAN.md` 重組計劃文檔
- 📚 創建 `docs/` 文件夾統一管理專案文檔
- 📦 創建 `archives/` 文件夾管理歷史版本
- 🎨 創建 `styles/` 文件夾組織樣式文件
- 📋 新增 `CHANGELOG.md` 版本更新記錄

### 變更
- 🔧 將 `style.css` 重命名為 `styles/main.css`
- 🔧 將 `theory-styles.css` 重命名為 `styles/theory.css`
- 📝 將 `TECHNICAL_LESSONS.md` 移至 `docs/` 文件夾
- 📄 更新 `README.md` 為項目導航文件
- 🔗 更新 `index.html` 中的 CSS 引用路徑

### 修復
- 🐛 修復 favicon.ico 404 錯誤（添加 SVG data URI favicon）
- 🐛 修復 CSS 語法錯誤（移除多餘的閉合大括號）

### 文檔
- 📖 新增 GitHub Pages 部署常見問題與解決方案文檔
- 📖 新增開發流程最佳實踐檢查清單

## [2.1.0] - 新版面設計

### 新增
- 🌓 深色模式支援（默認開啟）
- 🔄 主題切換按鈕（深色/淺色模式）
- 🎨 現代化 UI 設計
  - 漸變色背景
  - 毛玻璃效果（Glassmorphism）
  - 平滑過渡動畫

### 變更
- 🎨 優化顏色方案，提升對比度和可讀性
- 📊 改進圖表視覺效果（適配深色主題）
- 🔧 重構 CSS 為 CSS 變數系統

## [2.0.0] - 雙組比對版

### 新增
- 🔄 雙組數據分析與比對功能
- 📊 雙組數據並列顯示
- 📈 差異分析面板
- 🎯 單組/雙組模式切換

### 變更
- 🎨 調整版面配置以容納雙組數據
- 📊 優化圖表佈局

### 優化
- ⚡ 提升大數據集處理效能
- 🎨 改進響應式設計

## [1.0.0] - 單組分析版

### 新增
- 📊 Weibull 分佈參數估算
- 📈 機率分佈圖 (Probability Plot)
- 📉 可靠度曲線圖 (Reliability Plot)
- 📥 失效數據與設限數據輸入
- 📋 批量數據貼上功能
- 🖼️ 報告匯出功能
- 📐 MathJax 數學公式渲染
- 🎓 理論說明模態視窗

### 技術實現
- ✨ 使用 Plotly.js 繪製互動式圖表
- 🧮 實現 Maximum Likelihood Estimation (MLE) 算法
- 📊 實現 Median Rank 計算
- 🎯 實現 html2canvas 截圖功能

---

## 圖例說明

- ✨ **新增**: 全新功能
- 🔧 **變更**: 功能修改或重構
- 🐛 **修復**: Bug 修復
- 🗑️ **移除**: 移除功能
- 📚 **文檔**: 文檔更新
- ⚡ **優化**: 性能改進
- 🎨 **UI/UX**: 介面或體驗改進
- 🔒 **安全**: 安全性改進

---

**維護日期**: 2026-01-30
