# 配速計算機 (Running Pace Calculator) 🏃‍♂️💨

專為跑者與鐵人打造的**配速換算 × 科學化訓練**離線 PWA。從田徑場分段、跑步機換算、完賽預測，到 VDOT、心率區間、間歇課表、環境配速、補給/恢復、GPX 坡度修正與賽事倒數地圖 —— 全部離線可用、中英雙語、深淺主題。

🌐 **線上使用**：<https://imhahac.github.io/running-pace-calculator/>

> 介面採「任意欄位輸入、即刻換算」設計；每張工具卡片都附**常駐說明與研究引用**，點右上角 ⓘ 可展開時間格式說明。

---

## 🚀 如何使用

頂部分頁（窄螢幕自動換行／可橫向捲動）：

| 分頁 | 內容 |
|------|------|
| 🏃 **配速與分析** | 四種輸入模式（配速 `m:ss`／田徑場道次單圈／跑步機時速／完賽時間反推）即時連動；分段表、E/M/T/I/R 訓練區間、Riegel 完賽預測。km ↔ mile 一鍵切換。 |
| 🏊‍♂️ **鐵人三項** | 選距離（51.5／113／226），輸入總時間反推游／騎／跑分段，或輸入各段配速＋T1/T2 得總時間。 |
| 📅 **課表與賽事** | 賽前**週期化訓練菜單**（分期、里程、每日課表、恢復週、CSV 匯出）、比賽配速規劃（平均／負分段／正分段）、**GPX 路線 GAP 分析**（Minetti 坡度修正）；串接賽事後端後可選賽事、看**倒數**與 Strava／GPX 地圖。 |
| 🧪 **科學評估** | VDOT 訓練配速、心率區間（Tanaka／Gellish／Karvonen ＋ VO₂max）、跑步經濟性＋體組成、科學原則與引用。 |
| 🏗️ **課表設計** | 間歇課表產生器、名師訓練法（Yasso／挪威 4×4／Hansons／雙閾值）、Strides 加速段、步頻分析。 |
| 📈 **監控與適應** | 傷害風險 ACWR、HRV 訓練調整、月經週期調整、海拔訓練規劃。 |
| 🌡️ **環境與補給** | 環境配速調整（露點／WBGT）、卡路里＋補給時間軸、長跑汗率補給、賽前降溫、肝醣超補、Taper 倒數、賽後恢復。 |
| ⚙️ **系統設定** | 語言、單位、分段顯示、預設場地；**賽事後端 URL**；Email 登入雲端同步。 |

### 🔗 分享與匯出
- **分享連結**：把目前參數（含各工具輸入）壓成短碼網址，收件者開啟即還原。
- **訓練報表**：「📑 開啟訓練報表」把已產生的週期課表開成可列印／匯出 PDF 的報表頁。
- **匯出 PNG**：一鍵輸出主畫面。

> ⏱️ **時間格式**：`m:ss`（分:秒）或 `h:mm:ss`（時:分:秒）。

---

## ✨ 功能總覽
即時配速換算（km/mile）、田徑場分道修正、跑步機換算、完賽時間與 Riegel 預測、三鐵配速、VDOT、心率五區、間歇／名師課表、Strides、步頻、週期化課表與 CSV、GPX 坡度修正配速、環境配速（露點/WBGT）、補給時間軸／汗率／肝醣／降溫／Taper／恢復、ACWR／HRV／月經週期／海拔監控、賽事倒數與 Leaflet 路線地圖、短碼分享、雲端同步、PDF/PNG 匯出、中英雙語、深淺主題、Service Worker 離線。

---

## 📱 安裝 (PWA)
- **iPhone (iOS)**：Safari 開啟 →「分享」→「加入主畫面」。
- **Android**：Chrome 開啟 → 選單 →「安裝應用程式」。

---

## ☁️ 賽事資料來源

