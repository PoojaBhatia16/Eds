/*
 * blocks/hero/hero.js — RE:WEAR editorial hero (3-column)
 *
 * Author as a 2-cell table (row 1 = "Hero", row 2 = two image cells):
 *   | Hero |                              |
 *   | (model image)  | (new-arrival image) |
 *
 * If you author only ONE image, the model shows and the thumb slot stays empty.
 */

/* ── VARIANT: hero (banner) ──
 * Authored as | Hero (banner) | — renders the browse-page title banner
 * (was the separate `banner` block; merged per EDS variation doctrine:
 * "avoid creating a dark-hero block when hero (dark) will do").
 * Config rows: Title | Label | Show Count (or old positional style). */
const BANNER_DEFAULTS = { 'title': 'All Finds', 'label': 'Curated pieces', 'show count': 'true' };

function readBannerConfig(block) {
  const cfg = { ...BANNER_DEFAULTS };
  const rows = [...block.querySelectorAll(':scope > div')];
  let keyed = false;
  rows.forEach((row) => {
    const cells = row.querySelectorAll(':scope > div');
    if (cells.length >= 2) {
      const key = cells[0].textContent.trim().toLowerCase();
      if (key === 'title' || key === 'label' || key === 'show count') {
        cfg[key] = cells[1].textContent.trim();
        keyed = true;
      }
    }
  });
  if (!keyed) {
    if (rows[0]) cfg['title'] = rows[0].textContent.trim() || cfg['title'];
    if (rows[1]) cfg['label'] = rows[1].textContent.trim() || cfg['label'];
  }
  return cfg;
}

function decorateBanner(block) {
  const cfg = readBannerConfig(block);
  const showCount = String(cfg['show count']).toLowerCase() === 'true';
  block.textContent = '';
  const parts = cfg['title'].split(' ');
  const last = parts.pop();
  const head = parts.join(' ');
  block.innerHTML = `
    <div class="container">
      <div class="browse-banner-inner">
        <h1 class="browse-banner-title">${head} <em>${last}</em></h1>
        ${showCount ? `
        <div class="browse-banner-meta">
          <span class="browse-banner-count" id="bannerCount">—</span>
          <span class="browse-banner-label">${cfg['label']}</span>
        </div>` : ''}
      </div>
    </div>`;
}

export default function decorate(block) {
  // variant: | Hero (banner) |
  if (block.classList.contains('banner')) { decorateBanner(block); return; }

  // Select <picture> only (NOT "picture, img" — that double-counts the inner img).
  let pics = [...block.querySelectorAll('picture')];
  if (!pics.length) pics = [...block.querySelectorAll('img')]; // fallback if no <picture>
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
    // LCP fix: the hero model image is the page's LCP — it must load eagerly
    // with high priority. EDS defaults authored images to loading="lazy".
    const modelImg = model.tagName === 'IMG' ? model : model.querySelector('img');
    if (modelImg) {
      modelImg.setAttribute('loading', 'eager');
      modelImg.setAttribute('fetchpriority', 'high');
      modelImg.setAttribute('decoding', 'async');
    }
    grid.querySelector('.hero-model-wrap').prepend(model);
  }
  if (thumb) {
    grid.querySelector('.hero-thumb').prepend(thumb);
  }
}