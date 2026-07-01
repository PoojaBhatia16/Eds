/*
 * blocks/editorial-carousel/editorial-carousel.js
 *
 * Authored as a table:
 *   | Editorial Carousel |            <- block name
 *   | Women's Picks | women | /browse?gender=women |
 *                 label    gender   discover-more link
 *
 * EDS turns that into:
 *   <div class="editorial-carousel block">
 *     <div><div>Women's Picks</div><div>women</div><div>/browse?...</div></div>
 *   </div>
 *
 * decorate() reads those 3 cells, pulls matching products from products.json,
 * and builds the sliding carousel (ported from your renderEditorialCarousel).
 */

import { loadProducts, filterByGender, filterFeatured, resizeImg, isSold } from '../../scripts/products.js';

const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN');

function buildCarousel(container, products, label, browseUrl) {
  if (!products.length) return;

  let base = products.slice();
  while (base.length < 4) base = base.concat(products);
  const N = base.length;
  const CLONES = 2;
  const REAL_START = CLONES;

  const list = [...base.slice(-CLONES), ...base, ...base.slice(0, CLONES)];
  let active = REAL_START;
  let animating = false;

  const slide = (p) => `
    <article class="ec-slide">
      <div class="ec-img-wrap">
        ${isSold(p.id) ? '<div class="sold-overlay"><span>Sold Out</span></div>' : ''}
        <img src="${resizeImg(p.images?.[0] || '', 600)}" alt="${p.name}" decoding="async" loading="lazy">
        <div class="ec-overlay">
          <span class="ec-overlay-eyebrow">${(p.brand || '').split('·')[0].trim()}</span>
          <span class="ec-overlay-title">${p.name}</span>
          <span class="ec-overlay-price">${fmt(p.price)}</span>
        </div>
      </div>
    </article>`;

  container.innerHTML = `
    <div class="ec-section">
      <div class="ec-header">
        <div class="ec-left-meta">
          <span class="ec-label-vert">${label.toUpperCase()}</span>
          <div class="ec-dots">
            ${base.map((_, i) => `<button class="ec-dot${i === 0 ? ' active' : ''}" data-real="${i}"></button>`).join('')}
          </div>
        </div>
        <div class="ec-viewport">
          <div class="ec-track">${list.map(slide).join('')}</div>
          <button class="ec-arrow ec-prev" aria-label="Previous">‹</button>
          <button class="ec-arrow ec-next" aria-label="Next">›</button>
        </div>
      </div>
      <div class="ec-footer"><a href="${browseUrl}" class="ec-discover">DISCOVER MORE →</a></div>
    </div>`;

  const viewport = container.querySelector('.ec-viewport');
  const track = container.querySelector('.ec-track');
  const slides = [...container.querySelectorAll('.ec-slide')];
  const dots = [...container.querySelectorAll('.ec-dot')];

  base.forEach((p) => { const im = new Image(); im.src = resizeImg(p.images?.[0] || '', 600); });

  const realOf = (i) => (((i - REAL_START) % N) + N) % N;

  function sizeSlides() {
    const w = viewport.clientWidth;
    const sw = Math.round(w * (w < 700 ? 0.66 : 0.40));
    slides.forEach((s) => { s.style.width = sw + 'px'; });
  }

  function center(animate) {
    track.style.transition = animate ? 'transform .55s cubic-bezier(.22,1,.36,1)' : 'none';
    const el = slides[active];
    const x = viewport.clientWidth / 2 - (el.offsetLeft + el.offsetWidth / 2);
    track.style.transform = `translateX(${x}px)`;
    slides.forEach((s, i) => s.classList.toggle('is-active', i === active));
    dots.forEach((d, i) => d.classList.toggle('active', i === realOf(active)));
  }

  function settle() {
    if (active < REAL_START) { active += N; center(false); }
    else if (active >= REAL_START + N) { active -= N; center(false); }
    animating = false;
  }
  track.addEventListener('transitionend', (e) => { if (e.propertyName === 'transform') settle(); });

  function move(to) {
    if (animating) return;
    animating = true;
    active = to;
    center(true);
    setTimeout(() => { if (animating) settle(); }, 650);
  }

  container.querySelector('.ec-next').addEventListener('click', () => move(active + 1));
  container.querySelector('.ec-prev').addEventListener('click', () => move(active - 1));
  dots.forEach((d) => d.addEventListener('click', () => move(REAL_START + (+d.dataset.real))));
  slides.forEach((s, i) => s.addEventListener('click', () => {
    if (i === active) window.location.href = `product.html?id=${base[realOf(i)].id}`;
    else move(i);
  }));

  let sx = 0;
  viewport.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
  viewport.addEventListener('touchend', (e) => {
    const dx = sx - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 40) move(active + (dx > 0 ? 1 : -1));
  });

  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { sizeSlides(); center(false); }, 120); });

  sizeSlides();
  requestAnimationFrame(() => requestAnimationFrame(() => center(false)));
  window.addEventListener('load', () => { sizeSlides(); center(false); });
}

export default async function decorate(block) {
  // Read the 3 authored cells: label | gender | discover-more link
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const label = cells[0]?.textContent.trim() || 'Picks';
  const gender = (cells[1]?.textContent.trim() || 'all').toLowerCase();
  const browseUrl = cells[2]?.textContent.trim() || '/browse';

  block.textContent = ''; // clear the raw table

  const all = await loadProducts();

  // Same selection logic as your main.js: featured first, fall back if sparse.
  let picks = filterFeatured(filterByGender(all, gender)).slice(0, 5);
  if (picks.length < 3) {
    const fallback = filterByGender(all, gender);
    picks = fallback.slice(0, 8);
  }

  buildCarousel(block, picks, label, browseUrl);
}