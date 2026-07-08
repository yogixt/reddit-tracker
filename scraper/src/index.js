// =============================================================================
// reddit-tracker scraper worker — entrypoint
// -----------------------------------------------------------------------------
// Flow:
//   1. Load config from env.
//   2. Fetch the roster of {platform, handle} targets from the app
//      (GET /api/targets?token=...), falling back to local targets.json.
//   3. For each enabled platform: decode its base64 storageState from env,
//      launch chromium with that session, scrape each target's public profile.
//   4. Collect all metrics and POST them to the ingest endpoint.
//
// Resilience contract:
//   - A missing/invalid session, or a single failing profile, logs a WARNING,
//     is skipped, and the run continues. It never crashes the whole run.
//   - The process exits 0 in all normal cases INCLUDING partial failure.
//   - The process exits non-zero ONLY if the final ingest POST fails hard.
// =============================================================================

import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as quora from './quora.js';
import * as linkedin from './linkedin.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Per-platform scraper module registry. Add "reddit" here to enable it later.
const SCRAPERS = {
  quora,
  linkedin,
};

// Env var holding each platform's base64 Playwright storageState.
const STORAGE_ENV = {
  quora: 'QUORA_STORAGE_STATE_B64',
  linkedin: 'LINKEDIN_STORAGE_STATE_B64',
  reddit: 'REDDIT_STORAGE_STATE_B64',
};

// --- config ------------------------------------------------------------------
function loadConfig() {
  const ingestUrl = process.env.INGEST_URL || '';
  const ingestToken = process.env.INGEST_TOKEN || '';
  const platforms = (process.env.PLATFORMS || 'quora,linkedin')
    .split(',')
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);

  if (!ingestUrl) throw new Error('INGEST_URL is required');
  if (!ingestToken) throw new Error('INGEST_TOKEN is required');

  return { ingestUrl, ingestToken, platforms };
}

// Today's date as YYYY-MM-DD in IST (UTC+5:30), independent of runner TZ.
function todayIST() {
  const now = new Date();
  const istMs = now.getTime() + (5 * 60 + 30) * 60 * 1000;
  const ist = new Date(istMs);
  return ist.toISOString().slice(0, 10);
}

// Derive the API base ("https://host/api") from the ingest URL so we can build
// the sibling /api/targets URL without a second env var.
function apiBaseFrom(ingestUrl) {
  // e.g. https://host/api/ingest -> https://host/api
  return ingestUrl.replace(/\/ingest\/?$/i, '');
}

