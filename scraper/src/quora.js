// =============================================================================
// Quora profile scraper
// -----------------------------------------------------------------------------
// BEST-EFFORT, EXPECTED TO BREAK.
// Quora ships no public API and rewrites its DOM frequently. Every selector
// below is a guess based on the public profile layout at the time of writing
// and WILL rot. When a field can't be read we return 0 for that field instead
// of throwing, so one broken selector never sinks the whole run. The app also
// supports manual metric entry, which is the intended fallback when this
// scraper returns zeros.
//
// The numbers we try to read from a public Quora profile:
//   likes       -> total upvotes received (profile stat, best-effort)
//   comments    -> answers + comments authored (profile stats, best-effort)
//   posts       -> posts authored (profile stat, best-effort)
//   communities -> Spaces / top topics the person is active in (comma list)
// =============================================================================

// --- SELECTORS (centralised so a maintainer can fix rot in one place) --------
// These target visible stat text on a Quora profile. Quora localises and
// A/B-tests these strings constantly, so we match loosely (regex over text)
// rather than relying on stable class names, which Quora obfuscates.
const SELECTORS = {
  // Any element whose text looks like a labelled counter, e.g. "1.2K Answers".
  statText: 'div, span, a',
  // Tabs / links that name Spaces the profile belongs to.
  spaceLink: 'a[href*="/q/"], a[href*="/space/"]',
};

// Regexes that pull "<count> <label>" style stats out of arbitrary text.
const STAT_PATTERNS = {
  likes: /([\d.,]+\s*[km]?)\s*(?:upvotes?)/i,
  answers: /([\d.,]+\s*[km]?)\s*(?:answers?)/i,
  comments: /([\d.,]+\s*[km]?)\s*(?:comments?)/i,
  posts: /([\d.,]+\s*[km]?)\s*(?:posts?)/i,
};

// Convert Quora's abbreviated counts ("1.2K", "3.4M", "987") to an integer.
function parseCount(raw) {
  if (!raw) return 0;
  const s = String(raw).trim().toLowerCase().replace(/,/g, '');
  const m = s.match(/^([\d.]+)\s*([km]?)$/);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  if (Number.isNaN(n)) return 0;
  const mult = m[2] === 'k' ? 1_000 : m[2] === 'm' ? 1_000_000 : 1;
  return Math.round(n * mult);
}

// Normalise a stored handle into a full Quora profile URL.
// Accepts full URLs, "profile/Name", or bare "Name".
export function toProfileUrl(handle) {
  const h = String(handle || '').trim();
  if (/^https?:\/\//i.test(h)) return h;
  const slug = h.replace(/^\/?profile\//i, '').replace(/^\/+/, '');
  return `https://www.quora.com/profile/${slug}`;
}

// Pull the whole visible text of the profile once; run every regex against it.
// One page read, many best-effort extractions.
async function readStat(page, pattern) {
  try {
    const text = await page.evaluate(() => document.body?.innerText || '');
    const m = text.match(pattern);
    return m ? parseCount(m[1]) : 0;
  } catch {
    return 0;
  }
}

async function readCommunities(page) {
  try {
    const names = await page.$$eval(SELECTORS.spaceLink, (els) =>
      els
        .map((e) => (e.textContent || '').trim())
        .filter((t) => t.length > 0 && t.length < 60)
    );
    // De-dupe, cap the list so we don't post a wall of text.
    const unique = [...new Set(names)].slice(0, 10);
    return unique.join(', ');
  } catch {
    return '';
  }
}

/**
 * Scrape a single Quora profile.
 * @param {import('playwright').Page} page - a page from an authenticated context
 * @param {string} handle - stored handle (URL, "profile/Name", or "Name")
 * @returns {Promise<{likes:number, comments:number, posts:number, communities:string}>}
 */
export async function scrapeProfile(page, handle) {
  const url = toProfileUrl(handle);

  // Navigation itself can fail (blocked IP, deleted profile). Treat as zeros.
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    // Quora hydrates stats client-side; give it a moment. Fixed wait, not random.
    await page.waitForTimeout(2_500);
  } catch (err) {
    console.warn(`[quora] navigation failed for ${handle}: ${err.message}`);
    return { likes: 0, comments: 0, posts: 0, communities: '' };
  }

  // Each field is independent and best-effort. A failure in one is a 0, not a throw.
  const likes = await readStat(page, STAT_PATTERNS.likes);
  const answers = await readStat(page, STAT_PATTERNS.answers);
  const commentsOnly = await readStat(page, STAT_PATTERNS.comments);
  const posts = await readStat(page, STAT_PATTERNS.posts);
  const communities = await readCommunities(page);

  // "comments" in the contract means answers + comments authored.
  const comments = answers + commentsOnly;

  return { likes, comments, posts, communities };
}
