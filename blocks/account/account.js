/*
 * blocks/account/account.js
 *
 * ONE reusable block for the logged-in account area. Replaces the former
 * `profile` and `orders` blocks, which shared an identical sidebar (avatar,
 * stats, nav) and layout — only the right-hand content differed.
 *
 * Variation comes from the block name:
 *   | Account (profile) |   → account details + seller upgrade + saved preview
 *   | Account (orders)  |   → order history list
 * EDS turns "Account (orders)" into class="account orders", so we read the
 * variation from classList. Defaults to the profile view.
 *
 * All the config keys from both old blocks are supported (see DEFAULTS).
 */

import { requireAuth, getCurrentUser, logout, upgradeToSeller, getWishlist, ensureAuth, saveWishlist } from '../../scripts/auth-guard.js';
import { loadProducts, getProductById, isSold } from '../../scripts/products.js';
import { getCart, addItem, getCartCount } from '../../scripts/cart.js';

/* local money formatter (self-contained — no dependency on a shared export) */
const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const DEFAULTS = {
  'login path': '/login',
  'profile path': '/profile',
  'orders path': '/orders',
  'wishlist path': '/wishlist',
  'cart path': '/cart',
  'sell path': '/sell',
  'browse path': '/browse',
  'product path': '/product',
  // profile view
  'account title': 'Account Details',
  'saved title': 'Saved Items',
  'upgrade title': 'Start Selling on RE:WEAR',
  'upgrade text': 'List your pre-loved pieces and earn money while decluttering your wardrobe.',
  'upgrade cta': 'Become a Seller',
  // orders view
  'empty title': 'No orders yet',
  'empty text': "When you place an order, it'll show up here.",
  'empty cta text': 'Start Shopping',
  // wishlist view
  'wishlist title': 'My Wishlist',
  'wishlist empty text': 'Your wishlist is empty.',
  'wishlist empty cta': 'Browse Finds →',
  'add cta': 'Add to Bag',
  'sold label': 'Sold Out',
  'own label': 'Your listing',
  'login prompt': 'Log in to add items to your bag',
};

function readConfig(block) {
  const cfg = { ...DEFAULTS };
  block.querySelectorAll(':scope > div').forEach((row) => {
    const cells = row.querySelectorAll(':scope > div');
    if (cells.length >= 2) {
      const key = cells[0].textContent.trim().toLowerCase();
      const val = cells[1].textContent.trim();
      if (key) cfg[key] = val;
    }
  });
  return cfg;
}

/* ── SHARED SIDEBAR ──
   `activeNav` is 'profile' or 'orders' — controls which nav item is highlighted. */