賽事清單需要一個後端提供。**建議用 Cloudflare Worker**（穩定、由你掌控）；舊的 GAS 方案仍可用，但自動爬蟲已失效（見下）。後端 URL 可由 GitHub Actions Variable（`BACKEND_URL`）於 build 時注入為站台預設，或在 **⚙️ 系統設定** 自行填入（手填值優先）。設定後賽事改由該後端取得，並出現 Email 登入框。

### ① Cloudflare Worker（推薦）

`worker/` 是一個 Worker，一站包辦：

- **賽事 API** — `GET /api/races`（公開、由 KV 提供）、`PUT /api/races`（管理員維護清單）。
- **Magic-link 登入** — 免密碼，用 Email 魔術連結（透過 [SendGrid](https://sendgrid.com)；驗證單一寄件人即可、免網域）。
- **個人雲端同步** — 登入後各工具輸入與主題/語言偏好存到你的後端、跨裝置同步。

**部署用 GitHub Actions、設定全走 GH Secrets/Variables（金鑰不寫進 repo）**。完整逐步教學(含 CF token 權限、SendGrid 單一寄件人)見 **[worker/README.md](worker/README.md)**。摘要——在 repo **Settings → Secrets and variables → Actions** 設定:

- **Variables**:`APP_URL`、`ALLOWED_ORIGIN`(裸來源)、`FROM_EMAIL`、`ADMIN_EMAILS`(逗號分隔、勿含空格);`KV_NAMESPACE_ID` **由 CI 自動建立並回寫**(免手設,要釘特定 namespace 才填)。前端另設 `BACKEND_URL`(此 Worker 網址)、`GAS_API_URL`(備選),build 時注入站台預設。
- **Secrets**:`CLOUDFLARE_API_TOKEN`(Workers + KV 編輯權限)、`CLOUDFLARE_ACCOUNT_ID`、`SENDGRID_API_KEY`、`GH_VARIABLES_TOKEN`(回寫 KV id 用的 PAT,需 repo Variables 讀寫權)。

推送 `worker/**` 變動或手動觸發 [.github/workflows/deploy-worker.yml](.github/workflows/deploy-worker.yml):每次都跑單元測試＋`--dry-run` 打包驗證;**待上述憑證齊全才實際部署**(CI 自動 list-or-create KV namespace、回寫 `KV_NAMESPACE_ID`、把 id 寫入設定、用 `--var` 帶入參數、再上傳 SendGrid 金鑰),否則略過並標警告(不讓 CI 失敗)。**KV namespace 全在 Actions 內建立,毋須本機 wrangler。**

> 🔐 需自備 Cloudflare 帳號與 SendGrid API key(驗證單一寄件人信箱、不必擁有網域);KV namespace 由 CI 自動建立。所有真實值都存在 GitHub,repo 內 [worker/wrangler.toml](worker/wrangler.toml) 只留佔位與本機開發預設。賽事清單由管理員以 `PUT /api/races` 維護(或沿用下方 GAS 試算表手動輸入)。

### ② Google Apps Script（備選 / 手動為主）

也可用 Google 試算表當免費賽事資料庫：把 [docs/gas-api-script.js](docs/gas-api-script.js) 貼進試算表的 Apps Script、部署為 Web App，URL 填入 **⚙️ 系統設定** 的「賽事 API (GAS)」。試算表第一列欄位：`Date`(YYYY-MM-DD) / `Name` / `Location` / `RegistrationLink` / `StravaFull` / `StravaHalf`。直接在試算表新增列即可維護賽事。

> ⚠️ **自動爬蟲已失效（2026 起）：** 「運動筆記」「馬拉松世界」皆改為 JS/SPA 動態載入（運動筆記另加登入牆），匿名抓取已無法取得賽事；[docs/gas-crawler-script.js](docs/gas-crawler-script.js) 在抓取 0 筆時會**明確告警**而非靜默。**最可靠的方式是手動輸入**（試算表新增列，或 Worker `PUT /api/races`）。

---

## 🛠️ 開發指南

### 環境需求
Node.js 24、npm。`npm install`。

### 常用指令
```bash
npm run build         # 型別檢查(tsc --noEmit) → esbuild 打包+壓縮成單一 assets/js/main.js
npm run watch         # tsc 監看模式（開發用）
npm run typecheck     # 僅型別檢查
npm run lint          # ESLint（--max-warnings 0）
npm run lint:fix      # ESLint 自動修正
npm run format        # Prettier 格式化
npm run format:check  # 檢查格式（CI 用）
npm run test          # 單元測試 (node:test + tsx)
npm run test:cov      # 測試 + c8 覆蓋率閘門
```

### 專案結構
```text
.github/workflows/
├── pipeline.yml         # 主站 CI/CD：品質閘門 → 部署 GitHub Pages
└── deploy-worker.yml    # 推送 worker/** 時測試並部署 Cloudflare Worker
scripts/build.mjs        # esbuild 打包（產生 main.js 與 build-info.js 內容雜湊）
index.html               # 主頁（8 個功能分頁）
training-report.html     # 可列印訓練報表（自包含，讀 localStorage 的計畫）
diagnostics.html         # 離線/診斷頁
src/
├── main.ts              # 進入點
├── types/index.ts       # 全域型別
├── constants/index.ts   # 常數、雙語翻譯詞條（zh/en key 對齊）、訓練計畫參數
└── modules/
    ├── core/            # 25 個純計算模組：Calculator, VdotCalculator, HeartRateCalculator,
    │                    #   Environmental/Acwr/Cadence/Strides/Fueling/SweatRate/Glycogen/
    │                    #   Cooling/Recovery/Taper/Gap/RunningEconomy/Hrv/Menstrual/Altitude…
    ├── state/           # 7 個狀態/持久化模組：StateManager, StorageManager, TranslationManager,
    │                    #   ShareManager, ShareExportManager, FormPersistence, BackendClient
    └── ui/              # UIController + 34 個專責 controller、TrainingCycleManager…
tests/                   # 38 個單元測試（node:test）；訓練週期有 golden 位元快照
worker/                  # Cloudflare Worker 後端（KV 賽事 API + magic-link 登入 + 同步）
eslint.config.js / .prettierrc / .c8rc.json   # 品質工具設定
```
> `assets/js/`（編譯產物）與 `coverage/` 為自動產生，已列入 `.gitignore`。

### 技術細節
- **語言/型別**：TypeScript 5（strict），無前端框架（Vanilla）。
- **打包**：esbuild 將整個 app 打包+壓縮成**單一 ES module**（`assets/js/main.js`）。
- **品質**：ESLint flat config（`no-explicit-any` 為 error、零警告）＋ Prettier；c8 覆蓋率閘門（lines 85／branches 72／functions 60）。
- **PWA**：Service Worker 離線快取，`CACHE_NAME` 由 build 內容雜湊自動版本化（`assets/js/build-info.js`）。
- **地圖**：Leaflet.js 解析／繪製 GPX/GeoJSON 路線。
- **後端**：Cloudflare Worker（KV、SendGrid magic-link、Bearer session、cron）。
- **CI/CD**：PR/push 跑 typecheck／lint／format／測試+覆蓋率四道閘門，通過後部署 GitHub Pages；Worker 由獨立 workflow 部署。

### 核心特性
類型安全、低依賴（核心計算為 Vanilla TypeScript）、離線優先（localStorage 狀態復原 + Service Worker）；每項科學工具皆標註研究引用。

---

## 🗺️ 後續規劃 (Roadmap)
即時語言重譯體驗優化、賽事來源端點重對接（兩來源已改 JS/SPA＋登入牆，匿名爬取失效；待在登入環境擷取真實 API 端點後重接——回報範本見 [docs/gas-crawler-script.js](docs/gas-crawler-script.js) 最上方 `CONFIG` 註解）、更多個體化監控整合。

---

Created with ❤️ for Runners by [@imhahac](https://github.com/imhahac).
