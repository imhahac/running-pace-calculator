# Running Pace Calculator — Cloudflare Worker backend

A single Worker that provides:

- **Race API** — `GET /api/races` (public, from KV), `PUT /api/races` (admin) — replaces the fragile GAS scraper with a stable backend you own.
- **Magic-link auth** — passwordless email login via [Resend](https://resend.com).
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
- `DEBUG_AUTH="1"` makes `/api/auth/request` return whether the email actually sent (handy while configuring Resend); leave it unset in production so address existence isn't leaked.

## Setup

```bash
cd worker
npm install
npx wrangler login

# 1) Create the KV namespace, paste the id into wrangler.toml
npx wrangler kv namespace create KV

# 2) Set the Resend secret (free tier; verify a sender domain first)
npx wrangler secret put RESEND_API_KEY

# 3) Edit wrangler.toml vars: APP_URL, ALLOWED_ORIGIN, FROM_EMAIL, ADMIN_EMAILS

# 4) Deploy
npm run deploy
```

Local dev: copy `.dev.vars.example` → `.dev.vars` (holds `RESEND_API_KEY`), then `npm run dev`.
Unit tests for the pure helpers: `npm test` (`node --test`).

## Deploy via GitHub Actions

[`.github/workflows/deploy-worker.yml`](../.github/workflows/deploy-worker.yml) runs the worker unit tests and `wrangler deploy` on every push to `main` that touches `worker/**` (or via manual *Run workflow*).

One-time setup:

1. Put the **real KV namespace id** (and `APP_URL` / `ALLOWED_ORIGIN` / `FROM_EMAIL` / `ADMIN_EMAILS`) into `wrangler.toml` and commit it (these are not secrets).
2. Add repo **Actions secrets**: `CLOUDFLARE_API_TOKEN` (Workers-edit scope) and `CLOUDFLARE_ACCOUNT_ID`.
3. Set `RESEND_API_KEY` **once** (`npx wrangler secret put RESEND_API_KEY` or the dashboard) — Worker secrets persist across deploys. To manage it from CI instead, enable the commented `secrets:`/`env:` block in the workflow and add `RESEND_API_KEY` to repo secrets.

After that, pushing changes under `worker/` auto-deploys.

## Wire the frontend

In the app's **⚙️ 系統設定 / Settings**, set **後端 URL (Worker)** to the deployed Worker origin, e.g. `https://running-pace-backend.<you>.workers.dev`. The app then:

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
