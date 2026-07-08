/*
 * blocks/product-grid/product-grid.js — full browse (filter bar + grid)
 * Class names match browse.css exactly: browse-topbar-right, browse-count,
 * browse-clear-all, browse-active-filters, browse-main, browse-grid.
 */

import { loadProducts, filterBySize, filterByPrice, searchProducts, sortProducts, getCollectionTypes, isSold } from '../../scripts/products.js';

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
import { ensureAuth, getWishlist, saveWishlist } from '../../scripts/auth-guard.js';


const state = {
  all: [], gender: 'all', categories: [], sizes: [], condition: 'all',
  priceMin: 0, priceMax: Infinity, sort: 'default', search: '',
  styleFilter: '', brandFilter: '',
};

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

/* ── BANNER (merged from the old `banner` block) ──
   Renders the browse-page header (title + live item count). Previously a
   separate `banner` block; now built here since banner only ever appeared
   on /browse alongside this grid. Author these in the Product Grid config:
     | Banner Title | All Finds |
     | Banner Label | Curated pieces |
     | Show Count   | true |
   The last word of the title becomes the orange <em> accent. The count is
   filled live below via #bannerCount. */
function buildBannerHTML(cfg) {
  const title = cfg['banner title'] || 'All Finds';
  const label = cfg['banner label'] || 'Curated pieces';
  const showCount = String(cfg['show count'] ?? 'true').toLowerCase() === 'true';
  const parts = title.split(' ');
  const last = parts.pop();
  const head = parts.join(' ');
  return `
  <div class="browse-banner">
    <div class="container">
      <div class="browse-banner-inner">
        <h1 class="browse-banner-title">${head} <em>${last}</em></h1>
        ${showCount ? `
        <div class="browse-banner-meta">
          <span class="browse-banner-count" id="bannerCount">—</span>
          <span class="browse-banner-label">${label}</span>
        </div>` : ''}
      </div>
    </div>
  </div>`;
}

function buildFilterbarHTML() {
  return `
  <div class="browse-filterbar">
    <div class="browse-filterbar-inner">
      <button class="browse-clear-all" id="clearFilters">Clear all</button>

      <div class="filter-dropdown-wrap">
        <button class="filter-dropdown-btn" data-panel="genderPanel" id="genderBtn">Gender
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="filter-dropdown-panel" id="genderPanel">
          <div class="panel-pills">
            <button class="panel-pill active" data-filter="gender" data-value="all">All</button>
            <button class="panel-pill" data-filter="gender" data-value="women">Women</button>
            <button class="panel-pill" data-filter="gender" data-value="men">Men</button>
            <button class="panel-pill" data-filter="gender" data-value="kids">Kids</button>
            <button class="panel-pill" data-filter="gender" data-value="unisex">Unisex</button>
          </div>
        </div>
      </div>

      <div class="filter-dropdown-wrap">
        <button class="filter-dropdown-btn" data-panel="categoryPanel" id="categoryBtn">Category
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="filter-dropdown-panel" id="categoryPanel">
          <div class="panel-checks" id="categoryFilters"></div>
          <button class="panel-done-btn" data-done="categoryPanel">Done</button>
        </div>
      </div>

      <div class="filter-dropdown-wrap">
        <button class="filter-dropdown-btn" data-panel="sizePanel" id="sizeBtn">Size
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="filter-dropdown-panel" id="sizePanel">
          <div class="panel-pills">
            ${SIZES.map((s) => `<button class="panel-pill size-pill" data-size="${s}">${s}</button>`).join('')}
          </div>
          <button class="panel-done-btn" data-done="sizePanel">Done</button>
        </div>
      </div>

      <div class="filter-dropdown-wrap">
        <button class="filter-dropdown-btn" data-panel="pricePanel" id="priceBtn">Price
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="filter-dropdown-panel" id="pricePanel">
          <div class="panel-price">
            <input type="number" id="priceMin" placeholder="₹ Min">
            <span>—</span>
            <input type="number" id="priceMax" placeholder="₹ Max">
          </div>
        </div>
      </div>

      <div class="filter-dropdown-wrap">
        <button class="filter-dropdown-btn" data-panel="conditionPanel" id="conditionBtn">Condition
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="filter-dropdown-panel" id="conditionPanel">
          <div class="panel-pills">
            <button class="panel-pill active" data-filter="condition" data-value="all">All</button>
            <button class="panel-pill" data-filter="condition" data-value="Excellent">Excellent</button>
            <button class="panel-pill" data-filter="condition" data-value="Good">Good</button>
            <button class="panel-pill" data-filter="condition" data-value="Fair">Fair</button>
          </div>
        </div>
      </div>

      <div class="browse-topbar-right">
        <span class="browse-count" id="browseCount">—</span>
        <div class="browse-sort" id="browseSort">
          <button class="browse-sort-trigger" id="sortTrigger" aria-expanded="false">
            <span id="sortLabel">Sort: Recommended</span>
            <svg class="browse-sort-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="browse-sort-menu" id="sortMenu" hidden>
            <button class="browse-sort-option is-selected" data-value="default">Recommended</button>
            <button class="browse-sort-option" data-value="price-asc">Price: Low to High</button>
            <button class="browse-sort-option" data-value="price-desc">Price: High to Low</button>
            <button class="browse-sort-option" data-value="saving">Biggest Saving</button>
          </div>
        </div>
      </div>
    </div>
    <div class="browse-active-filters" id="activeFilters"></div>
  </div>

  <div class="browse-main container">
    <div class="browse-grid" id="browseGrid"></div>
    <div class="browse-empty" id="browseEmpty" hidden>
      <p id="browseEmptyMsg">No items match your filters</p>
    </div>
  </div>`;
}

