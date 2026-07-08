# reddit-tracker scraper worker

A standalone Playwright worker that scrapes **Quora** and **LinkedIn** engagement
metrics for a roster of profiles and POSTs them to the reddit-tracker app's
authenticated ingest endpoint. It runs on a daily GitHub Actions cron.

> Reddit is **not** scraped here — the app pulls Reddit via the official API.
> The platform set is configurable (`PLATFORMS`) so Reddit could be added later
> by dropping in a `src/reddit.js` and registering it in `src/index.js`.

---

## How it works

1. Loads config from environment variables.
2. Fetches the target roster from the app:
   `GET ${INGEST_URL_BASE}/api/targets?token=${INGEST_TOKEN}` returning
   `{ targets: [{ platform, handle }] }`. If that fails, it falls back to a
   local `targets.json` (copy `targets.example.json`) so it still runs standalone.
3. For each enabled platform it decodes a **base64 Playwright storageState**
   (a saved logged-in session for one dedicated bot account) from a secret,
   launches headless Chromium with that session, and scrapes each target's
   public profile activity — best-effort.
4. Collects all metrics and POSTs them once to `${INGEST_URL}`.

There is **no interactive login at runtime** — 2FA and bot detection break
headless login. Instead you log in once locally in a real browser and export
the session (below).

### Ingest contract

```
POST ${INGEST_URL}
Authorization: Bearer ${INGEST_TOKEN}
Content-Type: application/json

{
  "date": "YYYY-MM-DD",            // today's date in IST
  "metrics": [
    {
      "platform": "quora" | "linkedin",
      "handle": "<handle exactly as stored on the employee>",
      "likes": 0,                   // upvotes / reactions received (best-effort)
      "comments": 0,                // answers+comments / comments (best-effort)
      "posts": 0,                   // items authored in the window (best-effort)
      "communities": ""             // spaces/topics or hashtags/groups (optional)
    }
  ]
}
```

The **server** resolves `handle` -> employee. The scraper never sees names.

---

## Setup

### 1. Install

```bash
cd scraper
npm install
npx playwright install chromium
```

### 2. One-time login per platform (produces the session secret)

Run these on your **local machine** (they open a real, visible browser). Log in
fully — complete any 2FA / captcha — then return to the terminal and press Enter.

```bash
npm run login:quora
npm run login:linkedin
```

Each command:

- saves the session to `sessions/<platform>.json` (gitignored), and
- prints a **base64 blob** between `-----BEGIN/END BASE64 STORAGE STATE-----`.

Copy that blob into the matching GitHub secret (next section).

To regenerate the base64 from an existing session file manually:

```bash
base64 -i sessions/quora.json | tr -d '\n'      # macOS
base64 -w0 sessions/linkedin.json               # Linux
```

### 3. Local run (optional)

```bash
cp .env.example .env      # fill in values
cp targets.example.json targets.json   # or rely on the API
npm run scrape
```

---

## GitHub secrets to set

In the repo: **Settings -> Secrets and variables -> Actions -> New repository secret**.

| Secret                        | Required | Value                                                                 |
| ----------------------------- | -------- | --------------------------------------------------------------------- |
| `INGEST_URL`                  | yes      | `https://reddit-tracker-beta.vercel.app/api/ingest`                   |
| `INGEST_TOKEN`                | yes      | Shared bearer token the app expects on ingest and `/api/targets`.     |
| `QUORA_STORAGE_STATE_B64`     | yes\*    | Base64 session from `npm run login:quora`.                            |
| `LINKEDIN_STORAGE_STATE_B64`  | yes\*    | Base64 session from `npm run login:linkedin`.                         |
| `PLATFORMS`                   | no       | Comma list; defaults to `quora,linkedin` if unset/empty.              |

\* A platform whose session secret is empty is **skipped with a warning**, not an error.

---

## The cron

Defined in `../.github/workflows/scrape.yml`:

- Schedule: `30 18 * * *` — **18:30 UTC == 00:00 IST** (midnight India time),
  once per day at the day boundary.
- Also runs on demand via **workflow_dispatch** (Actions tab -> Run workflow).
- Steps: checkout -> Node 20 -> `npm ci` (in `scraper/`) ->
  `npx playwright install --with-deps chromium` -> `npm run scrape`.

Exit behavior: the job stays **green** on partial/degraded runs (blocked IPs,
expired sessions, DOM rot) and exits non-zero **only** if the ingest POST itself
fails hard.

---

## Reliability & ToS — read this honestly

This scraper is **best-effort and expected to break periodically**. Treat its
numbers as a convenience, not a source of truth. The app supports **manual
metric entry**, which is the intended fallback whenever the scraper returns
zeros or is blocked.

- **Datacenter-IP blocks.** GitHub Actions runners use datacenter IPs that Quora
  and especially LinkedIn frequently block, throttle, or serve login walls to.
  A blocked run degrades to zeros and skips — it does not crash.
- **Session expiry.** The stored sessions expire (days to weeks). When a platform
  starts returning zeros / hits an auth wall, **re-run `npm run login:<platform>`**
  and update the secret.
- **DOM rot.** Both sites rewrite their HTML constantly. Every selector lives at
  the top of `src/quora.js` / `src/linkedin.js` with comments; each field is
  wrapped in try/catch and returns `0` on failure. When a field consistently
  reports `0`, a selector likely needs updating.
- **LinkedIn ToS / ban risk.** Scraping LinkedIn **violates its Terms of Service**
  and can get the bot account (and potentially real accounts) **restricted or
  permanently banned**. LinkedIn actively fingerprints automation. Using this for
  LinkedIn is the user's explicit, accepted-risk choice. Use a disposable, purpose
  -built bot account — never a personal or business-critical one.

---

## Adding a platform later (e.g. Reddit)

1. Create `src/reddit.js` exporting `async function scrapeProfile(page, handle)`
   that returns `{ likes, comments, posts, communities }`.
2. Import and register it in `SCRAPERS` in `src/index.js`.
3. Add `REDDIT_STORAGE_STATE_B64` (already mapped in `STORAGE_ENV`) as a secret.
4. Add `reddit` to `PLATFORMS` and wire the secret into the workflow env.
