# 配速計算機 (Running Pace Calculator) 🏃‍♂️💨

專為跑者與鐵人設計的**配速換算與訓練規劃** PWA。田徑場分段、跑步機換算、完賽預測、科學化訓練週期、三鐵配速、賽事倒數與路線地圖，全部離線可用。

🌐 **線上使用**：<https://imhahac.github.io/running-pace-calculator/>

> 介面採「任意欄位輸入、即刻換算」設計，並在每個模式與分頁內附**使用提示**；點右上角 ⓘ 可展開時間格式說明。

---

## 🚀 如何使用

頂部有四個分頁：**🏃 配速與分析 / 🏊‍♂️ 鐵人三項 / 📅 課表與賽事 / ⚙️ 系統設定**。

### 🏃 配速與分析
此分頁有四種計算模式，任一欄位輸入後其他欄位即時連動換算：

| 模式 | 輸入 | 得到 |
|------|------|------|
| **配速 (Pace)** | 每公里配速 `分:秒`（例：`4:30`） | 時速、各距離分段、完賽時間 |
| **田徑場 (Track)** | 選場地（400m／300m）＋道次，輸入單圈秒數 | 依道次距離修正的 100m–2000m 分段 |
| **跑步機 (Treadmill)** | 跑步機時速（km/h 或 mph） | 對應的路跑配速 |
| **完賽時間 (Finish)** | 選距離（5K/10K/半馬/全馬…）＋目標完賽時間 | 反推所需配速與分段 |

往下捲動還有：**分段表**（田徑場／路跑每 2.5k 可切換）、**訓練配速區間**（Easy / Marathon / Threshold / Interval / Repetition）、**完賽成績預測**（Riegel's Formula，由 5K/10K 成績推算半馬、全馬）。

- 配速、跑步機單位可用各欄位旁的按鈕切換 **km ↔ mile**。

### 🏊‍♂️ 鐵人三項
選擇距離（51.5 / 113 / 226），輸入**目標總時間**自動反推游／騎／跑分段配速，或直接輸入各段配速與 T1/T2 轉換時間，得到總完賽時間。

### 📅 課表與賽事
輸入**目標賽事日期**並提供一個配速，自動產生賽前**週期化訓練菜單**（每週重點、總里程、主課表前中後段、恢復週標記）。串接賽事 API 後，可從下拉選單挑賽事、自動帶入日期並顯示**倒數計時**與 Strava／GPX 路線地圖。

### ⚙️ 系統設定
切換**語言（繁中／English）**、配速／跑步機單位、分段顯示偏好、預設場地與道次，並可填入自建的**賽事 API (GAS) URL**。

### 🔗 分享與匯出
- **分享連結**：把目前參數壓成短碼網址，可直接傳給教練／跑友。
- **匯出 PDF／PNG**：一鍵輸出主畫面或訓練報表版型。

> ⏱️ **時間格式**：`m:ss`（分:秒）或 `h:mm:ss`（時:分:秒）。

---

## ✨ 功能總覽
即時配速換算（km/mile）、田徑場分道修正、跑步機換算、完賽時間與 Riegel 預測、三鐵配速、科學化訓練區間與週期課表、賽事整合與倒數、Leaflet 路線地圖、短碼分享、PDF/PNG 匯出、中英雙語、深淺色主題、Service Worker 離線。

---

## 📱 安裝 (PWA)
- **iPhone (iOS)**：Safari 開啟 → 「分享」→「加入主畫面」。
- **Android**：Chrome 開啟 → 選單 →「安裝應用程式」。

---

## 📅 賽事 API (GAS) 設定與自動爬蟲

本專案可用 Google 試算表作為免費賽事資料庫，並附**自動爬蟲**從「運動筆記」「馬拉松世界」抓取賽事。

**步驟 1：建立試算表** — 第一列欄位（順序與大小寫須一致）：
`Date`(YYYY-MM-DD) / `Name` / `Location` / `RegistrationLink` / `StravaFull` / `StravaHalf`。

**步驟 2：貼入 Apps Script** — 試算表 → 擴充功能 → Apps Script：
- `Code.gs` 貼入 [docs/gas-api-script.js](docs/gas-api-script.js) 全部內容。
- 新增 `Crawler.gs`，貼入 [docs/gas-crawler-script.js](docs/gas-crawler-script.js) 全部內容。

**步驟 3：部署為 Web 應用程式** — 部署 → 新增部署 → 類型「Web App」：執行身分「我」、存取權「所有人」，複製產生的 **Web App URL**。

**步驟 4：同步與使用** — 重新整理試算表，使用上方「🏃‍♂️ 賽事助手」選單一鍵爬取賽事；在計算機的 **⚙️ 系統設定** 把 Web App URL 填入「賽事 API (GAS)」並套用；切到 **📅 課表與賽事** 即可選賽事、看倒數與路線。

> ⚠️ **關於自動爬蟲（2026 起）：** 「運動筆記」與「馬拉松世界」的賽事清單已改為 JS/AJAX 動態載入（運動筆記另加登入牆），靜態 HTML 已不含賽事列。爬蟲已改為**改打 AJAX/JSON 端點並在失敗時明確告警**（不再靜默回報「無須更新」）；若某來源仍抓不到，同步視窗會顯示警告，請打開 Apps Script 的**「執行紀錄」**查看記錄的 HTTP 狀態／內容樣本／首筆 JSON 欄位，據此調整 `gas-crawler-script.js` 最上方的 `CONFIG`。
>
> 📝 **最可靠的來源是手動輸入**：直接在試算表新增列即可，前端 API（`doGet`）會照常讀取、無須依賴爬蟲。

