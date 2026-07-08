/*
 * blocks/home-section/home-section.js
 *
 * ONE reusable block that replaces three former home-page blocks —
 * `marquee`, `purpose-split`, and `reviews` — using EDS variations.
 *
 * Author each on the home doc by adding a variation in the block name:
 *   | Home Section (marquee) |
 *   | Ready-To-Wear · Vintage Finds · One of a Kind · Sustainable Fashion · Second Life Clothing |
 *
 *   | Home Section (purpose) |
 *
 *   | Home Section (reviews) |
 *
 * EDS turns "Home Section (marquee)" into class="home-section marquee", so we
 * read the variation from the block's classList and render the right content.
 * marquee still reads its phrases from the authored text; purpose & reviews
 * are baked-in editorial content (author them as empty blocks).
 */

/* ── MARQUEE ── */
function renderMarquee(block) {
  const raw = block.textContent.trim();
  block.textContent = '';
  const items = raw.split(/[·|✦]/).map((s) => s.trim()).filter(Boolean);
  if (!items.length) return;

  const track = document.createElement('div');
  track.className = 'marquee-track';
  const buildSet = () => items
    .map((t) => `<span class="marquee-item">${t}</span><span class="marquee-dot">✦</span>`)
    .join('');
  // duplicated so translateX(-50%) lands on an identical frame (seamless loop)
  track.innerHTML = buildSet() + buildSet();
  block.append(track);
}

/* ── PURPOSE SPLIT ── */
const PURPOSE_BUY = `
  <div class="purpose-card purpose-card--buy">
    <p class="purpose-eyebrow">For Buyers</p>
    <h2 class="purpose-title">Discover Pre-Loved<br><em>Fashion</em></h2>
    <p class="purpose-sub">Curated vintage, thrift, and contemporary pieces — all verified, all unique.</p>
    <a href="/browse" class="btn btn-primary purpose-btn">Browse Finds →</a>
  </div>`;
const PURPOSE_DIVIDER = '<div class="purpose-divider"><span>or</span></div>';
const PURPOSE_SELL = `
  <div class="purpose-card purpose-card--sell">
    <p class="purpose-eyebrow">For Sellers</p>
    <h2 class="purpose-title">Turn Your Wardrobe<br>Into <em>Cash</em></h2>
    <p class="purpose-sub">List your pre-loved pieces in minutes. Our team reviews every submission for quality.</p>
    <a href="/sell" class="btn btn-accent purpose-btn">Start Selling →</a>
  </div>`;

function renderPurpose(block) {
  block.innerHTML = PURPOSE_BUY + PURPOSE_DIVIDER + PURPOSE_SELL;
}

/* ── REVIEWS ── */
const STAR = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.3 6.8.6-5.1 4.5 1.5 6.7L12 17.3 5.9 20.6l1.5-6.7L2.3 8.9l6.8-.6z"/></svg>';
const STARS = STAR.repeat(5);
const CHECK = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
const REVIEW_CARDS = [
  { init: 'A', name: 'Aisha R.', tag: 'Verified Buyer', text: 'Found a vintage Levi’s jacket in better shape than described. Smooth, fast, and packaged with care.' },
  { init: 'K', name: 'Karan M.', tag: 'Verified Buyer', text: 'Love that every piece is hand-checked before it’s listed. No surprises — just great finds.' },
  { init: 'N', name: 'Neha S.', tag: 'Verified Seller', text: 'Listed three pieces from my closet in a week. The whole selling flow is genuinely simple.' },
  { init: 'P', name: 'Priya T.', tag: 'Verified Buyer', text: 'A one-of-a-kind co-ord at half the retail price. My new favourite way to shop.' },
];
const REVIEW_PILLS = ['Hand-checked listings', 'Admin-verified sellers', 'One-of-a-kind pieces', 'Free delivery over ₹999'];

