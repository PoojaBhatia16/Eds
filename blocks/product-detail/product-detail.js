/*
 * blocks/product-detail/product-detail.js — dynamic product detail page
 * Reads ?id= from URL, loads products.json, renders gallery + info + similar.
 * Ported from product.js. CSP-clean (no inline handlers), no GSAP.
 * Author empty block on the `product` doc:  | Product Detail |
 */

import { getCart, saveCart } from '../../scripts/cart.js';
import { loadProducts, getProductById, getRelatedProducts, resizeImg, isSold } from '../../scripts/products.js';
import { ensureAuth, getCurrentUser, getWishlist, saveWishlist } from '../../scripts/auth-guard.js';

const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN');

const SHELL = `
  <div class="container">
    <nav class="pp-breadcrumb" aria-label="Breadcrumb">
      <a href="/">Home</a><span>/</span>
      <a href="/browse">Browse Finds</a><span>/</span>
      <span id="ppBreadcrumbName" aria-current="page">Loading…</span>
    </nav>
    <div class="pp-layout">
      <div class="pp-gallery" id="ppGallery"><div class="pp-gallery-skeleton"></div></div>
      <div class="pp-info">
        <div class="pp-brand-row">
          <span class="pp-brand" id="ppBrand"></span>
          <button class="pp-wishlist-btn" id="wishlistBtn" aria-label="Add to wishlist">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        </div>
        <h1 class="pp-title" id="ppTitle">Loading…</h1>
        <div class="pp-pricing">
          <span class="pp-price" id="ppPrice"></span>
          <span class="pp-orig" id="ppOrig"></span>
          <span class="pp-saving" id="ppSaving"></span>
        </div>
        <hr class="pp-divider">
        <div class="pp-section">
          <div class="pp-section-header">
            <span class="pp-section-label">SIZE</span>
            <button class="pp-size-guide" id="sizeGuideBtn">SIZE GUIDE</button>
          </div>
          <div class="pp-size-chips" id="ppSizeChips"></div>
        </div>
        <div class="pp-section">
          <span class="pp-section-label">COLOUR</span>
          <div class="pp-colors" id="ppColors"></div>
        </div>
        <hr class="pp-divider">
        <div class="pp-actions">
          <button class="btn btn-primary pp-add-btn" id="addToCartBtn"><span class="btn-text">ADD TO BAG</span></button>
        </div>
        <div class="pp-trust">
          <div class="pp-trust-item"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg><span>Free delivery above ₹999</span></div>
          <div class="pp-trust-item"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg><span>7-day easy returns</span></div>
          <div class="pp-trust-item"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><span>Authenticity verified</span></div>
        </div>
        <hr class="pp-divider">
        <div class="pp-accordion">
          <div class="pp-acc-item">
            <button class="pp-acc-trigger" aria-expanded="true" aria-controls="accDetails"><span>Product Details and Overview</span><svg class="pp-acc-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></button>
            <div class="pp-acc-body" id="accDetails">
              <div class="pp-detail-grid">
                <span class="pp-detail-label">Material</span><span class="pp-detail-val" id="detailMaterial">—</span>
                <span class="pp-detail-label">Condition</span><span class="pp-detail-val" id="detailCondition">—</span>
                <span class="pp-detail-label">Colour</span><span class="pp-detail-val" id="detailColor">—</span>
                <span class="pp-detail-label">Style</span><span class="pp-detail-val" id="detailStyle">—</span>
              </div>
              <p class="pp-description" id="ppDescription"></p>
            </div>
          </div>
          <div class="pp-acc-item">
            <button class="pp-acc-trigger" aria-expanded="false" aria-controls="accDelivery"><span>Delivery &amp; Return</span><svg class="pp-acc-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></button>
            <div class="pp-acc-body" id="accDelivery" hidden><p class="pp-note">Orders dispatched within 1–2 business days. Delivered in 3–5 days across India. 7-day return window — items must be unworn and in original condition. Free returns on orders above ₹999.</p></div>
          </div>
          <div class="pp-acc-item">
            <button class="pp-acc-trigger" aria-expanded="false" aria-controls="accContact"><span>Contact Us</span><svg class="pp-acc-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></button>
            <div class="pp-acc-body" id="accContact" hidden><p class="pp-note">Questions about this piece, sizing, or your order? Visit our <a class="link-terra" href="/contact">Contact page</a> or email <a class="link-terra" href="mailto:hello@rewear.com">hello@rewear.com</a> — we usually reply within 1–2 business days.</p></div>
          </div>
        </div>
      </div>
    </div>
    <section class="pp-similar" id="ppSimilar">
      <h2 class="pp-similar-title">Similar Products</h2>
      <div class="pp-similar-grid" id="ppSimilarGrid"></div>
    </section>
  </div>
  <div class="pp-toast" id="cartToast"></div>
`;

