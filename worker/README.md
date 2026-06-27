# 配速計算機 — Cloudflare Worker 後端

單一 Worker 提供：

- **賽事 API** — `GET /api/races`（公開、由 KV 提供）、`PUT /api/races`（管理員）——以你掌控的穩定後端取代脆弱的 GAS 爬蟲。
- **Magic-link 登入** — 免密碼，透過 [SendGrid](https://sendgrid.com) 寄 Email 魔術連結。
- **個人雲端同步** — `GET/PUT /api/data` 儲存每位使用者的工具輸入與偏好，跨裝置同步。

> 每日 cron 會自動從**運動筆記**與**馬拉松世界**抓取賽事並 append-only 合併進 KV（見 [賽事爬取與重對接](#賽事爬取與重對接)）。管理員 `PUT /api/races` 仍用於整理清單與補上 Strava／GPX（cron 不會覆寫手填值）。

## Endpoints

| Method | Path | 授權 | 用途 |
|---|---|---|---|
| GET | `/api/races` | 公開 | 列出賽事（KV `races`） |
| PUT | `/api/races` | 管理員（Bearer） | 取代賽事清單（`IRaceEvent` JSON 陣列） |
| POST | `/api/auth/request` | 公開 | `{ email }` → 寄出魔術連結 |
| GET | `/api/auth/verify?token=…` | 公開 | 以魔術 token 換 `{ token: sessionId, email }` |
| POST | `/api/auth/logout` | Bearer | 註銷 session |
| GET | `/api/data` | Bearer | 取得使用者儲存的資料 |
| PUT | `/api/data` | Bearer | 取代使用者儲存的資料 |

授權採 **Bearer session token**（`Authorization: Bearer <sessionId>`），存於用戶端、不用 cookie，CORS 維持單純。

**安全性權衡：**
- session token 存於 `localStorage`（JS 可讀）——SPA 標準權衡。此處可接受（資料僅訓練輸入與你的 Email）；更高機敏性可改用 HttpOnly cookie ＋ `SameSite`／CORS-credentials 流程。
- 魔術 token 單次有效、256-bit、15 分鐘 TTL；session 30 天；同一 Email 每分鐘限一次魔術連結請求。CORS 鎖定 `ALLOWED_ORIGIN`（**裸來源**——Worker 會正規化，但請勿帶路徑）。
- `DEBUG_AUTH="1"` 會讓 `/api/auth/request` 回傳 Email 是否真的寄出（設定 SendGrid 時方便）；正式環境請勿設，以免洩漏信箱是否存在。

## 設定與部署（GitHub Actions）

所有設定都放在 **GitHub**、不入 repo——真實 id 與金鑰一律不提交。**KV namespace 由部署 workflow 自動處理**：首次部署時 list-or-create，並把 id 回寫 `KV_NAMESPACE_ID` Variable，毋須本機 `wrangler kv namespace create`。以下只需做一次：

**① Cloudflare 憑證**
- **API token**：dashboard → **My Profile → API Tokens → Create Token** → 用 **「Edit Cloudflare Workers」** 範本（授予 Account → _Workers Scripts: Edit_ 與 _Workers KV Storage: Edit_）。
- **Account ID**：**Workers & Pages** → 右側欄。

**② SendGrid（magic-link Email）**
- **寄件人驗證**：建議用 **Settings → Sender Authentication → Authenticate Your Domain**（DKIM/SPF、deliverability 較佳；驗證後可用該網域底下任意地址當 `FROM_EMAIL`）。無自有網域則改用 **Single Sender Verification** 驗證單一信箱亦可。
- **API Key**：**Settings → API Keys → Create API Key**，給 _Mail Send_ 權限。

**③ 在 GitHub 加入設定** → repo **Settings → Secrets and variables → Actions**：

| 名稱 | 類型 | 範例 | 用途 |
| --- | --- | --- | --- |
| `APP_URL` | Variable | `https://imhahac.github.io/running-pace-calculator/` | 魔術連結導回的位址 |
| `ALLOWED_ORIGIN` | Variable | `https://imhahac.github.io` | CORS 來源（裸來源、不帶路徑；`*` 僅供測試） |
| `FROM_EMAIL` | Variable | 已驗證網域下的地址（或 Single Sender） | 魔術連結寄件地址 |
| `ADMIN_EMAILS` | Variable | `you@example.com`（逗號分隔、**勿含空格**） | 可 `PUT /api/races` 的人 |
| `KV_NAMESPACE_ID` | Variable | _(自動)_ | **CI 管理**——首次部署自動建立並回寫；只有要釘特定 namespace 才手動填 |
| `CLOUDFLARE_API_TOKEN` | Secret | — | 部署授權（兼建立/列出 KV） |
| `CLOUDFLARE_ACCOUNT_ID` | Secret | — | 部署目標 |
| `SENDGRID_API_KEY` | Secret | `SG.…` | 寄送魔術連結 Email |
| `GH_VARIABLES_TOKEN` | Secret | fine-grained PAT | 把自動建立的 KV id 回寫 `KV_NAMESPACE_ID`（需 repo **Variables：讀寫**權限） |

**④ 部署** — 推送任何 `worker/**` 變動（或手動觸發）。[`.github/workflows/deploy-worker.yml`](../.github/workflows/deploy-worker.yml) 每次都跑單元測試＋`wrangler deploy --dry-run` 打包驗證（免帳號）；待上述憑證齊全才實際部署：自動解析 KV namespace（已釘 `KV_NAMESPACE_ID` 就用，否則 list-or-create 並回寫）、把 id 寫入設定、以 `--var` 帶入參數、再上傳 `SENDGRID_API_KEY`。缺任何一項則**略過部署並標警告**，不讓 build 失敗。

### 本機開發 / 手動部署

`wrangler.toml` 保留無害的 `[vars]` 開發預設與 KV id 佔位（本機 `wrangler dev` 不需真實 id）。本機金鑰：複製 `.dev.vars.example` → `.dev.vars`（放 `SENDGRID_API_KEY`），再 `npm run dev`。要手動部署而非走 CI：把真實 KV id 填進 `wrangler.toml`、`npx wrangler secret put SENDGRID_API_KEY`，再 `npm run deploy`。純函式單元測試：`npm test`。

## 串接前端

兩種方式擇一（可並用，手填優先）：

- **build 時注入（推薦）**：在 **Settings → Secrets and variables → Actions** 加 repo **Variable** `BACKEND_URL`（若仍用舊 GAS 來源則加 `GAS_API_URL`）。主站 build（[pipeline.yml](../.github/workflows/pipeline.yml)）會把它烘進 bundle，站台開箱即用。
- **逐瀏覽器覆寫**：在 app 的 **⚙️ 系統設定** 把「後端 URL (Worker)」設為部署後的 Worker 來源，例如 `https://running-pace-backend.<you>.workers.dev`（此處非空值一律優先於 build 預設）。

設定後 app 會：

- 從 `${backendUrl}/api/races` 載入賽事（未設則回退舊 GAS URL）；
- 顯示 Email 登入框 → 魔術連結 → 登入狀態；
- 登入後拉取你儲存的工具輸入／偏好，並自動推送變更。

## 灌入賽事（管理員）

```bash
curl -X PUT "$WORKER/api/races" \
  -H "Authorization: Bearer $SESSION" \
  -H "Content-Type: application/json" \
  -d '[{"id":"r1","date":"2026-12-20","name":"台北馬拉松","location":"台北","registrationLink":"","stravaFull":"","stravaHalf":"","gpxFull":"","gpxHalf":""}]'
```

（`$SESSION` = 以 `ADMIN_EMAILS` 內的信箱經 `/api/auth/verify` 取得的 token。）

## 賽事爬取與重對接

賽事的**唯一真實來源是 KV 的 `races` key**；前端只讀 `GET /api/races`。寫入有兩條路：管理員 `PUT`（可靠）與每日 cron 爬取（best-effort）。

### 讀取：`GET /api/races`
- 讀 KV `races`，以 `safeParseArray` 容錯（`null`／壞 JSON → `[]`，不丟 500）。
- 回應帶 `Cache-Control: public, max-age=300`（邊緣快取 5 分鐘）。

### 寫入（canonical）：`PUT /api/races`
- 需 `Authorization: Bearer <session>`，且該 session 的 Email ∈ `ADMIN_EMAILS`，否則 `403 forbidden`。
- `validateRaces`（[src/lib.js](src/lib.js)）守門：須為陣列、**≤ 5000 筆**、序列化後 **≤ 512 KB**、每筆需有字串 `date` 與 `name`，否則 `400`。
- 通過即 `KV.put('races', …)` **整份覆寫**。範例見上節〈灌入賽事〉。

### cron 爬蟲機制（`scheduled()`，每日 18:00 UTC）
`wrangler.toml` 的 `crons = ["0 18 * * *"]` 觸發 [src/index.js](src/index.js) 的 `scheduled()`。流程:**逐來源**(運動筆記、馬拉松世界)各自抓取+解析成 `IRaceEvent[]`(單一來源失敗只 log、不影響其他)，再以 `mergeRaces` **append-only 去重**(`date_name` 鍵,**不覆寫**手動 `PUT` 的 Strava／GPX)合併進 KV `races`,有新增才寫回。`stravaFull/stravaHalf/gpxFull/gpxHalf` 一律留空待管理員補。

#### 來源 1 — 運動筆記 biji.co（HTML 解析）
- **抓取**:`GET https://running.biji.co/?q=competition`,headers `User-Agent` + `Accept-Language: zh-TW`(伺服器端渲染,免登入)。
- **解析** `parseBijiRaces(html)`（[src/lib.js](src/lib.js)）:每筆賽事區塊以 `competition-name` 的 `<a href='…cid=…'>` 為錨,向前讀:
  - **日期**取行事曆連結的 `dates=YYYYMMDD`(可靠完整日期);
  - **地點**取 `competition-place` 的 county;**連結**用 `cid` 的詳情頁絕對化。

#### 來源 2 — 馬拉松世界 marathonsworld（XHR + HTML 片段）
- **抓取**:`POST https://www.marathonsworld.com/artapp/racePage.php`,本文 `action=getRaceListByCountryYear&user_id=1&country=1&year=0&sort=0&type=0`,**必要 headers**:`Content-Type: application/x-www-form-urlencoded`、`X-Requested-With: XMLHttpRequest`、`Referer: …/racelist.php?p=1`、`Origin`、`User-Agent`。**免 cookie**(已驗證:無 PHPSESSID 也回完整清單)。
- **解析** `parseMwRaces(html)`（[src/lib.js](src/lib.js)）:資料列為 `<tr class='ColorBar9|11'>`;日期格僅 `MM/DD`,**年份**由 `YYYY年M月` 區塊標頭(依文件順序追蹤,正確跨 2026→2027);名稱取 `racedetail.php?rid=…` 連結文字(去前導 `*`、`<img>`);地點取 `width='150'` 格。

### 部署與啟用爬蟲
爬蟲就是 Worker 的 **Cron Trigger**(`wrangler.toml` 的 `[triggers] crons = ["0 18 * * *"]`)——**隨 Worker 一起部署,不需獨立步驟、不需新增金鑰**(純公開抓取)。

1. **部署** — 同上節〈設定與部署〉:推送 `worker/**`(走 GitHub Actions)或本機 `npm run deploy`。Cron 觸發器會一併上線。
2. **確認已排程** — Cloudflare Dashboard → **Workers & Pages → 你的 Worker → Settings → Triggers → Cron Triggers**,應見 `0 18 * * *`(每日 18:00 UTC)。
3. **觀察執行** — `npx wrangler tail`,排程跑時會印 `[cron] biji: fetched N, merged M new` 與 `[cron] marathonsworld: …`。
4. **立即觸發(不等每日)** — 本機 `npx wrangler dev --test-scheduled`,另一終端 `curl "http://localhost:8787/__scheduled?cron=0+18+*+*+*"` 即手動跑一次 `scheduled()`(會真連網抓取並寫入你連線的 KV)。或先用 `PUT /api/races` 灌入,首跑 cron 後即自動補進。
5. **改排程頻率** — 編輯 `wrangler.toml` 的 `crons`(cron 語法,UTC),重新部署即生效。

> 首次部署後 KV `races` 在**第一次 cron(或手動觸發)**後才有內容;`GET /api/races` 在那之前回 `[]`。

### 🔧 站方改版時的重對接
若某來源 HTML 結構改版導致解析回 `[]`:
1. **觀察** — 瀏覽器 DevTools → Network,找出載入賽事的請求(biji 為頁面本身;marathonsworld 為 `racePage.php` 的 XHR),右鍵 **Copy as cURL** 記下 URL／method／payload／必要 headers。
2. **對映** — 比對新回應,把日期／名稱／地點／連結對到 `IRaceEvent`。
3. **改 Worker** — 調整 `crawlBiji`／`crawlMarathonsWorld` 的請求,並更新對應 `parseBijiRaces`／`parseMwRaces`(仍回 `IRaceEvent[]`、缺 `date`/`name` 略過)。
4. **驗證** — 更新 `worker/test/fixtures/` 樣本與測試;`npx wrangler tail` 看 `[cron] <source>: fetched N, merged M new`。
5. **後備** — 真無法匿名抓取時,維持管理員 `PUT` 為主。

歷史脈絡與「待重對接」回報模板見 [docs/gas-crawler-script.js](../docs/gas-crawler-script.js)。

### 本地測試
`npm test`（`worker/test/*.test.mjs`）涵蓋 `parseBijiRaces`／`parseMwRaces`(對 `test/fixtures/` 的精簡真實樣本)、`mergeRaces`、`validateRaces` 等,可當規格佐證——改解析邏輯後請一併更新樣本/測試。要實跑整條 cron(真連網抓取+合併),可用 mock KV 呼叫 `scheduled()`:
```js
import worker from './src/index.js';
const store = new Map();
const KV = { get:async k=>store.get(k)??null, put:async (k,v)=>store.set(k,v), delete:async k=>store.delete(k) };
await worker.scheduled({}, { KV });
console.log(JSON.parse(store.get('races')).length);
```
