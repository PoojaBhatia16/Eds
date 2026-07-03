/*
 * blocks/discover/discover.js — Discover page (CONFIG-DRIVEN, HerbAtlas-style)
 *
 * Two kinds of authorable rows in the block table:
 *
 *  A) CONFIG rows (2 cells):  key | value
 *  B) EDIT rows   (5 cells):  Edit | tag | name | description | href | match | large?
 *     — each "Edit" row is one curated-collection card. Add / remove / reorder
 *       these rows in the doc to change the mosaic. No code needed.
 *
 * Author on the `collection` doc (Discover links to /collection):
 *
 *   | Discover |        |
 *   | Eyebrow          | Discover |
 *   | Title            | Shop |
 *   | Subtitle         | Explore curated edits, or shop by your favourite labels |
 *   | Section Title    | Curated Edits |
 *   | Brand Title      | Shop by Brand |
 *   | Browse Path      | /browse |
 *   | Brand Logo Base  | /images/brands |
 *   | Show Trust Bar   | true |
 *
 *   | Edit | Celebration Ready | Festive<br><em>Wear</em>  | Ethnic & occasion pieces... | /browse?style=occasion      | festive  | large |
 *   | Edit | Budget Friendly   | Under<br><em>₹999</em>    | Steals that don't...        | /browse?maxPrice=999        | budget   |       |
 *   | Edit | College Vibes     | Campus<br><em>Fits</em>   | Easy everyday pieces...     | /browse?collection_type=tops| campus   |       |
 *   | Edit | Premium Labels    | Designer<br><em>Finds</em>| Luxury labels...            | /browse?style=designer      | designer |       |
 *   | Edit | For Little Ones   | Little<br><em>Ones</em>   | Adorable, gently-worn...    | /browse?gender=kids         | kids     |       |
 *
 * "match" drives the image collage + count. Known values: festive, budget,
 * campus, designer, kids. Any other value → empty collage (still links).
 */

import { loadProducts, resizeImg } from '../../scripts/products.js';

const DEFAULTS = {
  'eyebrow': 'Discover',
  'title': 'Shop',
  'subtitle': 'Explore curated edits, or shop by your favourite labels',
  'section title': 'Curated Edits',
  'brand title': 'Shop by Brand',
  'browse path': '/browse',
  'brand logo base': '/images/brands',
  'show trust bar': 'true',
};

/* fallback Edit rows if the author authored none (keeps old behaviour) */
const FALLBACK_EDITS = [
  { tag: 'Celebration Ready', name: 'Festive<br><em>Wear</em>', desc: 'Ethnic & occasion pieces for every celebration.', href: '/browse?style=occasion', match: 'festive', large: true },
  { tag: 'Budget Friendly', name: 'Under<br><em>₹999</em>', desc: "Steals that don't compromise on style.", href: '/browse?maxPrice=999', match: 'budget' },
  { tag: 'College Vibes', name: 'Campus<br><em>Fits</em>', desc: 'Easy everyday pieces for class and beyond.', href: '/browse?collection_type=tops', match: 'campus' },
  { tag: 'Premium Labels', name: 'Designer<br><em>Finds</em>', desc: 'Luxury labels, pre-loved prices.', href: '/browse?style=designer', match: 'designer' },
  { tag: 'For Little Ones', name: 'Little<br><em>Ones</em>', desc: 'Adorable, gently-worn pieces for tiny trendsetters.', href: '/browse?gender=kids', match: 'kids' },
];

/* parse the block table into { cfg, edits } */
function parseBlock(block) {
  const cfg = { ...DEFAULTS };
  const edits = [];
  block.querySelectorAll(':scope > div').forEach((row) => {
    const cells = [...row.querySelectorAll(':scope > div')].map((c) => c.textContent.trim());
    if (!cells.length) return;
    const first = cells[0].toLowerCase();
    if (first === 'edit') {
      // Edit | tag | name | desc | href | match | large?
      edits.push({
        tag: cells[1] || '',
        name: cells[2] || '',
        desc: cells[3] || '',
        href: cells[4] || '#',
        match: (cells[5] || '').toLowerCase(),
        large: (cells[6] || '').toLowerCase().includes('large'),
      });
    } else if (cells.length >= 2 && first) {
      cfg[first] = cells[1];
    }
  });
  return { cfg, edits: edits.length ? edits : FALLBACK_EDITS };
}

/* which products belong to a given collage key */
function matchSet(all, key) {
  const kw = {
    campus: ['campus', 'college', 'casual', 'streetwear', 'tops'],
    festive: ['festive', 'ethnic', 'occasion', 'wedding', 'party'],
    designer: ['designer', 'luxury', 'premium', 'label'],
  };
  if (key === 'budget') return all.filter((p) => (p.price || 0) <= 999);
  if (key === 'campus') return all.filter((p) => p.collection_type === 'tops');
  if (key === 'kids') return all.filter((p) => p.gender === 'kids');
  if (kw[key]) {
    return all.filter((p) => {
      const hay = [p.collection_type, p.category, ...(p.style || []), p.name, p.description].filter(Boolean).join(' ').toLowerCase();
      return kw[key].some((k) => hay.includes(k));
    });
  }
  return [];
}

