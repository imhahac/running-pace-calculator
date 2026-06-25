# Running Pace Calculator — Cloudflare Worker backend

A single Worker that provides:

- **Race API** — `GET /api/races` (public, from KV), `PUT /api/races` (admin) — replaces the fragile GAS scraper with a stable backend you own.
- **Magic-link auth** — passwordless email login via [SendGrid](https://sendgrid.com).
- **Per-user cloud sync** — `GET/PUT /api/data` stores each user's tool inputs + preferences, synced across devices.

> ⚠️ Scraping the JS/SPA + login-walled race sites is still hard (same as the GAS note). The reliable path is admin curation via `PUT /api/races`; the daily cron only logs what the sources currently return so it can be tuned.

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/races` | public | List races (KV `races`) |
| PUT | `/api/races` | admin (Bearer) | Replace race list (JSON array of `IRaceEvent`) |
| POST | `/api/auth/request` | public | `{ email }` → emails a magic link |
| GET | `/api/auth/verify?token=…` | public | Exchange magic token → `{ token: sessionId, email }` |
| POST | `/api/auth/logout` | Bearer | Invalidate session |
| GET | `/api/data` | Bearer | Get the user's saved blob |
| PUT | `/api/data` | Bearer | Replace the user's saved blob |

Auth is a **Bearer session token** (`Authorization: Bearer <sessionId>`) stored client-side — no cookies, so CORS stays simple.

**Security notes / tradeoffs:**
- The session token lives in `localStorage` (readable by JS) — the standard SPA tradeoff. Acceptable here (data is only training inputs + your email); for higher sensitivity, move to an HttpOnly cookie + `SameSite`/CORS-credentials flow.
- Magic tokens are single-use, 256-bit, 15-min TTL; sessions 30 days; one magic-link request per email per minute. CORS is locked to `ALLOWED_ORIGIN` (a **bare origin** — the Worker normalises it, but set it without a path).
- `DEBUG_AUTH="1"` makes `/api/auth/request` return whether the email actually sent (handy while configuring SendGrid); leave it unset in production so address existence isn't leaked.

## Configure & deploy (GitHub Actions — recommended)

All configuration lives in **GitHub**, not in the repo — no real ids or keys are committed. Do this once:

**1. KV namespace — nothing to do**

The deploy workflow creates the KV namespace for you on the first deploy
(list-or-create) and writes its id back to the `KV_NAMESPACE_ID` repository
Variable, so there is **no local `wrangler kv namespace create` step**. (You may
still pin `KV_NAMESPACE_ID` yourself to skip auto-resolution.)

**2. Get Cloudflare credentials**

- **API token**: dashboard → **My Profile → API Tokens → Create Token** → use the **"Edit Cloudflare Workers"** template (grants Account → _Workers Scripts: Edit_ and _Workers KV Storage: Edit_).
- **Account ID**: **Workers & Pages** → right sidebar.

**3. SendGrid (magic-link email — no domain needed)**

- **Settings → Sender Authentication → Single Sender Verification** → verify an email you own; that address is your `FROM_EMAIL`.
- **Settings → API Keys → Create API Key** with the _Mail Send_ permission.

**4. Add the config to GitHub** → repo **Settings → Secrets and variables → Actions**:

| Name                    | Type     | Example                                            | Purpose                                          |
| ----------------------- | -------- | -------------------------------------------------- | ------------------------------------------------ |
| `APP_URL`               | Variable | `https://imhahac.github.io/running-pace-calculator/` | Where the magic link points back                 |
| `ALLOWED_ORIGIN`        | Variable | `https://imhahac.github.io`                        | CORS origin (bare, no path; `*` only for testing) |
| `FROM_EMAIL`            | Variable | the verified Single Sender                         | Magic-link "from" address                        |
| `ADMIN_EMAILS`          | Variable | `you@example.com` (comma-separated, **no spaces**) | Who may `PUT /api/races`                          |
| `KV_NAMESPACE_ID`       | Variable | _(auto)_                                           | **CI-managed** — created + written back on first deploy; set it manually only to pin a specific namespace |
| `CLOUDFLARE_API_TOKEN`  | Secret   | —                                                  | Deploy auth (+ KV create/list)                   |
| `CLOUDFLARE_ACCOUNT_ID` | Secret   | —                                                  | Deploy target                                    |
| `SENDGRID_API_KEY`      | Secret   | `SG.…`                                             | Sends the magic-link email                        |
| `GH_VARIABLES_TOKEN`    | Secret   | fine-grained PAT                                   | Persists the auto-created KV id back to `KV_NAMESPACE_ID` (needs repo **Variables: read & write**) |

**5. Deploy** — push any change under `worker/**` (or run the workflow manually). [`.github/workflows/deploy-worker.yml`](../.github/workflows/deploy-worker.yml) always runs the unit tests + a `wrangler deploy --dry-run` bundle check (no account needed); once the secrets above exist it **auto-resolves the KV namespace** (reuse `KV_NAMESPACE_ID` if pinned, else list-or-create and write it back), injects that id, deploys with the vars (`--var`), then uploads `SENDGRID_API_KEY`. If anything is missing it **skips the deploy with a warning** — it never fails the build.

### Local development / manual deploy

`wrangler.toml` keeps harmless dev defaults for `[vars]` plus a placeholder KV id (local `wrangler dev` needs no real id). For local secrets, copy `.dev.vars.example` → `.dev.vars` (holds `SENDGRID_API_KEY`), then `npm run dev`. To deploy by hand instead of via CI: put the real KV id in `wrangler.toml`, `npx wrangler secret put SENDGRID_API_KEY`, then `npm run deploy`. Pure-helper unit tests: `npm test`.

## Wire the frontend

Either bake the URL into the deployed site (recommended) or set it per-browser:

- **Build-time default (recommended):** add a repository **Variable** `BACKEND_URL` (and, if you still use the legacy GAS source, `GAS_API_URL`) under **Settings → Secrets and variables → Actions**. The Pages build ([pipeline.yml](../.github/workflows/pipeline.yml)) bakes them into the bundle so the site works out-of-the-box.
- **Per-browser override:** in the app's **⚙️ 系統設定 / Settings**, set **後端 URL (Worker)** to the deployed Worker origin, e.g. `https://running-pace-backend.<you>.workers.dev` (a non-empty value here always wins over the build default).

With a backend URL in effect the app then:

- loads races from `${backendUrl}/api/races` (falls back to the old GAS URL if unset);
- shows an email login box → magic link → signed-in state;
- pulls your saved tool inputs/preferences on login and pushes changes automatically.

## Seed races (admin)

```bash
curl -X PUT "$WORKER/api/races" \
  -H "Authorization: Bearer $SESSION" \
  -H "Content-Type: application/json" \
  -d '[{"id":"r1","date":"2026-12-20","name":"台北馬拉松","location":"台北","registrationLink":"","stravaFull":"","stravaHalf":"","gpxFull":"","gpxHalf":""}]'
```

(`$SESSION` = the token returned by `/api/auth/verify` for an email listed in `ADMIN_EMAILS`.)