function renderReviews(block) {
  block.innerHTML = `
    <div class="container">
      <div class="reviews-head">
        <div>
          <span class="reviews-kicker">What our community says</span>
          <h2 class="reviews-title">Loved by <em>conscious shoppers</em></h2>
        </div>
        <a href="/browse" class="reviews-cta">Browse finds →</a>
      </div>

      <div class="reviews-grid">
        ${REVIEW_CARDS.map((c) => `
          <article class="review-card">
            <div class="review-stars">${STARS}</div>
            <p class="review-text">“${c.text}”</p>
            <div class="review-author">
              <span class="review-avatar">${c.init}</span>
              <div>
                <p class="review-name">${c.name}</p>
                <p class="review-tag">${CHECK} ${c.tag}</p>
              </div>
            </div>
          </article>
        `).join('')}
      </div>

      <div class="reviews-trust">
        ${REVIEW_PILLS.map((p) => `<span class="trust-pill">${p}</span>`).join('')}
      </div>
    </div>
  `;
}

/* ── HERO (3-column editorial) ──
   Ported from the former standalone `hero` block. Reads up to two authored
   images (model + new-arrival thumb) from the block, same as before. */
function renderHero(block) {
  let pics = [...block.querySelectorAll('picture')];
  if (!pics.length) pics = [...block.querySelectorAll('img')];
  const model = pics[0] || null;
  const thumb = pics[1] || null;

  block.textContent = '';

  const grid = document.createElement('div');
  grid.className = 'hero-grid';
  grid.innerHTML = `
    <div class="hero-left">
      <p class="hero-eyebrow">Buy &amp; Sell · Pre-Loved · Conscious</p>
      <h1 class="hero-title">Give Clothes<br>a <em>Second Life</em></h1>
      <p class="hero-sub">RE:WEAR is a curated thrift marketplace. Discover pre-loved fashion, or sell pieces you no longer wear.</p>
      <a href="/browse" class="btn btn-primary hero-cta">Shop Now</a>
    </div>
    <div class="hero-center">
      <div class="hero-model-wrap"><div class="hero-blob"></div></div>
    </div>
    <div class="hero-right">
      <div class="hero-info">
        <p class="hero-info-text">One-of-a-kind pieces with a story, ready to be yours.</p>
      </div>
      <div class="hero-thumb">
        <div class="hero-thumb-overlay">New Arrival</div>
      </div>
      <div class="hero-curated">
        <strong>Curated Vintage &amp;</strong>
        <strong>Thrift Finds, Just For You!</strong>
      </div>
    </div>
  `;
  block.append(grid);

  if (model) {
    model.classList.add('hero-model');
    const modelImg = model.tagName === 'IMG' ? model : model.querySelector('img');
    if (modelImg) {
      modelImg.setAttribute('loading', 'eager');
      modelImg.setAttribute('fetchpriority', 'high');
      modelImg.setAttribute('decoding', 'async');
      if (!modelImg.getAttribute('width')) {
        modelImg.setAttribute('width', '780');
        modelImg.setAttribute('height', '1040');
      }
    }
    grid.querySelector('.hero-model-wrap').prepend(model);
  }
  if (thumb) {
    const thumbImg = thumb.tagName === 'IMG' ? thumb : thumb.querySelector('img');
    if (thumbImg && !thumbImg.getAttribute('width')) {
      thumbImg.setAttribute('width', '600');
      thumbImg.setAttribute('height', '750');
    }
    grid.querySelector('.hero-thumb').prepend(thumb);
  }
}

export default function decorate(block) {
  // Variation comes from the block name, e.g. "Home Section (reviews)"
  // → class="home-section reviews". Default to marquee if none given.
  if (block.classList.contains('hero')) {
    renderHero(block);
  } else if (block.classList.contains('purpose')) {
    renderPurpose(block);
  } else if (block.classList.contains('reviews')) {
    renderReviews(block);
  } else {
    renderMarquee(block);
  }
}