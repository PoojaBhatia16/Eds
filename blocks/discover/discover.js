/*
 * blocks/discover/discover.js — Discover page (Curated Edits + Shop by Brand + trust bar)
 * Ported from collection.js. No GSAP. CSP-clean (brand onerror → JS).
 * Author empty block on `collection` doc (Discover links to /collection):  | Discover |
 */

import { loadProducts, resizeImg } from '../../scripts/products.js';

const CARDS = [
  { key: 'festive', href: '/browse?style=occasion', large: true, tag: 'Celebration Ready', name: 'Festive<br><em>Wear</em>', desc: 'Ethnic & occasion pieces for every celebration.' },
  { key: 'budget', href: '/browse?maxPrice=999', tag: 'Budget Friendly', name: 'Under<br><em>₹999</em>', desc: "Steals that don't compromise on style." },
  { key: 'campus', href: '/browse?collection_type=tops', tag: 'College Vibes', name: 'Campus<br><em>Fits</em>', desc: 'Easy everyday pieces for class and beyond.' },
  { key: 'designer', href: '/browse?style=designer', tag: 'Premium Labels', name: 'Designer<br><em>Finds</em>', desc: 'Luxury labels, pre-loved prices.' },
  { key: 'kids', href: '/browse?gender=kids', tag: 'For Little Ones', name: 'Little<br><em>Ones</em>', desc: 'Adorable, gently-worn pieces for tiny trendsetters.' },
];

export default async function decorate(block) {
  block.innerHTML = `
    <div class="collection-header">
      <div class="container">
        <p class="collection-header-eyebrow">Discover</p>
        <h1 class="collection-header-title">Shop</h1>
        <p class="collection-header-sub">Explore curated edits, or shop by your favourite labels</p>
      </div>
    </div>
    <section class="collections-section">
      <div class="container">
        <div class="shop-section-title-row"><h2 class="shop-section-title">Curated Edits</h2></div>
        <div class="collections-grid" id="collectionsGrid">
          ${CARDS.map((c) => `
            <a href="${c.href}" class="collection-card${c.large ? ' collection-card--large' : ''}" data-filter="${c.key}">
              <div class="collection-card-bg collection-card-bg--${c.key}"></div>
              <div class="collection-card-imgs" id="imgs-${c.key}"></div>
              <div class="collection-card-overlay"></div>
              <div class="collection-card-content">
                <span class="collection-tag">${c.tag}</span>
                <h2 class="collection-name">${c.name}</h2>
                <p class="collection-desc">${c.desc}</p>
                <span class="collection-cta">Explore →</span>
              </div>
              <div class="collection-card-count" id="count-${c.key}">— items</div>
            </a>`).join('')}
        </div>
        <div class="shop-section-title-row shop-section-title-row--mt">
          <h2 class="shop-section-title">Shop by Brand <span id="brandsCount" class="brands-count-pill"></span></h2>
        </div>
        <div class="brands-grid" id="brandsGrid"></div>
      </div>
    </section>
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
    </section>`;

  const $ = (id) => block.querySelector('#' + id);
  const all = await loadProducts();

  const sets = {
    budget: all.filter((p) => (p.price || 0) <= 999),
    campus: all.filter((p) => p.collection_type === 'tops'),
    festive: all.filter((p) => matchesCollection(p, 'festive')),
    designer: all.filter((p) => matchesCollection(p, 'designer')),
    kids: all.filter((p) => p.gender === 'kids'),
  };

  /* rotating image collages + counts */
  Object.entries(sets).forEach(([key, items]) => {
    const box = $('imgs-' + key);
    if (box) {
      const imgs = items.flatMap((p) => (p.images || []).slice(0, 1)).slice(0, 5);
      box.innerHTML = imgs.map((src, i) => `<img class="cimg${i === 0 ? ' active' : ''}" src="${resizeImg(src, 600)}" alt="" loading="lazy">`).join('');
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
    const countEl = $('count-' + key);
    if (countEl) countEl.textContent = `${items.length} item${items.length !== 1 ? 's' : ''}`;
  });

  /* brands */
  renderBrands(all);

  function matchesCollection(product, type) {
    const searchIn = [product.collection_type, product.category, ...(product.style || []), product.name, product.description].filter(Boolean).join(' ').toLowerCase();
    const keywords = {
      campus: ['campus', 'college', 'casual', 'streetwear', 'tops'],
      festive: ['festive', 'ethnic', 'occasion', 'wedding', 'party'],
      designer: ['designer', 'luxury', 'premium', 'label'],
    };
    return (keywords[type] || []).some((kw) => searchIn.includes(kw));
  }

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
      return `<a href="/browse?brand=${encodeURIComponent(b.name)}" class="brand-tile">
        <div class="brand-tile-logo">
          <img src="/images/brands/${slug}.webp" alt="${b.name}" loading="lazy" data-fallback>
          <span class="brand-tile-fallback">${b.name}</span>
        </div>
        <span class="brand-tile-count">${b.count} piece${b.count !== 1 ? 's' : ''}</span>
      </a>`;
    }).join('');
    /* CSP-clean image fallback (was inline onerror) */
    grid.querySelectorAll('img[data-fallback]').forEach((img) => {
      img.onerror = () => { img.style.display = 'none'; const fb = img.nextElementSibling; if (fb) fb.style.display = 'block'; };
    });
  }
}