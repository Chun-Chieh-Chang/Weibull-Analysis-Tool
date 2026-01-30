# 項目重組計劃 - 基於 MECE 原則

**日期**: 2026-01-30  
**專案**: Weibull Analysis Tool  
**原則**: MECE (Mutually Exclusive, Collectively Exhaustive)

## 📊 當前結構分析

### 現有文件清單
```
WeibullAnalysis_for_ReliabilityCalculation/
├── .git/                    # Git 版本控制
├── .github/                 # GitHub 設定
├── .gitignore              # Git 忽略規則
├── .vscode/                # VSCode 設定（被忽略）
├── README.md               # 專案說明
├── TECHNICAL_LESSONS.md    # 技術文檔
├── index.html              # 主應用程式
├── app.js                  # 主應用邏輯
├── style.css               # 主樣式表
├── theory-styles.css       # 理論模態樣式
├── ResultData/             # 結果數據（被忽略）
└── backup/                 # 備份文件（被忽略）
    ├── TECHNICAL_LESSONS.md（重複）
    ├── 利用Weibull分析計算可靠度_單組分析.html
    ├── 利用Weibull分析計算可靠度_新版面.html
    └── 利用Weibull分析計算可靠度_雙組比對版.html
```

### 問題識別
1. **重複文件**: `TECHNICAL_LESSONS.md` 存在於根目錄和 backup/ 中
2. **命名不一致**: backup/ 中的 HTML 文件使用中文長檔名
3. **結構混亂**: backup/ 既包含舊版本也包含文檔
4. **分類不清**: 無法區分哪些是活躍版本、歷史版本、文檔

## 🎯 MECE 重組方案

### 第一層分類（互相獨立、完全窮盡）

```
WeibullAnalysis_for_ReliabilityCalculation/
├── 📁 src/                  # 源代碼（Source Code）
│   ├── index.html          # 當前生產版本
│   ├── app.js              # 主應用邏輯
│   ├── styles/             # 樣式文件
│   │   ├── main.css        # 主樣式
│   │   └── theory.css      # 理論模態樣式
│   └── assets/             # 靜態資源（如有圖片、字體等）
│
├── 📁 docs/                 # 文檔（Documentation）
│   ├── README.md           # 專案概述
│   ├── TECHNICAL_LESSONS.md # 技術經驗總結
│   ├── CHANGELOG.md        # 版本更新記錄
│   └── USER_GUIDE.md       # 使用手冊
│
├── 📁 archives/             # 歷史版本（Archives）
│   ├── v1.0_single-group.html
│   ├── v2.0_dual-group.html
│   └── v2.1_new-layout.html
│
├── 📁 data/                 # 數據文件（Data）
│   └── samples/            # 示例數據
│
├── 📁 .github/              # GitHub 配置
│   └── workflows/          # CI/CD 工作流
│
├── .gitignore              # Git 忽略規則
└── LICENSE                 # 授權文件
```

### 分類邏輯說明

#### 1. **src/** - 源代碼
- **用途**: 所有活躍的、生產環境使用的代碼
- **互斥性**: 與 archives/ 互斥（不包含舊版本）
- **內容**: 
  - HTML 入口文件
  - JavaScript 邏輯
  - CSS 樣式（分類到子文件夾）
  - 靜態資源

#### 2. **docs/** - 文檔
- **用途**: 所有說明文檔、技術筆記、指南
- **互斥性**: 與 src/ 和 archives/ 互斥（純文檔，無代碼）
- **內容**:
  - 專案 README
  - 技術經驗總結
  - 版本更新記錄
  - 使用手冊

#### 3. **archives/** - 歷史版本
- **用途**: 已棄用或舊版本的完整文件
- **互斥性**: 與 src/ 互斥（非活躍版本）
- **內容**: 
  - 按版本號命名的舊 HTML 文件
  - 便於回溯和參考

#### 4. **data/** - 數據
- **用途**: 示例數據、測試數據、結果數據
- **互斥性**: 與代碼和文檔分離
- **內容**:
  - 示例數據集
  - 測試案例數據

## 📝 實施步驟

### Phase 1: 創建新結構
1. 創建 `src/`, `docs/`, `archives/`, `data/` 文件夾
2. 創建 `src/styles/` 子文件夾

### Phase 2: 移動文件
1. **源代碼**:
   - `index.html` → `src/index.html`
   - `app.js` → `src/app.js`
   - `style.css` → `src/styles/main.css`
   - `theory-styles.css` → `src/styles/theory.css`

2. **文檔**:
   - `README.md` → `docs/README.md`
   - `TECHNICAL_LESSONS.md` → `docs/TECHNICAL_LESSONS.md`
   - 創建 `docs/CHANGELOG.md`

3. **歷史版本**:
   - `backup/利用Weibull分析計算可靠度_單組分析.html` → `archives/v1.0_single-group.html`
   - `backup/利用Weibull分析計算可靠度_雙組比對版.html` → `archives/v2.0_dual-group.html`
   - `backup/利用Weibull分析計算可靠度_新版面.html` → `archives/v2.1_new-layout.html`

4. **清理**:
   - 刪除 `backup/` 文件夾
   - 刪除根目錄重複的文件

### Phase 3: 更新配置
1. 更新 `.gitignore`:
   - 移除 `backup/`（已不存在）
   - 添加 `data/` 到忽略列表（如需要）
   
2. 創建根目錄 `README.md` 作為導航文件

### Phase 4: GitHub Pages 配置
1. 確認 GitHub Pages 指向正確路徑（可能需要指向 `src/` 或在根目錄放置 index.html）
2. 添加部署說明文件

## ⚠️ 注意事項

1. **GitHub Pages 路徑**: GitHub Pages 默認從根目錄或 `docs/` 提供服務，需要調整策略
   - **選項 A**: 在根目錄保留 `index.html`，其他組織到子文件夾
   - **選項 B**: 使用 GitHub Pages 的 `docs/` 模式，將代碼放入 `docs/`
   - **推薦**: 選項 A，保持根目錄簡潔但功能完整

2. **檔案引用路徑**: 移動 CSS/JS 文件後，需要更新 HTML 中的引用路徑

3. **Git 歷史**: 使用 `git mv` 命令以保留文件歷史

## 🎯 最終建議結構（適配 GitHub Pages）

```
WeibullAnalysis_for_ReliabilityCalculation/
├── index.html              # 主入口（GitHub Pages 需要）
├── app.js                  # 主應用邏輯
├── styles/                 # 樣式文件
│   ├── main.css
│   └── theory.css
├── docs/                   # 文檔
│   ├── README.md
│   ├── TECHNICAL_LESSONS.md
│   └── CHANGELOG.md
├── archives/               # 歷史版本
│   ├── v1.0_single-group.html
│   ├── v2.0_dual-group.html
│   └── v2.1_new-layout.html
├── .github/
├── .gitignore
└── README.md              # 專案導航
```

這個結構：
- ✅ 符合 MECE 原則
- ✅ 與 GitHub Pages 兼容
- ✅ 清晰的分類邏輯
- ✅ 易於維護和擴展
