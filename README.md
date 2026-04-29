# 配速計算機 (Pace Calculator) 🏃‍♂️💨

**配速計算機** 是一個專為跑者設計的配速換算工具，無論是田徑場訓練、跑步機換算，還是比賽成績預測，都能輕鬆搞定！

🌐 **線上使用**: [https://imhahac.github.io/running-pace-calculator/](https://imhahac.github.io/running-pace-calculator/)

## ✨ 主要功能

### 1. ⚡ 即時配速換算
*   輸入 **配速 (Pace)**，自動換算成時速、分段時間。
*   支援 **公里 (km)** 與 **英哩 (mile)** 切換。

### 2. 🏟️ 田徑場計算機
*   支援 **標準 400m 田徑場** 與 **300m 暖身場** 切換。
*   可選擇 **第 1 ~ 8 道**，系統會自動根據道次距離修正秒數。
*   即時顯示 100m, 200m, 400m... 到 2000m 的分段計時。

### 3. 🏃‍♀️ 跑步機換算
*   輸入跑步機時速 (km/h 或 mph)，自動換算成路跑配速。

### 4. 🏁 完賽時間計算 & 預測
*   設定目標距離 (5K, 10K, 半馬, 全馬等)，計算所需配速。
*   **完賽成績預測**：輸入 5K/10K 成績，依據 Riegel's Formula 推算馬拉松完賽時間。

### 5. 📊 進階訓練工具
*   **訓練區間 (Training Zones)**：依據當前配速，自動推算 Easy, Marathon, Threshold, Interval, Repetition 等訓練強度區間。
*   **訓練週期 (Training Cycle)**：輸入目標賽事日期，自動產生每週建議配速、總里程、主課表與恢復週標記。

### 6. 🔗 分享與匯出
*   **分享連結**：將目前參數打包進網址（短碼格式），可直接分享給教練與跑友。
*   **匯出 PDF**：一鍵列印匯出，支援訓練報表版型。
*   **匯出圖片**：將主畫面快速匯出 PNG，方便手機收藏。

### 7. 🛠️ 個人化與易用性
*   **設定面板**：集中管理語言、單位、分段偏好、場地與道次預設。
*   **多語言支援**：繁體中文 / English。
*   **主題切換**：Light / Dark。
*   **PWA 支援**：可安裝至手機桌面，支援離線使用。
*   **離線診斷頁**：查看目前版本、Service Worker、快取狀態與更新時間。
*   **歷史紀錄**：自動儲存上次輸入資料，重新開啟可延續使用。

## 📱 安裝教學 (PWA)
1.  iPhone (iOS): 使用 Safari 開啟網頁 -> 點擊「分享」按鈕 -> 選擇「加入主畫面」。
2.  Android: 使用 Chrome 開啟網頁 -> 點擊選單 -> 選擇「安裝應用程式」。

## 🛠️ 技術細節
*   **Frontend**: HTML5, CSS3 (Variables, Flexbox), **TypeScript** (v5.3+), Vanilla 無框架.
*   **Storage**: LocalStorage (User Preferences).
*   **Architecture**: Modular TypeScript with centralized state management.
*   **Responsive**: Mobile-First Design.
*   **PWA**: Service Worker 支援完全離線使用.
*   **Testing**: Node test runner + tsx.

## 📚 開發指南

### 專案結構 (TypeScript 重構版本)
```
src/
├── types/
│   └── index.ts              # TypeScript 全域型別定義
├── constants/
│   ├── index.ts              # 常數、翻譯詞條、i18n 規則
│   └── domElements.ts        # DOM 元素快取
├── modules/
│   ├── TimeFormatter.ts      # 時間格式化與解析
│   ├── Converter.ts          # 單位轉換 (km/mile)
│   ├── Calculator.ts         # 核心計算引擎
│   ├── StateManager.ts       # 全域狀態管理
│   ├── StorageManager.ts     # LocalStorage 操作
│   ├── TranslationManager.ts # 多語言管理
│   ├── ShareManager.ts       # 分享連結序列化/反序列化
│   ├── AnalyticsManager.ts   # 本機事件追蹤
│   └── UIController.ts       # DOM 操作與事件綁定
└── main.ts                   # 應用進入點

tests/
├── calculator.test.ts
├── time-formatter.test.ts
├── training-cycle.test.ts
└── share-manager.test.ts

root/
├── index.html                # 主畫面
├── diagnostics.html          # 離線診斷頁
└── training-report.html      # 訓練報表頁（列印/PDF）
```

### 構建與開發

**安裝相依性：**
```bash
npm install
```

**編譯 TypeScript：**
```bash
npm run build        # 編譯一次
npm run watch       # 監看模式（開發用）
```

**執行自動測試：**
```bash
npm test
```

編譯後產生 `main.js`，由 `index.html` 自動載入。

### 模組說明

- **TimeFormatter**: 時間格式化 (mm:ss ↔ 秒) + 驗證
- **Converter**: 公里↔英哩轉換，配速↔時速轉換
- **Calculator**: 統一計算介面，計算分段、訓練區間、Riegel 成績預測
- **Calculator**: 統一計算介面，計算分段、訓練區間、Riegel 成績預測、訓練週期
- **StateManager**: 中央狀態管理 (Singleton)，與 localStorage 同步
- **TranslationManager**: 動態語言切換 + 規則化詞條讀取（單位/訓練課表文案）
- **ShareManager**: 參數序列化到 URL，並可從分享連結還原
- **UIController**: 所有 DOM 操作與事件綁定的中樞
- **StorageManager**: LocalStorage 包裝，錯誤處理

### 核心特性

✅ **完全類型安全** - 所有函式簽名explicit  
✅ **低依賴** - 核心計算採 Vanilla TypeScript（另使用 html2canvas 供圖片匯出）  
✅ **PWA 相容** - Service Worker 完全支援  
✅ **模組清晰** - 職責分離，易於擴展  
✅ **離線優先** - localStorage 持久化 + 狀態復原  

### 第一階段升級（2026-04）

- 完成時間欄位加入格式提示與統一驗證訊息（依距離提示 m:ss 或 h:mm:ss）
- 新增核心自動測試（配速、完成時間、跑步機、時間格式）
- Service Worker 支援新版可用提示與一鍵重新整理
- 加入本機事件追蹤（僅 localStorage，不上傳），可觀察輸入錯誤與計算成功率

### 第二階段升級（2026-04）

- 設定面板：集中管理語言、單位、分段偏好與預設跑道
- 可及性改善：鍵盤操作、焦點樣式、aria 標記補強
- 離線診斷頁：顯示版本、SW、快取與更新資訊
- 行動端優化：欄位、按鈕、數字可讀性提升

### 第三階段升級（2026-04）

- 訓練週期：依目標日期產生每週配速建議
- 分享連結：狀態序列化與還原
- 匯出功能：PDF 列印與圖片下載
- 多語系架構整理：詞條與規則分離（I18N_RULES）
- 訓練報表 A4 一頁優化（含自動緊湊模式）

### 新增功能方法

1. **新增計算類型**：在 `Calculator.ts` 中添加方法
2. **新增 UI 元素**：在 `UIController.ts` bindEvents() 中添加監聽
3. **新增狀態字段**：在 `types/index.ts` 中擴展 `IPaceState`
4. **新增翻譯**：在 `constants/index.ts` TRANSLATIONS 中添加

### 調試

全域調試物件 (瀏覽器 console)：
```javascript
window.__APP__.StateManager.getState()      // 查看狀態
window.__APP__.TranslationManager.get('key') // 查看翻譯
window.__APP__.UIController.bindEvents()     // 重新綁定事件
window.__APP__.AnalyticsManager.getSummary() // 查看本機事件追蹤摘要
```

## 📝 更新日誌
- [x] **v2.4 (Latest)**: 訓練週期、分享連結、報表匯出、i18n 規則化、A4 列印優化.
- [x] **v2.3**: 設定面板、可及性改善、離線診斷頁、行動端優化.
- [x] **v2.2**: 完全 TypeScript 重構，模組化架構，類型安全.
- [x] **v2.1**: 新增中英多語言支援、純黑白高對比主題.
- [x] **v2.0**: 全面重構 UI，新增 PWA、歷史紀錄、進階訓練工具.

---
Created with ❤️ for Runners by @imhahac.