export default async function decorate(block) {
  const { cfg, edits } = parseBlock(block);
  const showTrust = String(cfg['show trust bar']).toLowerCase() === 'true';

  block.innerHTML = `
    <div class="collection-header">
      <div class="container">
        <p class="collection-header-eyebrow">${cfg['eyebrow']}</p>
        <h1 class="collection-header-title">${cfg['title']}</h1>
        <p class="collection-header-sub">${cfg['subtitle']}</p>
      </div>
    </div>
    <section class="collections-section">
      <div class="container">
        <div class="shop-section-title-row"><h2 class="shop-section-title">${cfg['section title']}</h2></div>
        <div class="collections-grid" id="collectionsGrid">
          ${edits.map((c, i) => `
            <a href="${c.href}" class="collection-card${c.large ? ' collection-card--large' : ''}" data-filter="${c.match || i}">
              <div class="collection-card-bg collection-card-bg--${c.match || 'default'}"></div>
              <div class="collection-card-imgs" id="imgs-${i}"></div>
              <div class="collection-card-overlay"></div>
              <div class="collection-card-content">
                <span class="collection-tag">${c.tag}</span>
                <h2 class="collection-name">${c.name}</h2>
                <p class="collection-desc">${c.desc}</p>
                <span class="collection-cta">Explore →</span>
              </div>
              <div class="collection-card-count" id="count-${i}">— items</div>
            </a>`).join('')}
        </div>
        <div class="shop-section-title-row shop-section-title-row--mt">
          <h2 class="shop-section-title">${cfg['brand title']} <span id="brandsCount" class="brands-count-pill"></span></h2>
        </div>
        <div class="brands-grid" id="brandsGrid"></div>
      </div>
    </section>
    ${showTrust ? `
    <section class="trust-bar">
      <div class="container">
        <div class="trust-items">
          <div class="trust-item"><span class="trust-num">500+</span><span class="trust-label">Items Re-loved</span></div>
          <div class="trust-divider"></div>
          <div class="trust-item"><span class="trust-num">200+</span><span class="trust-label">Active Sellers</span></div>
          <div class="trust-divider"></div>
          <div class="trust-item"><span class="trust-num">1,000+</span><span class="trust-label">Happy Buyers</span></div>
          <div class="trust-divider"></div>
          <div class="trust-item"><span class="trust-num">100%</span><span class="trust-label">Quality Checked</span></div>
        </div>
      </div>
    </section>` : ''}`;

  const $ = (id) => block.querySelector('#' + id);
  const all = await loadProducts();

  /* collages + counts per Edit row */
  edits.forEach((c, i) => {
    const items = matchSet(all, c.match);
    const box = $('imgs-' + i);
    if (box) {
      const imgs = items.flatMap((p) => (p.images || []).slice(0, 1)).slice(0, 5);
      box.innerHTML = imgs.map((src, k) => `<img class="cimg${k === 0 ? ' active' : ''}" src="${resizeImg(src, 600)}" alt="" loading="lazy">`).join('');
      if (imgs.length > 1) {
        let idx = 0;
        const els = box.querySelectorAll('.cimg');
        setInterval(() => {
          els[idx].classList.remove('active');
          idx = (idx + 1) % els.length;
          els[idx].classList.add('active');
        }, 2600 + Math.random() * 900);
      }
    }
    const countEl = $('count-' + i);
    if (countEl) countEl.textContent = `${items.length} item${items.length !== 1 ? 's' : ''}`;
  });

  /* brands */
  renderBrands(all);

  function renderBrands(products) {
    const grid = $('brandsGrid');
    if (!grid) return;
    const map = {};
    products.forEach((p) => {
      const b = (p.brand || 'Other').trim();
      if (!map[b]) map[b] = { name: b, count: 0 };
      map[b].count++;
    });
    const brands = Object.values(map).sort((a, b) => b.count - a.count);
    const countEl = $('brandsCount');
    if (countEl) countEl.textContent = `${brands.length} brands`;
    if (!brands.length) { grid.innerHTML = '<p class="brands-empty">No brands yet.</p>'; return; }
    grid.innerHTML = brands.map((b) => {
      const slug = b.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      return `<a href="${cfg['browse path']}?brand=${encodeURIComponent(b.name)}" class="brand-tile">
        <div class="brand-tile-logo">
          <img src="${cfg['brand logo base']}/${slug}.webp" alt="${b.name}" loading="lazy" data-fallback>
          <span class="brand-tile-fallback">${b.name}</span>
        </div>
        <span class="brand-tile-count">${b.count} piece${b.count !== 1 ? 's' : ''}</span>
      </a>`;
    }).join('');
    grid.querySelectorAll('img[data-fallback]').forEach((img) => {
      img.onerror = () => { img.style.display = 'none'; const fb = img.nextElementSibling; if (fb) fb.style.display = 'block'; };
    });
  }
}