function buildSidebar(cfg, user, counts, activeNav) {
  const initials = [user.firstName, user.lastName].filter(Boolean).map((n) => n[0].toUpperCase()).join('')
    || user.name?.[0]?.toUpperCase() || '?';
  const role = user.role || 'buyer';
  const isSeller = role === 'seller' || role === 'admin';
  const act = (which) => (which === activeNav ? ' active' : '');

  return `
    <aside class="profile-sidebar">
      <div class="profile-avatar"><span>${esc(initials)}</span></div>
      <h2 class="profile-name">${esc(user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim())}</h2>
      <p class="profile-email">${esc(user.email)}</p>
      <span class="profile-role-badge role-${role}">${esc(role)}</span>
      <div class="profile-stats">
        <div class="profile-stat"><span class="profile-stat-num">${counts.wishlist}</span><span class="profile-stat-label">Saved</span></div>
        <div class="profile-stat"><span class="profile-stat-num">${counts.cart}</span><span class="profile-stat-label">In Bag</span></div>
        <div class="profile-stat"><span class="profile-stat-num">${counts.orders}</span><span class="profile-stat-label">Orders</span></div>
      </div>
      <nav class="profile-nav">
        <a href="${cfg['profile path']}" class="profile-nav-item${act('profile')}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>My Profile</a>
        <a href="${cfg['orders path']}" class="profile-nav-item${act('orders')}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>Orders</a>
        <a href="${cfg['wishlist path']}" class="profile-nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>Wishlist</a>
        <a href="${cfg['cart path']}" class="profile-nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>My Bag</a>
        ${isSeller ? `<a href="${cfg['sell path']}" class="profile-nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>Sell Items</a>` : ''}
        <button class="profile-nav-item profile-logout-btn" id="accountLogout"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Sign Out</button>
      </nav>
    </aside>`;
}

/* ── PROFILE VIEW (right side) ── */
function buildProfileMain(cfg, user) {
  const isSeller = user.role === 'seller' || user.role === 'admin';
  return `
    <div class="profile-main">
      <section class="profile-section">
        <div class="profile-section-header"><h3 class="profile-section-title">${esc(cfg['account title'])}</h3></div>
        <div class="profile-info-grid">
          <div class="profile-info-item"><span class="profile-info-label">Full Name</span><span class="profile-info-val">${esc(user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim())}</span></div>
          <div class="profile-info-item"><span class="profile-info-label">Email</span><span class="profile-info-val">${esc(user.email)}</span></div>
          <div class="profile-info-item"><span class="profile-info-label">Account Type</span><span class="profile-info-val">${esc(cap(user.role || 'buyer'))}</span></div>
          <div class="profile-info-item"><span class="profile-info-label">Member Since</span><span class="profile-info-val">${user.joinedAt ? esc(new Date(user.joinedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })) : '—'}</span></div>
        </div>
      </section>

      ${isSeller ? '' : `
      <section class="profile-section" id="upgradeSection">
        <div class="upgrade-card">
          <div class="upgrade-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg></div>
          <div class="upgrade-text">
            <h4>${esc(cfg['upgrade title'])}</h4>
            <p>${esc(cfg['upgrade text'])}</p>
          </div>
          <button class="btn btn-primary upgrade-btn" id="upgradeBtn">${esc(cfg['upgrade cta'])}</button>
        </div>
      </section>`}

      <section class="profile-section">
        <div class="profile-section-header">
          <h3 class="profile-section-title">${esc(cfg['saved title'])}</h3>
          <a href="${cfg['wishlist path']}" class="see-more">See all</a>
        </div>
        <div class="profile-mini-grid" id="profileWishlistGrid">
          <p class="muted-note" id="wishlistPreviewEmpty">No saved items yet.</p>
        </div>
      </section>
    </div>`;
}

/* ── ORDERS VIEW (right side) ── */
function buildOrdersMain() {
  return `
    <div class="profile-main">
      <div class="profile-section">
        <div class="profile-section-header"><h3 class="profile-section-title">My Orders</h3></div>
        <div id="ordersContainer"></div>
      </div>
    </div>`;
}

function renderOrdersList(box, myOrders, cfg) {
  if (!myOrders.length) {
    box.innerHTML = `
      <div class="orders-empty">
        <span class="orders-empty-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg></span>
        <h4>${esc(cfg['empty title'])}</h4>
        <p>${esc(cfg['empty text'])}</p>
        <a href="${cfg['browse path']}" class="btn btn-primary">${esc(cfg['empty cta text'])}</a>
      </div>`;
    return;
  }

  box.innerHTML = `<div class="orders-list">${myOrders.map((o) => {
    const date = new Date(o.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const count = o.items.reduce((s, i) => s + (i.qty || 1), 0);
    const addr = o.address || {};
    return `
      <article class="order-card">
        <div class="order-card-head">
          <div>
            <span class="order-id">Order ${esc(o.id)}</span>
            <span class="order-date">${date} · ${count} item${count !== 1 ? 's' : ''}</span>
          </div>
          <span class="order-status order-status--${(o.status || 'processing').toLowerCase()}">${esc(o.status || 'Processing')}</span>
        </div>
        <div class="order-items">
          ${o.items.map((i) => {
            const link = i.id ? ` href="${cfg['product path']}?id=${encodeURIComponent(i.id)}"` : '';
            const tag = i.id ? 'a' : 'div';
            return `<${tag} class="order-item${i.id ? ' is-link' : ''}"${link}>
              <div class="order-item-img">${i.image ? `<img src="${esc(i.image)}" alt="${esc(i.name)}">` : ''}</div>
              <div class="order-item-info">
                <p class="order-item-name">${esc(i.name)}</p>
                <p class="order-item-meta">${i.brand ? esc(i.brand) + ' · ' : ''}Size ${esc(i.size || '—')} · Qty ${i.qty || 1}</p>
              </div>
              <span class="order-item-price">${fmt(i.price * (i.qty || 1))}</span>
              ${i.id ? '<svg class="order-item-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>' : ''}
            </${tag}>`;
          }).join('')}
        </div>
        <div class="order-card-foot">
          <div class="order-ship">
            <span class="order-ship-label">Delivered to</span>
            <span class="order-ship-val">${esc(addr.firstName || '')} ${esc(addr.lastName || '')}${addr.city ? ', ' + esc(addr.city) : ''}</span>
          </div>
          <div class="order-total">
            <span class="order-total-label">Total</span>
            <span class="order-total-val">${fmt(o.total)}</span>
          </div>
        </div>
      </article>`;
  }).join('')}</div>`;
}

/* ── WISHLIST VIEW ──
   Kept as its own full-width layout (page-header + product grid), matching the
   former standalone wishlist block — no account sidebar, so it looks identical
   to before. */
function isOwnListing(p) {
  const u = getCurrentUser();
  return !!(u && ((p.sellerId && String(p.sellerId) === String(u.id)) || (p.sellerEmail && p.sellerEmail.toLowerCase() === (u.email || '').toLowerCase())));
}

function wlToast(msg) {
  let t = document.getElementById('wlToast');
  if (!t) { t = document.createElement('div'); t.id = 'wlToast'; t.className = 'wl-toast'; document.body.appendChild(t); }
  t.textContent = msg;
  void t.offsetWidth;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2600);
}

function wlUpdateCartBadge() {
  const badge = document.querySelector('.cart-badge');
  if (!badge) return;
  const count = getCartCount();
  badge.textContent = count || '';
  badge.style.display = count ? 'flex' : 'none';
}

async function renderWishlist(block, cfg) {
  block.innerHTML = `
    <div class="container wishlist-page">
      <div class="page-header">
        <h1 class="page-title">${esc(cfg['wishlist title'] || cfg['title'])}</h1>
        <span class="page-count" id="wishlistCount">—</span>
      </div>
      <div class="product-grid" id="wishlistGrid"></div>
      <div class="empty-state is-hidden" id="wishlistEmpty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        <p>${esc(cfg['wishlist empty text'])}</p>
        <a href="${cfg['browse path']}" class="btn btn-primary mt-8">${esc(cfg['wishlist empty cta'])}</a>
      </div>
    </div>
  `;

  const grid = block.querySelector('#wishlistGrid');
  const empty = block.querySelector('#wishlistEmpty');
  const count = block.querySelector('#wishlistCount');
  const showEmpty = () => { grid.innerHTML = ''; empty.classList.remove('is-hidden'); count.textContent = '0 items'; };

  const ids = getWishlist();
  if (!ids.length) return showEmpty();

  const all = await loadProducts();
  const products = ids.map((id) => getProductById(all, id)).filter(Boolean);
  if (!products.length) return showEmpty();

  count.textContent = `${products.length} item${products.length !== 1 ? 's' : ''}`;

  grid.innerHTML = products.map((p) => {
    const own = isOwnListing(p);
    const sold = isSold(p.id);
    const label = own ? cfg['own label'] : sold ? cfg['sold label'] : cfg['add cta'];
    const cls = own ? ' is-own-listing' : sold ? ' is-sold-out' : '';
    return `
      <article class="product-card${sold ? ' is-sold' : ''}" data-id="${p.id}" role="link" aria-label="${esc(p.name)}">
        <div class="product-card-img">
          ${sold ? `<div class="sold-overlay"><span>${esc(cfg['sold label'])}</span></div>` : ''}
          ${p.images?.[0] ? `<img src="${p.images[0]}" alt="${esc(p.name)}" loading="lazy" class="wl-img">` : '<div class="img-placeholder"></div>'}
          <button class="product-wishlist active" data-remove="${p.id}" aria-label="Remove from wishlist">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </button>
        </div>
        <div class="product-card-body">
          <p class="product-brand">${esc(p.brand?.split('·')[0]?.trim() || '')}</p>
          <p class="product-name">${esc(p.name)}</p>
          <div class="product-pricing">
            <span class="product-price">${fmt(p.price)}</span>
            ${p.originalPrice ? `<span class="product-orig">${fmt(p.originalPrice)}</span>` : ''}
          </div>
          <button class="wl-add-cart${cls}" data-add="${p.id}" ${sold ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>
            <span>${esc(label)}</span>
          </button>
        </div>
      </article>`;
  }).join('');

  grid.querySelectorAll('.wl-img').forEach((img) => { img.onerror = () => { img.style.visibility = 'hidden'; }; });

  grid.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    const card = e.target.closest('.product-card');
    if (card) window.location.href = `${cfg['product path']}?id=${card.dataset.id}`;
  });

  grid.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.remove;
      let wl = getWishlist();
      wl = wl.filter((i) => String(i) !== String(id));
      saveWishlist(wl);
      btn.closest('.product-card')?.remove();
      const remaining = grid.querySelectorAll('.product-card').length;
      count.textContent = `${remaining} item${remaining !== 1 ? 's' : ''}`;
      if (!remaining) showEmpty();
    });
  });

  grid.querySelectorAll('[data-add]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (btn.disabled) return;
      if (!ensureAuth(cfg['login prompt'])) return;
      const id = btn.dataset.add;
      const p = products.find((x) => String(x.id) === String(id));
      if (!p || isSold(id)) return;
      if (isOwnListing(p)) { wlToast("You can't add your own listing to the bag"); return; }
      const size = p.size || (Array.isArray(p.sizes) ? p.sizes[0] : '') || 'One Size';
      addItem(p, size, 1);
      wlUpdateCartBadge();
      btn.classList.add('added');
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg><span>Go to Bag</span>';
      btn.addEventListener('click', (ev) => { ev.stopPropagation(); window.location.href = cfg['cart path']; });
    });
  });
}

export default async function decorate(block) {
  const cfg = readConfig(block);
  if (!requireAuth(cfg['login path'])) return;
  const user = getCurrentUser();
  if (!user) return;

  /* wishlist variation: own full-width layout (no account sidebar) */
  if (block.classList.contains('wishlist')) {
    await renderWishlist(block, cfg);
    return;
  }

  const isOrders = block.classList.contains('orders');

  /* gather counts (shared by both views) */
  const wishlist = getWishlist();
  const cart = getCart();
  let orders = [];
  try { orders = JSON.parse(localStorage.getItem('rewear_orders') || '[]'); } catch { orders = []; }
  const myOrders = orders
    .filter((o) => o.userId === user.id || o.userEmail === user.email)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const counts = {
    wishlist: wishlist.length,
    cart: cart.reduce((s, i) => s + (i.qty || 1), 0),
    orders: myOrders.length,
  };

  const sidebar = buildSidebar(cfg, user, counts, isOrders ? 'orders' : 'profile');
  const main = isOrders ? buildOrdersMain() : buildProfileMain(cfg, user);
  block.innerHTML = `
    <div class="container profile-page">
      <div class="profile-layout">
        ${sidebar}
        ${main}
      </div>
    </div>`;

  /* logout (shared) */
  block.querySelector('#accountLogout')?.addEventListener('click', () => { if (confirm('Sign out of RE:WEAR?')) logout(); });

  if (isOrders) {
    renderOrdersList(block.querySelector('#ordersContainer'), myOrders, cfg);
    return;
  }

  /* ── profile-only wiring ── */
  block.querySelector('#upgradeBtn')?.addEventListener('click', () => {
    if (confirm('Become a seller on RE:WEAR? You can start listing items right away.')) {
      upgradeToSeller();
      location.reload();
    }
  });

  /* wishlist preview (4) */
  if (wishlist.length) {
    const all = await loadProducts();
    const products = wishlist.slice(0, 4).map((id) => getProductById(all, id)).filter(Boolean);
    if (products.length) {
      block.querySelector('#wishlistPreviewEmpty')?.remove();
      const grid = block.querySelector('#profileWishlistGrid');
      grid.innerHTML = products.map((p) => `
        <article class="product-card" data-id="${p.id}" role="link">
          <div class="product-card-img">
            ${p.images?.[0] ? `<img src="${p.images[0]}" alt="${esc(p.name)}" loading="lazy">` : '<div class="img-placeholder"></div>'}
          </div>
          <div class="product-card-body">
            <p class="product-name">${esc(p.name)}</p>
            <span class="product-price">${fmt(p.price)}</span>
          </div>
        </article>`).join('');
      grid.querySelectorAll('.product-card').forEach((card) => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => { window.location.href = `${cfg['product path']}?id=${card.dataset.id}`; });
      });
    }
  }
}