# 📊 Weibull 可靠度分析工具

> 專為可靠度工程設計的 Weibull 分析工具，具備現代化的網頁介面，支援數據輸入、參數估計、分佈繪圖以及可靠度計算。

[![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-blue)](https://chun-chieh-chang.github.io/Weibull-Analysis-Tool/)
[![License](https://img.shields.io/badge/License-Mouldex-green)]()

## 🚀 快速開始

### 線上使用
直接訪問 [GitHub Pages 部署版本](https://chun-chieh-chang.github.io/Weibull-Analysis-Tool/)

### 本地使用
1. 下載 `index.html` 文件
2. 在任何現代瀏覽器中打開

## ✨ 核心功能

- **📈 數據分析**：支持失效數據 (Failure) 與設限數據 (Suspension/Censored) 的輸入
- **🔢 參數估計**：自動計算 Weibull 分佈的形狀參數 (Beta) 與尺度參數 (Eta)
- **📊 圖表分析**：
  - 機率分佈圖 (Probability Plot)
  - 可靠度曲線圖 (Reliability Plot)
- **⚡ 批量處理**：支持批量數據貼上功能，快速處理大量數據
- **📑 報告匯出**：可將分析結果與圖表導出為圖片與報告
- **🌓 雙主題模式**：支援深色/淺色主題切換
- **🔄 單組/雙組模式**：靈活的分析模式選擇

## 📁 專案結構

```
WeibullAnalysis_for_ReliabilityCalculation/
├── index.html              # 主應用程式入口
├── app.js                  # 主應用邏輯
├── styles/                 # 樣式文件
│   ├── main.css           # 主樣式表
│   └── theory.css         # 理論模態樣式
├── docs/                   # 專案文檔
│   ├── README.md          # 詳細專案說明
│   ├── TECHNICAL_LESSONS.md    # 技術經驗總結
│   └── CHANGELOG.md       # 版本更新記錄
├── archives/              # 歷史版本存檔
│   ├── v1.0_single-group-analysis.html
│   ├── v2.0_dual-group-comparison.html
│   └── v2.1_new-layout.html
└── README.md              # 本文件（專案導航）
```

## 🛠️ 技術棧

- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+)
- **Charts**: [Plotly.js](https://plotly.com/javascript/)
- **Math**: [MathJax v3](https://www.mathjax.org/)
- **Export**: [html2canvas](https://html2canvas.hertzen.com/)

## 📖 文檔

- [詳細專案說明](./docs/README.md)
- [技術經驗總結](./docs/TECHNICAL_LESSONS.md)
- [版本更新記錄](./docs/CHANGELOG.md)

## 🔨 開發與維護

### 本地開發
```bash
# 克隆專案
git clone https://github.com/Chun-Chieh-Chang/Weibull-Analysis-Tool.git

# 進入專案目錄
cd WeibullAnalysis_for_ReliabilityCalculation

# 直接在瀏覽器中打開 index.html 即可
```

### 部署到 GitHub Pages
專案已自動配置為 GitHub Pages 部署，每次推送到 `main` 分支後會自動更新。

## 📝 授權

Mouldex 專用工具

## 👥 貢獻

如有問題或建議，歡迎提交 Issue 或 Pull Request。

---

**最後更新**: 2026-01-30  
**維護者**: Chun-Chieh Chang