export default async function decorate(block) {
  block.innerHTML = SHELL;
  const $ = (id) => block.querySelector('#' + id);
  const set = (id, txt) => { const el = $(id); if (el) el.textContent = txt; };

  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) return showError(block, 'No product specified.');

  const all = await loadProducts();
  const p = getProductById(all, id);
  if (!p) return showError(block, 'Product not found.');

  document.title = `${p.name} — RE:WEAR`;

  /* populate */
  set('ppBreadcrumbName', p.name);
  set('ppBrand', p.brand?.split('·')[0]?.trim() || p.brand || '');
  set('ppTitle', p.name);
  set('ppPrice', fmt(p.price));
  set('ppOrig', p.originalPrice ? fmt(p.originalPrice) : '');
  const saving = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
  set('ppSaving', saving > 0 ? `Save ${saving}%` : '');
  set('ppColors', p.colors?.join(' · ') || '—');
  set('detailMaterial', p.material || '—');
  set('detailCondition', p.condition || '—');
  set('detailColor', p.colors?.join(', ') || '—');
  set('detailStyle', p.style?.join(', ') || '—');
  set('ppDescription', p.description || '');

  /* gallery */
  const gallery = $('ppGallery');
  if (gallery && p.images?.length) {
    if (isSold(p.id)) gallery.classList.add('is-sold');
    const sold = isSold(p.id) ? '<div class="sold-overlay"><span>Sold Out</span></div>' : '';
    gallery.innerHTML = sold + p.images.map((src, i) =>
      `<img class="pp-gallery-img" src="${resizeImg(src, 800)}" alt="${p.name} — view ${i + 1}" loading="${i === 0 ? 'eager' : 'lazy'}" fetchpriority="${i === 0 ? 'high' : 'auto'}" decoding="async" data-full="${src}">`
    ).join('');
    gallery.querySelectorAll('.pp-gallery-img').forEach((img) => {
      img.addEventListener('click', () => openLightbox(img.dataset.full));
      img.onerror = () => { img.style.visibility = 'hidden'; };
    });
  }

  /* size chip (one-of-a-kind) */
  const size = p.size || (Array.isArray(p.sizes) ? p.sizes[0] : '') || '';
  if (size) $('ppSizeChips').innerHTML = `<span class="pp-size-chip selected" data-size="${size}">${size}</span>`;

  /* add to cart */
  initAddToCart(p);
  /* wishlist */
  initWishlist(p);
  /* similar */
  populateSimilar(all, p);
  /* accordion */
  block.querySelectorAll('.pp-acc-trigger').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const open = trigger.getAttribute('aria-expanded') === 'true';
      const body = $(trigger.getAttribute('aria-controls'));
      if (!body) return;
      body.hidden = open;
      trigger.setAttribute('aria-expanded', String(!open));
    });
  });
  /* size guide */
  $('sizeGuideBtn')?.addEventListener('click', openSizeGuide);

  /* ── functions ── */
  function initAddToCart(prod) {
    const btn = $('addToCartBtn');
    if (!btn) return;
    const user = getCurrentUser();
    const own = user && ((prod.sellerId && String(prod.sellerId) === String(user.id)) || (prod.sellerEmail && prod.sellerEmail.toLowerCase() === (user.email || '').toLowerCase()));
    if (own) { btn.innerHTML = '<span class="btn-text">This is your listing</span>'; btn.disabled = true; btn.classList.add('is-own-listing'); return; }
    if (isSold(prod.id)) { btn.innerHTML = '<span class="btn-text">SOLD OUT</span>'; btn.disabled = true; btn.classList.add('is-sold-out'); return; }

    btn.addEventListener('click', function handler() {
      if (!ensureAuth('Please log in to add items to your bag')) return;
      const selected = block.querySelector('.pp-size-chip.selected');
      if (!selected) { showToast('Please select a size first'); return; }
      btn.removeEventListener('click', handler);

      const cart = getCart();
      const existing = cart.find((i) => i.id === String(prod.id) && i.size === selected.dataset.size);
      if (existing) existing.qty = 1;
      else cart.push({ id: String(prod.id), name: prod.name, price: prod.price, size: selected.dataset.size, qty: 1, image: prod.images?.[0] || '' });
      saveCart(cart);
      showToast(`${prod.name} added to bag!`);

      btn.innerHTML = '<span class="btn-text">Go to Bag →</span>';
      btn.style.background = '#3B6D11';
      btn.style.borderColor = '#3B6D11';
      btn.addEventListener('click', () => { window.location.href = '/cart'; });

      if (!$('goToBagLabel')) {
        const label = document.createElement('a');
        label.id = 'goToBagLabel';
        label.href = '/cart';
        label.textContent = '← View your bag';
        label.className = 'pp-gotobag-label';
        btn.parentNode.insertBefore(label, btn.nextSibling);
      }
    });
  }

  function initWishlist(prod) {
    const btn = $('wishlistBtn');
    if (!btn) return;
    let wishlist = getWishlist();
    const pid = String(prod.id);
    if (wishlist.includes(pid)) btn.classList.add('active');
    btn.addEventListener('click', () => {
      if (!ensureAuth('Please log in to save items to your wishlist')) return;
      const active = btn.classList.toggle('active');
      wishlist = active ? [...wishlist, pid] : wishlist.filter((i) => i !== pid);
      saveWishlist(wishlist);
      showToast(active ? 'Added to wishlist ♥' : 'Removed from wishlist');
    });
  }

  function populateSimilar(allProducts, prod) {
    const grid = $('ppSimilarGrid');
    if (!grid) return;
    const related = getRelatedProducts(allProducts, prod, 4);
    if (!related.length) { $('ppSimilar')?.remove(); return; }
    grid.innerHTML = related.map((rp) => `
      <article class="product-card" data-id="${rp.id}">
        <div class="product-card-img">
          <img src="${resizeImg(rp.images?.[0] || '', 400)}" alt="${rp.name}" loading="lazy" decoding="async">
        </div>
        <div class="product-card-body">
          <p class="product-brand">${rp.brand?.split('·')[0]?.trim() || ''}</p>
          <p class="product-name">${rp.name}</p>
          <div class="product-pricing">
            <span class="product-price">${fmt(rp.price)}</span>
            ${rp.originalPrice ? `<span class="product-orig">${fmt(rp.originalPrice)}</span>` : ''}
          </div>
        </div>
      </article>`).join('');
    grid.querySelectorAll('.product-card').forEach((card) => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => { window.location.href = `/product?id=${card.dataset.id}`; });
    });
  }

  function showToast(msg) {
    const toast = $('cartToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function openLightbox(src) {
    document.getElementById('ppLightbox')?.remove();
    const lb = document.createElement('div');
    lb.id = 'ppLightbox';
    lb.className = 'pp-lightbox';
    lb.innerHTML = `<img src="${src}" alt="">`;
    lb.addEventListener('click', () => lb.remove());
    document.body.appendChild(lb);
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { lb.remove(); document.removeEventListener('keydown', esc); } });
  }

  function openSizeGuide() {
    document.getElementById('ppSizeModal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'ppSizeModal';
    modal.className = 'pp-size-modal';
    modal.innerHTML = `
      <div class="pp-size-modal-card">
        <button class="pp-size-modal-close" aria-label="Close">×</button>
        <h3>Size Guide</h3>
        <table class="pp-size-table">
          <thead><tr><th>Size</th><th>Bust (in)</th><th>Waist (in)</th><th>Hip (in)</th></tr></thead>
          <tbody>
            <tr><td>XS</td><td>31–32</td><td>24–25</td><td>34–35</td></tr>
            <tr><td>S</td><td>33–34</td><td>26–27</td><td>36–37</td></tr>
            <tr><td>M</td><td>35–36</td><td>28–29</td><td>38–39</td></tr>
            <tr><td>L</td><td>37–39</td><td>30–32</td><td>40–42</td></tr>
            <tr><td>XL</td><td>40–42</td><td>33–35</td><td>43–45</td></tr>
          </tbody>
        </table>
        <p class="pp-note">Measurements are approximate. As these are pre-loved one-of-a-kind pieces, please check the listed size carefully.</p>
      </div>`;
    modal.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('.pp-size-modal-close')) modal.remove(); });
    document.body.appendChild(modal);
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', esc); } });
  }
}

function showError(block, msg) {
  block.innerHTML = `<div class="pp-error"><p>${msg}</p><a href="/" class="btn btn-primary">← Back to Home</a></div>`;
}