/*
 * blocks/wishlist/wishlist.js — wishlist page
 * Reads rewear_wishlist IDs → renders product cards with remove + add-to-bag.
 * Ported from wishlist.js. CSP-clean (event delegation), no GSAP.
 * Author empty block on `wishlist` doc:  | Wishlist |
 */

import { getCurrentUser, ensureAuth } from '../../scripts/auth-guard.js';
import { loadProducts, getProductById, isSold } from '../../scripts/products.js';
import { addItem, getCartCount } from '../../scripts/cart.js';

const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN');

function isOwnListing(p) {
  const u = getCurrentUser();
  return !!(u && ((p.sellerId && String(p.sellerId) === String(u.id)) || (p.sellerEmail && p.sellerEmail.toLowerCase() === (u.email || '').toLowerCase())));
}

function toast(msg) {
  let t = document.getElementById('wlToast');
  if (!t) { t = document.createElement('div'); t.id = 'wlToast'; t.className = 'wl-toast'; document.body.appendChild(t); }
  t.textContent = msg;
  void t.offsetWidth;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2600);
}

function updateCartBadge() {
  const badge = document.querySelector('.cart-badge');
  if (!badge) return;
  const count = getCartCount();
  badge.textContent = count || '';
  badge.style.display = count ? 'flex' : 'none';
}

export default async function decorate(block) {
  block.innerHTML = `
    <div class="container wishlist-page">
      <div class="page-header">
        <h1 class="page-title">Your Wishlist</h1>
        <span class="page-count" id="wishlistCount">—</span>
      </div>
      <div class="product-grid" id="wishlistGrid"></div>
      <div class="empty-state is-hidden" id="wishlistEmpty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        <p>Your wishlist is empty.</p>
        <a href="/browse" class="btn btn-primary mt-8">Browse Finds →</a>
      </div>
    </div>
  `;

  const grid = block.querySelector('#wishlistGrid');
  const empty = block.querySelector('#wishlistEmpty');
  const count = block.querySelector('#wishlistCount');

  const showEmpty = () => { grid.innerHTML = ''; empty.classList.remove('is-hidden'); count.textContent = '0 items'; };

  const ids = JSON.parse(localStorage.getItem('rewear_wishlist') || '[]');
  if (!ids.length) return showEmpty();

  const all = await loadProducts();
  let products = ids.map((id) => getProductById(all, id)).filter(Boolean);
  if (!products.length) return showEmpty();

  count.textContent = `${products.length} item${products.length !== 1 ? 's' : ''}`;

  grid.innerHTML = products.map((p) => {
    const own = isOwnListing(p);
    const sold = isSold(p.id);
    const label = own ? 'Your listing' : sold ? 'Sold Out' : 'Add to Bag';
    const cls = own ? ' is-own-listing' : sold ? ' is-sold-out' : '';
    return `
      <article class="product-card${sold ? ' is-sold' : ''}" data-id="${p.id}" role="link" aria-label="${p.name}">
        <div class="product-card-img">
          ${sold ? '<div class="sold-overlay"><span>Sold Out</span></div>' : ''}
          ${p.images?.[0] ? `<img src="${p.images[0]}" alt="${p.name}" loading="lazy" class="wl-img">` : '<div class="img-placeholder"></div>'}
          <button class="product-wishlist active" data-remove="${p.id}" aria-label="Remove from wishlist">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </button>
        </div>
        <div class="product-card-body">
          <p class="product-brand">${p.brand?.split('·')[0]?.trim() || ''}</p>
          <p class="product-name">${p.name}</p>
          <div class="product-pricing">
            <span class="product-price">${fmt(p.price)}</span>
            ${p.originalPrice ? `<span class="product-orig">${fmt(p.originalPrice)}</span>` : ''}
          </div>
          <button class="wl-add-cart${cls}" data-add="${p.id}" ${sold ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>
            <span>${label}</span>
          </button>
        </div>
      </article>`;
  }).join('');

  grid.querySelectorAll('.wl-img').forEach((img) => { img.onerror = () => { img.style.visibility = 'hidden'; }; });

  /* card click → product page (ignore button clicks) */
  grid.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    const card = e.target.closest('.product-card');
    if (card) window.location.href = `/product?id=${card.dataset.id}`;
  });

  /* remove from wishlist (delegation) */
  grid.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.remove;
      let wl = JSON.parse(localStorage.getItem('rewear_wishlist') || '[]');
      wl = wl.filter((i) => String(i) !== String(id));
      localStorage.setItem('rewear_wishlist', JSON.stringify(wl));
      const card = btn.closest('.product-card');
      card?.remove();
      const remaining = grid.querySelectorAll('.product-card').length;
      count.textContent = `${remaining} item${remaining !== 1 ? 's' : ''}`;
      if (!remaining) showEmpty();
    });
  });

  /* add to bag (delegation) */
  grid.querySelectorAll('[data-add]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (btn.disabled) return;
      if (!ensureAuth('Log in to add items to your bag')) return;
      const id = btn.dataset.add;
      const p = products.find((x) => String(x.id) === String(id));
      if (!p || isSold(id)) return;
      if (isOwnListing(p)) { toast("You can't add your own listing to the bag"); return; }
      const size = p.size || (Array.isArray(p.sizes) ? p.sizes[0] : '') || 'One Size';
      addItem(p, size, 1);
      updateCartBadge();
      btn.classList.add('added');
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg><span>Go to Bag</span>';
      btn.addEventListener('click', (ev) => { ev.stopPropagation(); window.location.href = '/cart'; });
    });
  });
}