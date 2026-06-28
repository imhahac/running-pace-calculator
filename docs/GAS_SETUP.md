# Google Apps Script(GAS)賽事後端設定指南

用 Google 試算表 + Apps Script 當**免費的賽事資料來源**(API + 自動爬蟲),作為 Cloudflare Worker 之外的備援方案。

## 何時用 GAS?

| | Cloudflare Worker(推薦) | Google Apps Script(本指南) |
|---|---|---|
| 定位 | 主要後端 | 沒有 Worker 時的免費備援 |
| 賽事自動更新 | 每日 cron + KV | 試算表 + 選用每日觸發器 |
| 過期賽事清理 | 自動(保留 7 天) | `doGet` 回傳時自動過濾(列不刪) |
| 個人雲端同步 / Email 登入 | 有 | 無(只有賽事讀取) |
| 設定 | 見 [worker/README.md](../worker/README.md) | 本文件 |

> 兩者前端共用同一份 `IRaceEvent` 格式;App 會優先用 Worker URL,未設定時回退 GAS URL。

## 架構:一個試算表 + 一個 Apps Script 專案、兩個檔

兩支腳本**讀寫同一張試算表**,放在**同一個容器繫結(container-bound)專案**的兩個檔即可:

| 檔(Apps Script 內) | 來源 | 角色 |
|---|---|---|
| `Code.gs` | [gas-api-script.js](gas-api-script.js) | **API**:`doGet` 把試算表內容回傳 JSON 給前端 |
| `Crawler.gs` | [gas-crawler-script.js](gas-crawler-script.js) | **爬蟲**:選單 `syncRaces` 自動抓「運動筆記+馬拉松世界」寫入試算表 |

> ⚠️ 兩檔原本都有 `formatDate`,同專案會「重複宣告」報錯。爬蟲端已改名 `formatDate_`,故現在可安全同放一個專案。

## 試算表欄位(第一列標頭,順序固定)

| 欄 | 標頭 | 說明 | 範例 |
|---|---|---|---|
| A | `Date` | 比賽日期 `YYYY-MM-DD` | `2026-12-20` |
| B | `Name` | 賽事名稱 | `台北馬拉松` |
| C | `Location` | 地點 | `台北市` |
| D | `RegistrationLink` | 報名／官網連結 | `https://...` |
| E | `StravaFull` | 全馬 Strava 路線 URL | `https://www.strava.com/routes/123` |
| F | `StravaHalf` | 半馬 Strava 路線 URL | `https://www.strava.com/routes/456` |
| G | `GpxFull` | 全馬 GPX URL(優先於 Strava) | `https://.../full.gpx` |
| H | `GpxHalf` | 半馬 GPX URL | `https://.../half.gpx` |
| I | `Distances` | 距離(選填) | `42.2K, 21K` |
| J | `RegClose` | 報名截止日(選填) | `2026-10-31` |

A–H 為前端必要欄;I/J 為選填。爬蟲會自動填 A–D、I、J,**不覆寫**你手填的 E–H(Strava/GPX)。

## 部署步驟

1. **建立試算表**,在第一列填入上表 A1–J1 的標頭。
2. **開啟 Apps Script**:試算表「擴充功能 → Apps Script」。
3. **貼上兩支腳本**:
   - 把 [gas-api-script.js](gas-api-script.js) 全文貼到預設的 `Code.gs`。
   - 「＋ → 指令碼」新增 `Crawler.gs`,貼上 [gas-crawler-script.js](gas-crawler-script.js) 全文。
   - 儲存,回試算表重新整理(讓 `onOpen` 建立選單)。
4. **部署 Web App**(供前端讀取):Apps Script「部署 → 新增部署作業 → 類型:Web 應用程式」,
   執行身分 **我**、誰可以存取 **任何人**,部署後**複製 `/exec` 網址**。
5. **把網址設給 App**:
   - 執行時:App 的 **⚙️ 系統設定 →「後端 URL」** 貼上該 `/exec` 網址;或
   - 建置時:設 GitHub Actions Variable `GAS_API_URL`,build 會烘進 bundle。
   - (不需手改 `constants/index.ts`。)

## 用爬蟲自動更新賽事

- **手動**:試算表上方選單「🏃‍♂️ 賽事助手 → 🔄 從運動筆記與馬拉松世界更新賽事」。
  以「日期_名稱」去重、只加未來賽事、append-only(不覆寫手填欄)。
- **自動(選用,等同 Worker cron)**:Apps Script 左側「觸發條件 ⏰ → 新增觸發條件」→
  函式 `syncRaces`、事件來源「時間驅動」、每日一次。

## 過期賽事

`doGet` 在**回傳時**就濾掉過去日期的賽事(前端只會看到未來賽事);**試算表的列不會被刪除**,
你手填的 Strava/GPX 與歷史紀錄都安全保留。

## 疑難排解

- **解析 0 筆 / 抓不到**:來源網站常改版。看 Apps Script「執行紀錄」裡印出的 HTML 內容樣本,
  比對 [worker/src/lib.js](../worker/src/lib.js) 的 `parseBijiRaces` / `parseMwRaces`(與本爬蟲解析邏輯一致)調整 regex。
- **`formatDate` 已宣告**:代表貼到了舊版爬蟲(未改名)。確認 `Crawler.gs` 用的是改名後的 `formatDate_`。
- **前端看不到賽事**:確認 Web App 以「任何人」存取、URL 是 `/exec` 結尾、且已設到 App 的後端 URL。
