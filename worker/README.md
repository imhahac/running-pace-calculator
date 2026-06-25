# 配速計算機 — Cloudflare Worker 後端

單一 Worker 提供：

- **賽事 API** — `GET /api/races`（公開、由 KV 提供）、`PUT /api/races`（管理員）——以你掌控的穩定後端取代脆弱的 GAS 爬蟲。
- **Magic-link 登入** — 免密碼，透過 [SendGrid](https://sendgrid.com) 寄 Email 魔術連結。
- **個人雲端同步** — `GET/PUT /api/data` 儲存每位使用者的工具輸入與偏好，跨裝置同步。

> ⚠️ 賽事網站多為 JS/SPA＋登入牆，匿名爬取仍困難（同 GAS 註記）。可靠做法是管理員以 `PUT /api/races` 維護清單；每日 cron 僅記錄各來源目前回傳的內容，以便日後調整。

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