---

## ☁️ Cloudflare Worker 後端（推薦，取代 GAS）+ 帳號雲端同步

`worker/` 提供一個 Cloudflare Worker，一站包辦：

- **賽事 API** — `GET /api/races`（公開、由 KV 提供）、`PUT /api/races`（管理員）；比 GAS 穩定、由你掌控。
- **Magic-link 登入** — 免密碼，用 Email 魔術連結（透過 [Resend](https://resend.com)）。
- **個人雲端同步** — 登入後，各科學/環境工具輸入與主題/語言偏好存到你的後端、跨裝置同步。

部署與設定見 [worker/README.md](worker/README.md)。完成後在 **⚙️ 系統設定** 填入「**後端 URL (Worker)**」即可：賽事改由 `${後端}/api/races` 取得（未填則回退舊的 GAS URL），並出現 Email 登入框。

### 用 GitHub Actions 自動部署（[.github/workflows/deploy-worker.yml](.github/workflows/deploy-worker.yml)）

推送到 `main`（且 `worker/**` 有變動）或手動 `workflow_dispatch` 時，會跑 worker 單元測試並 `wrangler deploy`。**一次性準備：**

1. 在 [worker/wrangler.toml](worker/wrangler.toml) 填入真正的 **KV namespace id**（非機密，需 commit）與 `APP_URL`／`ALLOWED_ORIGIN`（裸來源）／`FROM_EMAIL`／`ADMIN_EMAILS`。
2. 在 GitHub repo **Settings → Secrets and variables → Actions** 新增：
   - `CLOUDFLARE_API_TOKEN`（具 Workers 編輯權限）
   - `CLOUDFLARE_ACCOUNT_ID`
3. **Resend 金鑰**：Worker secret 會跨部署保留，故設定**一次**即可——`cd worker && npx wrangler secret put RESEND_API_KEY`（或 CF 儀表板）。若想改由 CI 管理，取消 workflow 內 `secrets:`/`env:` 註解並把 `RESEND_API_KEY` 加進 repo secrets。

> 🔐 需要你自備 Cloudflare 帳號、KV namespace 與 Resend API key（Cloudflare 免費 MailChannels 寄信已於 2024 年終止）。我無法在此實際部署/驗證；上述程式、workflow 與設定範本皆已備妥。

> 🔗 **分享連結**也會帶上各工具的輸入，收件者開啟即還原；登入則用於跨裝置長期同步。

---

## 🛠️ 開發指南

### 環境需求
Node.js 24、npm。

```bash
npm install
```

### 常用指令
```bash
npm run build         # 型別檢查(tsc --noEmit) → esbuild 打包+壓縮成單一 assets/js/main.js
npm run watch         # tsc 監看模式（開發用）
npm run typecheck     # 僅型別檢查
npm run lint          # ESLint
npm run lint:fix      # ESLint 自動修正
npm run format        # Prettier 格式化
npm run format:check  # 檢查格式（CI 用）
npm run test          # 單元測試 (node:test + tsx)
npm run test:cov      # 測試 + c8 覆蓋率閘門
```

### 專案結構
```text
.github/workflows/pipeline.yml   # CI/CD：品質閘門 → 部署 GitHub Pages
scripts/build.mjs                # esbuild 打包腳本（產生 main.js 與 build-info.js 雜湊）
src/
├── main.ts                      # 應用進入點
├── types/index.ts               # 全域型別
├── constants/index.ts           # 常數、翻譯詞條、訓練計畫參數
└── modules/
    ├── core/                    # 純計算：Calculator, TrainingPlanBuilder, Converter, TimeFormatter, TriathlonCalculator
    ├── state/                   # 狀態與持久化：StateManager, StorageManager, TranslationManager, ShareManager…
    └── ui/                      # UIController 與 13 個專責 controller、TrainingCycleManager…
tests/                           # 單元測試（node:test）
eslint.config.js / .prettierrc / .c8rc.json   # 品質工具設定
```
> `assets/js/`（編譯產物）與 `coverage/` 皆為自動產生，已列入 `.gitignore`。

### 技術細節
- **語言/型別**：TypeScript 5（strict），無前端框架。
- **打包**：esbuild 將整個 app 打包+壓縮成**單一 ES module**（`assets/js/main.js`）。
- **品質**：ESLint（flat config）+ Prettier；c8 覆蓋率閘門。
- **PWA**：Service Worker 離線快取，`CACHE_NAME` 由 build 內容雜湊自動版本化（`assets/js/build-info.js`），不需手動維護資產清單。
- **地圖**：Leaflet.js 解析／繪製 GPX/GeoJSON 路線。
- **CI/CD**：PR 與 push 跑 typecheck / lint / format / 測試+覆蓋率四道閘門；通過後僅打包必要檔案部署至 GitHub Pages。

### 核心特性
類型安全、低依賴（核心計算為 Vanilla TypeScript）、離線優先（localStorage 狀態復原 + Service Worker）。

---

## 🗺️ 後續規劃 (Roadmap)
本機 GPX 拖放與高度坡度圖、公里分段配速與上坡／補給點配速補償。

---

Created with ❤️ for Runners by [@imhahac](https://github.com/imhahac).
