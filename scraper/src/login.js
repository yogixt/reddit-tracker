// =============================================================================
// One-time headed login helper
// -----------------------------------------------------------------------------
// Usage:
//   npm run login:quora
//   npm run login:linkedin
//
// Why headed + manual: these platforms use 2FA and bot detection that break
// headless/automated login. So a human logs in ONCE in a real visible browser,
// and we persist the resulting Playwright storageState (cookies + localStorage).
// That state is what the cron worker replays later. Sessions expire, so expect
// to re-run this occasionally (see README "Reliability & ToS").
//
// After you finish logging in, come back to THIS terminal and press Enter.
// The script then:
//   1. saves the session to sessions/<platform>.json
//   2. prints a base64 blob to paste into the matching GitHub secret
// =============================================================================

import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SESSIONS_DIR = resolve(__dirname, '..', 'sessions');

// Landing pages that let a human reach the login form quickly.
const START_URLS = {
  quora: 'https://www.quora.com/',
  linkedin: 'https://www.linkedin.com/login',
  reddit: 'https://www.reddit.com/login/',
};

// The env var each platform's base64 session should be pasted into.
const ENV_NAMES = {
  quora: 'QUORA_STORAGE_STATE_B64',
  linkedin: 'LINKEDIN_STORAGE_STATE_B64',
  reddit: 'REDDIT_STORAGE_STATE_B64',
};

function waitForEnter(promptText) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(promptText, () => { rl.close(); res(); }));
}

async function main() {
  const platform = (process.argv[2] || '').toLowerCase();
  if (!START_URLS[platform]) {
    console.error(`Unknown platform "${platform}". Use one of: ${Object.keys(START_URLS).join(', ')}`);
    process.exit(1);
  }

  console.log(`\n[login:${platform}] Launching a HEADED browser.`);
  console.log(`[login:${platform}] Log in fully (complete any 2FA / captcha).`);
  console.log(`[login:${platform}] When you can see the logged-in home/feed, return here and press Enter.\n`);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(START_URLS[platform], { waitUntil: 'domcontentloaded' });
  } catch (err) {
    console.warn(`[login:${platform}] initial navigation warning: ${err.message}`);
  }

  await waitForEnter(`[login:${platform}] Press Enter once you are logged in... `);

  await mkdir(SESSIONS_DIR, { recursive: true });
  const outPath = resolve(SESSIONS_DIR, `${platform}.json`);
  await context.storageState({ path: outPath });
  await browser.close();

  const raw = await readFile(outPath);
  const b64 = raw.toString('base64');

  console.log(`\n[login:${platform}] Saved session to: ${outPath}`);
  console.log(`[login:${platform}] Set this GitHub secret -> ${ENV_NAMES[platform]}`);
  console.log('-----BEGIN BASE64 STORAGE STATE-----');
  console.log(b64);
  console.log('-----END BASE64 STORAGE STATE-----');
  console.log(`\n[login:${platform}] Copy everything between the markers into the secret value.\n`);
}

main().catch((err) => {
  console.error(`[login] fatal: ${err.message}`);
  process.exit(1);
});