export default async function decorate(block) {
  const DEFAULTS = {
    'data source': '/data/products.json',
    'product path': '/product',
    'empty message': 'No items match your filters',
    'banner title': 'All Finds',
    'banner label': 'Curated pieces',
    'show count': 'true',
  };
  const cfg = { ...DEFAULTS };
  block.querySelectorAll(':scope > div').forEach((row) => {
    const cells = row.querySelectorAll(':scope > div');
    if (cells.length >= 2) cfg[cells[0].textContent.trim().toLowerCase()] = cells[1].textContent.trim();
  });
  const emptyMsg = cfg['empty message'];

  block.innerHTML = buildBannerHTML(cfg) + buildFilterbarHTML();
  const $ = (sel) => block.querySelector(sel);
  const $$ = (sel) => [...block.querySelectorAll(sel)];
  $('#browseEmptyMsg').textContent = emptyMsg;

  const params = new URLSearchParams(window.location.search);
  if (params.get('gender')) state.gender = params.get('gender');
  if (params.get('search')) state.search = params.get('search');
  if (params.get('category')) state.categories = [params.get('category')];
  if (params.get('maxPrice')) state.priceMax = Number(params.get('maxPrice'));
  if (params.get('brand')) state.brandFilter = params.get('brand');
  if (params.get('style')) state.styleFilter = params.get('style');
  if (params.get('collection_type')) state.categories = [params.get('collection_type')];

  state.all = await loadProducts(cfg['data source']);
  if (!state.all.length) {
    $('#browseGrid').innerHTML = '<p style="padding:40px;color:var(--text-muted)">Could not load products.</p>';
    return;
  }

  buildCategoryFilters(state.all);
  syncGenderPills();
  wireFilters();
  render();

  function render() {
    let products = [...state.all];
    if (state.gender !== 'all') products = products.filter((p) => p.gender === state.gender || p.gender === 'unisex');
    if (state.categories.length) products = products.filter((p) => state.categories.includes(p.collection_type));
    if (state.brandFilter) products = products.filter((p) => (p.brand || '').toLowerCase() === state.brandFilter.toLowerCase());
    if (state.styleFilter) {
      const kw = state.styleFilter.toLowerCase();
      products = products.filter((p) => {
        const hay = [p.collection_type, p.category, ...(p.style || []), p.name, p.description].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(kw);
      });
    }
    if (state.sizes.length) products = filterBySize(products, state.sizes);
    if (state.condition !== 'all') products = products.filter((p) => (p.condition || '').toLowerCase().includes(state.condition.toLowerCase()));
    products = filterByPrice(products, state.priceMin, state.priceMax);
    if (state.search) products = searchProducts(products, state.search);
    products = sortProducts(products, state.sort);

    $('#browseCount').textContent = `${products.length} item${products.length !== 1 ? 's' : ''}`;
    const bc = document.getElementById('bannerCount');
    if (bc) bc.textContent = products.length;

    updateFilterBtnBadges();
    renderActiveTags();
    updateClearBtn();

    const grid = $('#browseGrid');
    const empty = $('#browseEmpty');
    if (!products.length) { grid.innerHTML = ''; empty.hidden = false; return; }
    empty.hidden = true;

    grid.innerHTML = products.map((p, i) => {
      const saving = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
      const sold = isSold(p.id);
      const sz = p.size || (Array.isArray(p.sizes) ? p.sizes[0] : '') || '';
      /* First row of cards is above the fold — the very first is usually the
         LCP element. Lazy-loading it forces the browser to delay the fetch
         until layout confirms it's near-viewport, hurting LCP. Eager-load
         the first few cards; lazy-load the rest below the fold. */
      const eager = i < 4;
      const imgAttrs = eager
        ? `loading="eager"${i === 0 ? ' fetchpriority="high"' : ''}`
        : 'loading="lazy"';
      return `
        <article class="product-card${sold ? ' is-sold' : ''}" data-id="${p.id}" role="link" aria-label="${p.name}">
          <div class="product-card-img">
            ${sold ? '<div class="sold-overlay"><span>Sold Out</span></div>' : ''}
            ${p.images?.[0] ? `<img src="${p.images[0]}" alt="${p.name}" width="600" height="800" ${imgAttrs}>` : '<div class="img-placeholder"></div>'}
            <button class="product-wishlist" data-id="${p.id}" aria-label="Wishlist">♡</button>
          </div>
          <div class="product-card-body">
            <p class="product-brand">${p.brand?.split('·')[0]?.trim() || ''}</p>
            <p class="product-name">${p.name}</p>
            <div class="product-pricing">
              <span class="product-price">${fmt(p.price)}</span>
              ${p.originalPrice ? `<span class="product-orig">${fmt(p.originalPrice)}</span>` : ''}
              ${saving > 0 ? `<span class="product-saving">-${saving}%</span>` : ''}
            </div>
            <div class="product-card-foot">
              ${sz ? `<span class="product-size-pip">${sz}</span>` : ''}
              ${p.condition ? `<span class="product-condition-badge">${p.condition}</span>` : ''}
            </div>
          </div>
        </article>`;
    }).join('');

    grid.querySelectorAll('img').forEach((img) => { img.onerror = () => { img.style.display = 'none'; }; });
    initWishlist();
  }

  $('#browseGrid').addEventListener('click', (e) => {
    if (e.target.closest('.product-wishlist')) return;
    const card = e.target.closest('.product-card');
    if (card) window.location.href = `${cfg['product path']}?id=${card.dataset.id}`;
  });

  function wireFilters() {
    $$('.filter-dropdown-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const panel = $(`#${btn.dataset.panel}`);
        const isOpen = panel.classList.contains('open');
        closeAllPanels();
        if (!isOpen) { panel.classList.add('open'); btn.classList.add('open'); }
      });
    });
    $$('.filter-dropdown-panel').forEach((p) => p.addEventListener('click', (e) => e.stopPropagation()));
    document.addEventListener('click', (e) => { if (!e.target.closest('.filter-dropdown-wrap')) closeAllPanels(); });

    $$('[data-done]').forEach((b) => b.addEventListener('click', () => {
      $(`#${b.dataset.done}`).classList.remove('open');
      $(`#${b.dataset.done.replace('Panel', 'Btn')}`)?.classList.remove('open');
    }));

    $$('[data-filter="gender"]').forEach((btn) => btn.addEventListener('click', () => {
      state.gender = btn.dataset.value; syncGenderPills(); render(); closeAllPanels();
    }));
    $$('[data-filter="condition"]').forEach((btn) => btn.addEventListener('click', () => {
      state.condition = btn.dataset.value;
      $$('[data-filter="condition"]').forEach((b) => b.classList.toggle('active', b === btn));
      render(); closeAllPanels();
    }));
    $$('.size-pill').forEach((btn) => btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      const size = btn.dataset.size;
      state.sizes = btn.classList.contains('active') ? [...state.sizes, size] : state.sizes.filter((s) => s !== size);
      render();
    }));

    const sortWrap = $('#browseSort');
    const sortTrigger = $('#sortTrigger');
    const sortMenu = $('#sortMenu');
    const sortLabel = $('#sortLabel');
    sortTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = sortMenu.hidden;
      sortMenu.hidden = !willOpen;
      sortTrigger.setAttribute('aria-expanded', String(willOpen));
    });
    $$('.browse-sort-option').forEach((opt) => opt.addEventListener('click', () => {
      state.sort = opt.dataset.value;
      sortLabel.textContent = 'Sort: ' + opt.textContent;
      $$('.browse-sort-option').forEach((o) => o.classList.toggle('is-selected', o === opt));
      sortMenu.hidden = true; render();
    }));
    document.addEventListener('click', (e) => { if (!sortWrap.contains(e.target)) sortMenu.hidden = true; });

    let pt;
    const onPrice = () => { clearTimeout(pt); pt = setTimeout(() => { state.priceMin = Number($('#priceMin').value) || 0; state.priceMax = Number($('#priceMax').value) || Infinity; render(); }, 500); };
    $('#priceMin').addEventListener('input', onPrice);
    $('#priceMax').addEventListener('input', onPrice);

    $('#clearFilters').addEventListener('click', resetFilters);
  }

  function closeAllPanels() {
    $$('.filter-dropdown-panel').forEach((p) => p.classList.remove('open'));
    $$('.filter-dropdown-btn').forEach((b) => b.classList.remove('open'));
  }

  function resetFilters() {
    Object.assign(state, { gender: 'all', categories: [], sizes: [], condition: 'all', priceMin: 0, priceMax: Infinity, sort: 'default' });
    syncGenderPills();
    $$('[data-filter="condition"]').forEach((b) => b.classList.toggle('active', b.dataset.value === 'all'));
    $$('.size-pill').forEach((b) => b.classList.remove('active'));
    $$('.panel-check-item input').forEach((cb) => { cb.checked = false; });
    $('#priceMin').value = ''; $('#priceMax').value = '';
    $('#sortLabel').textContent = 'Sort: Recommended';
    render();
  }

  function buildCategoryFilters(products) {
    const types = getCollectionTypes(products);
    const wrap = $('#categoryFilters');
    wrap.innerHTML = types.map((type) => `
      <label class="panel-check-item">
        <input type="checkbox" data-category="${type}" ${state.categories.includes(type) ? 'checked' : ''}>
        <span class="panel-check-box"></span>
        <span>${type.charAt(0).toUpperCase() + type.slice(1)}</span>
      </label>`).join('');
    wrap.querySelectorAll('input[data-category]').forEach((cb) => cb.addEventListener('change', () => {
      const cat = cb.dataset.category;
      state.categories = cb.checked ? [...state.categories, cat] : state.categories.filter((c) => c !== cat);
      render();
    }));
  }

  function renderActiveTags() {
    const wrap = $('#activeFilters');
    const tags = [];
    if (state.gender !== 'all') tags.push({ label: state.gender, clear: () => { state.gender = 'all'; syncGenderPills(); } });
    state.categories.forEach((cat) => tags.push({ label: cat, clear: () => {
      state.categories = state.categories.filter((c) => c !== cat);
      const cb = $(`input[data-category="${cat}"]`); if (cb) cb.checked = false;
    } }));
    state.sizes.forEach((s) => tags.push({ label: `Size ${s}`, clear: () => {
      state.sizes = state.sizes.filter((x) => x !== s);
      $(`.size-pill[data-size="${s}"]`)?.classList.remove('active');
    } }));
    if (state.condition !== 'all') tags.push({ label: state.condition, clear: () => {
      state.condition = 'all';
      $$('[data-filter="condition"]').forEach((b) => b.classList.toggle('active', b.dataset.value === 'all'));
    } });
    if (state.priceMin > 0 || state.priceMax < Infinity) tags.push({
      label: `₹${state.priceMin}${state.priceMax < Infinity ? `–₹${state.priceMax}` : '+'}`,
      clear: () => { state.priceMin = 0; state.priceMax = Infinity; $('#priceMin').value = ''; $('#priceMax').value = ''; },
    });
    wrap.innerHTML = tags.map((tag, i) => `<span class="active-filter-tag">${tag.label}<button data-tag="${i}">×</button></span>`).join('');
    wrap.querySelectorAll('[data-tag]').forEach((btn) => btn.addEventListener('click', () => { tags[Number(btn.dataset.tag)].clear(); render(); }));
  }

  function updateFilterBtnBadges() {
    const counts = { genderBtn: state.gender !== 'all' ? 1 : 0, categoryBtn: state.categories.length, sizeBtn: state.sizes.length, priceBtn: (state.priceMin > 0 || state.priceMax < Infinity) ? 1 : 0, conditionBtn: state.condition !== 'all' ? 1 : 0 };
    Object.entries(counts).forEach(([id, count]) => {
      const btn = $(`#${id}`); if (!btn) return;
      btn.querySelector('.filter-count-badge')?.remove();
      if (count > 0) { const badge = document.createElement('span'); badge.className = 'filter-count-badge'; badge.textContent = count; btn.insertBefore(badge, btn.querySelector('svg')); }
      btn.classList.toggle('active', count > 0);
    });
  }

  function updateClearBtn() {
    const has = state.gender !== 'all' || state.categories.length || state.sizes.length || state.condition !== 'all' || state.priceMin > 0 || state.priceMax < Infinity;
    $('#clearFilters').classList.toggle('visible', has);
  }

  function syncGenderPills() {
    $$('[data-filter="gender"]').forEach((btn) => btn.classList.toggle('active', btn.dataset.value === state.gender));
  }

  function initWishlist() {
    let wishlist = getWishlist();
    $$('.product-wishlist').forEach((btn) => {
      const id = String(btn.dataset.id);
      if (wishlist.includes(id)) { btn.classList.add('active'); btn.textContent = '♥'; }
      btn.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        if (!ensureAuth('Please log in to save to wishlist')) return;
        const on = btn.classList.toggle('active');
        btn.textContent = on ? '♥' : '♡';
        wishlist = on ? [...wishlist, id] : wishlist.filter((i) => i !== id);
        saveWishlist(wishlist);
      });
    });
  }
}