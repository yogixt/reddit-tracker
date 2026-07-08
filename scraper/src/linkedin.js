// =============================================================================
// LinkedIn profile scraper
// -----------------------------------------------------------------------------
// !! ToS WARNING — READ THIS !!
// Scraping LinkedIn violates the LinkedIn User Agreement and Terms of Service.
// It can get the bot account (and potentially the person's account) restricted
// or permanently banned, and LinkedIn actively fingerprints and blocks
// automation, especially from datacenter IPs like GitHub Actions runners.
// This module exists because the user explicitly chose to accept that risk.
// It is deliberately conservative and entirely best-effort.
//
// BEST-EFFORT, EXPECTED TO BREAK.
// LinkedIn's DOM is heavily obfuscated, localised, lazy-loaded, and A/B-tested.
// Every selector below is a guess and WILL rot. Any field we can't read returns
// 0 rather than throwing, so a single broken selector never sinks the run. The
// app supports manual metric entry as the intended fallback when this returns
// zeros.
//
// The numbers we try to read from a LinkedIn profile:
//   likes       -> reactions received on recent activity (best-effort)
//   comments    -> comments on recent activity (best-effort)
//   posts       -> posts authored in the visible activity window (best-effort)
//   communities -> hashtags / groups surfaced on the profile (comma list)
// =============================================================================

// --- SELECTORS (centralised so a maintainer can fix rot in one place) --------
// LinkedIn class names are hashed and change; we prefer text/aria heuristics.
const SELECTORS = {
  // Recent-activity feed items on the /recent-activity/all/ view.
  activityItem: 'li.profile-creator-shared-feed-update__container, div.feed-shared-update-v2, li.artdeco-card',
  // Social counts row inside an activity item.
  reactionsCount: '[aria-label*="reaction"], [aria-label*="Reaction"], .social-details-social-counts__reactions-count',
  commentsCount: '[aria-label*="comment"], [aria-label*="Comment"], .social-details-social-counts__comments',
  // Hashtags / topics anywhere on the page.
  hashtag: 'a[href*="/feed/hashtag/"], a[href*="hashtag"]',
};

// Parse LinkedIn abbreviated counts ("1,234", "1.2K", "3M").
function parseCount(raw) {
  if (!raw) return 0;
  const m = String(raw).match(/([\d.,]+)\s*([KMkm]?)/);
  if (!m) return 0;
  const n = parseFloat(m[1].replace(/,/g, ''));
  if (Number.isNaN(n)) return 0;
  const suf = m[2].toLowerCase();
  const mult = suf === 'k' ? 1_000 : suf === 'm' ? 1_000_000 : 1;
  return Math.round(n * mult);
}

// Normalise a stored handle into a full LinkedIn profile URL.
// Accepts full URLs, "in/slug", or bare "slug".
export function toProfileUrl(handle) {
  const h = String(handle || '').trim();
  if (/^https?:\/\//i.test(h)) return h.replace(/\/+$/, '');
  const slug = h.replace(/^\/?in\//i, '').replace(/^\/+/, '').replace(/\/+$/, '');
  return `https://www.linkedin.com/in/${slug}`;
}

// The recent-activity view where reactions/comments/posts are visible.
function toActivityUrl(handle) {
  return `${toProfileUrl(handle)}/recent-activity/all/`;
}

async function sumSocialCounts(page, selector) {
  try {
    const values = await page.$$eval(selector, (els) =>
      els.map((e) => e.getAttribute('aria-label') || e.textContent || '')
    );
    let total = 0;
    for (const v of values) {
      const m = String(v).match(/([\d.,]+\s*[KMkm]?)/);
      if (m) total += Number(m[1].replace(/[^\d.KMkm]/g, '')) || 0;
    }
    // Fall back to a simple sum via parseCount for robustness.
    let robust = 0;
    for (const v of values) robust += parseCount(v);
    return robust || total || 0;
  } catch {
    return 0;
  }
}

async function countPosts(page) {
  try {
    return await page.$$eval(SELECTORS.activityItem, (els) => els.length);
  } catch {
    return 0;
  }
}

async function readCommunities(page) {
  try {
    const tags = await page.$$eval(SELECTORS.hashtag, (els) =>
      els
        .map((e) => (e.textContent || '').trim())
        .filter((t) => t.length > 0 && t.length < 40)
    );
    const unique = [...new Set(tags)].slice(0, 10);
    return unique.join(', ');
  } catch {
    return '';
  }
}

/**
 * Scrape a single LinkedIn profile's recent activity.
 * @param {import('playwright').Page} page - a page from an authenticated context
 * @param {string} handle - stored handle (URL, "in/slug", or "slug")
 * @returns {Promise<{likes:number, comments:number, posts:number, communities:string}>}
 */
export async function scrapeProfile(page, handle) {
  const url = toActivityUrl(handle);

  // Navigation may redirect to a login wall or auth-check when the IP/session
  // is flagged. Detect that and bail out to zeros rather than throwing.
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(3_000);

    const current = page.url();
    if (/\/(login|checkpoint|authwall)/i.test(current)) {
      console.warn(`[linkedin] hit auth wall for ${handle} (session likely invalid/blocked)`);
      return { likes: 0, comments: 0, posts: 0, communities: '' };
    }

    // Scroll a little to lazy-load a window of activity. Fixed steps, not random.
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(1_200);
    }
  } catch (err) {
    console.warn(`[linkedin] navigation failed for ${handle}: ${err.message}`);
    return { likes: 0, comments: 0, posts: 0, communities: '' };
  }

  // Each field independent + best-effort. A failure is a 0, never a throw.
  const likes = await sumSocialCounts(page, SELECTORS.reactionsCount);
  const comments = await sumSocialCounts(page, SELECTORS.commentsCount);
  const posts = await countPosts(page);
  const communities = await readCommunities(page);

  return { likes, comments, posts, communities };
}