// --- targets -----------------------------------------------------------------
async function fetchTargets(config) {
  const base = apiBaseFrom(config.ingestUrl);
  const targetsUrl = `${base}/targets?token=${encodeURIComponent(config.ingestToken)}`;
  try {
    const res = await fetch(targetsUrl, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const targets = Array.isArray(data?.targets) ? data.targets : [];
    if (targets.length === 0) throw new Error('empty targets from API');
    console.log(`[targets] fetched ${targets.length} target(s) from API`);
    return targets;
  } catch (err) {
    console.warn(`[targets] API fetch failed (${err.message}); falling back to targets.json`);
    return loadLocalTargets();
  }
}

async function loadLocalTargets() {
  const paths = [
    resolve(__dirname, '..', 'targets.json'),
    resolve(__dirname, '..', 'targets.example.json'),
  ];
  for (const p of paths) {
    try {
      const raw = await readFile(p, 'utf8');
      const data = JSON.parse(raw);
      const targets = Array.isArray(data?.targets) ? data.targets : [];
      console.log(`[targets] loaded ${targets.length} target(s) from ${p}`);
      return targets;
    } catch {
      // try next path
    }
  }
  console.warn('[targets] no local targets file found; nothing to scrape');
  return [];
}

// --- session state -----------------------------------------------------------
// Decode a platform's base64 storageState env into a Playwright state object.
// Returns null (with a warning) when missing or malformed, so the platform is
// skipped gracefully.
function decodeStorageState(platform) {
  const envName = STORAGE_ENV[platform];
  const b64 = (process.env[envName] || '').trim();
  if (!b64) {
    console.warn(`[${platform}] ${envName} is empty; skipping platform`);
    return null;
  }
  try {
    const json = Buffer.from(b64, 'base64').toString('utf8');
    const state = JSON.parse(json);
    return state;
  } catch (err) {
    console.warn(`[${platform}] could not decode ${envName} (${err.message}); skipping platform`);
    return null;
  }
}

// Index-based staggered delay between profiles. Deliberately NOT Math.random
// (repo rule) but still varies per profile to avoid a fixed rhythm.
function staggerDelayMs(index) {
  const base = 1_500;
  const step = 700;
  const wobble = (index % 5) * 300; // 0,300,600,900,1200 cycling
  return base + step * (index % 4) + wobble;
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// --- scrape one platform -----------------------------------------------------
async function scrapePlatform(platform, targets, metrics) {
  const scraper = SCRAPERS[platform];
  if (!scraper) {
    console.warn(`[${platform}] no scraper module registered; skipping`);
    return;
  }

  const platformTargets = targets.filter(
    (t) => String(t?.platform || '').toLowerCase() === platform && t?.handle
  );
  if (platformTargets.length === 0) {
    console.log(`[${platform}] no targets for this platform; skipping`);
    return;
  }

  const state = decodeStorageState(platform);
  if (!state) return; // warning already logged

  console.log(`[${platform}] launching browser for ${platformTargets.length} target(s)`);
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
  } catch (err) {
    console.warn(`[${platform}] browser launch failed (${err.message}); skipping platform`);
    return;
  }

  let context;
  try {
    context = await browser.newContext({
      storageState: state,
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 900 },
    });
  } catch (err) {
    console.warn(`[${platform}] context creation failed (${err.message}); skipping platform`);
    await browser.close().catch(() => {});
    return;
  }

  for (let i = 0; i < platformTargets.length; i++) {
    const { handle } = platformTargets[i];
    let page;
    try {
      page = await context.newPage();
      const result = await scraper.scrapeProfile(page, handle);
      metrics.push({
        platform,
        handle,
        likes: Number(result?.likes) || 0,
        comments: Number(result?.comments) || 0,
        posts: Number(result?.posts) || 0,
        communities: result?.communities || '',
      });
      console.log(
        `[${platform}] ${handle} -> likes=${result?.likes || 0} ` +
          `comments=${result?.comments || 0} posts=${result?.posts || 0}`
      );
    } catch (err) {
      // A single profile failure must never crash the run.
      console.warn(`[${platform}] failed to scrape ${handle} (${err.message}); skipping`);
    } finally {
      if (page) await page.close().catch(() => {});
    }

    // Staggered pause before the next profile (skip after the last one).
    if (i < platformTargets.length - 1) {
      await sleep(staggerDelayMs(i));
    }
  }

  await context.close().catch(() => {});
  await browser.close().catch(() => {});
}

// --- ingest ------------------------------------------------------------------
async function postIngest(config, date, metrics) {
  const body = JSON.stringify({ date, metrics });
  const res = await fetch(config.ingestUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.ingestToken}`,
      'Content-Type': 'application/json',
    },
    body,
  });

  if (!res.ok) {
    let detail = '';
    try {
      detail = await res.text();
    } catch {
      // ignore
    }
    throw new Error(`ingest POST failed: HTTP ${res.status} ${detail}`.trim());
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    // server may return empty body; that's fine
  }
  return json;
}

// --- main --------------------------------------------------------------------
async function main() {
  const config = loadConfig();
  const date = todayIST();
  console.log(`[run] date=${date} (IST) platforms=${config.platforms.join(',')}`);

  const targets = await fetchTargets(config);
  const metrics = [];

  for (const platform of config.platforms) {
    try {
      await scrapePlatform(platform, targets, metrics);
    } catch (err) {
      // Platform-level guard: still never crash the whole run.
      console.warn(`[${platform}] platform run errored (${err.message}); continuing`);
    }
  }

  console.log(`[ingest] collected ${metrics.length} metric row(s)`);

  if (metrics.length === 0) {
    // Nothing scraped (blocked IPs, expired sessions). This is an expected
    // degraded state, not a hard failure — exit 0 so the cron stays green and
    // the app's manual-entry fallback covers the gap.
    console.warn('[ingest] no metrics to send; exiting 0 (degraded run)');
    return;
  }

  // The ONLY hard-failure path: the ingest POST itself.
  const result = await postIngest(config, date, metrics);
  console.log(`[ingest] posted ${metrics.length} row(s) OK`, result ? JSON.stringify(result) : '');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(`[run] FATAL: ${err.message}`);
    process.exit(1);
  });
