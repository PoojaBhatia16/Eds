/*
 * blocks/profile/profile.js — user account page (requires login)
 * Ported from profile.js. CSP-clean, no GSAP.
 * Author empty block on `profile` doc:  | Profile |
 */

/*
 * blocks/profile/profile.js — account page (CONFIG-DRIVEN, HerbAtlas-style)
 *
 * Author on the `profile` doc as a 2-column table (omit any → default):
 *   | Profile |          |
 *   | Login Path       | /login |
 *   | Profile Path     | /profile |
 *   | Orders Path      | /orders |
 *   | Wishlist Path    | /wishlist |
 *   | Cart Path        | /cart |
 *   | Sell Path        | /sell |
 *   | Product Path     | /product |
 *   | Account Title    | Account Details |
 *   | Saved Title      | Saved Items |
 *   | Upgrade Title    | Start Selling on RE:WEAR |
 *   | Upgrade Text     | List your pre-loved pieces and earn money while decluttering your wardrobe. |
 *   | Upgrade CTA      | Become a Seller |
 */
import { requireAuth, getCurrentUser, logout, upgradeToSeller, getWishlist } from '../../scripts/auth-guard.js';
import { loadProducts, getProductById } from '../../scripts/products.js';
import { getCart } from '../../scripts/cart.js';

const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN');
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const DEFAULTS = {
  'login path': '/login',
  'profile path': '/profile',
  'orders path': '/orders',
  'wishlist path': '/wishlist',
  'cart path': '/cart',
  'sell path': '/sell',
  'product path': '/product',
  'account title': 'Account Details',
  'saved title': 'Saved Items',
  'upgrade title': 'Start Selling on RE:WEAR',
  'upgrade text': 'List your pre-loved pieces and earn money while decluttering your wardrobe.',
  'upgrade cta': 'Become a Seller',
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

const buildShell = (cfg) => `
  <div class="container profile-page">
    <div class="profile-layout">
      <aside class="profile-sidebar">
        <div class="profile-avatar" id="profileAvatar"><span id="profileInitials">?</span></div>
        <h2 class="profile-name" id="profileName">—</h2>
        <p class="profile-email" id="profileEmail">—</p>
        <span class="profile-role-badge" id="profileRole">buyer</span>
        <div class="profile-stats">
          <div class="profile-stat"><span class="profile-stat-num" id="statWishlist">0</span><span class="profile-stat-label">Saved</span></div>
          <div class="profile-stat"><span class="profile-stat-num" id="statCart">0</span><span class="profile-stat-label">In Bag</span></div>
          <div class="profile-stat"><span class="profile-stat-num" id="statOrders">0</span><span class="profile-stat-label">Orders</span></div>
        </div>
        <nav class="profile-nav">
          <a href="${cfg['profile path']}" class="profile-nav-item active"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>My Profile</a>
          <a href="${cfg['orders path']}" class="profile-nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>Orders</a>
          <a href="${cfg['wishlist path']}" class="profile-nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>Wishlist</a>
          <a href="${cfg['cart path']}" class="profile-nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>My Bag</a>
          <a href="${cfg['sell path']}" class="profile-nav-item is-hidden" id="profileSellLink"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>Sell Items</a>
          <button class="profile-nav-item profile-logout-btn" id="profileLogout"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Sign Out</button>
        </nav>
      </aside>

      <div class="profile-main">
        <section class="profile-section">
          <div class="profile-section-header"><h3 class="profile-section-title">${cfg['account title']}</h3></div>
          <div class="profile-info-grid">
            <div class="profile-info-item"><span class="profile-info-label">Full Name</span><span class="profile-info-val" id="infoName">—</span></div>
            <div class="profile-info-item"><span class="profile-info-label">Email</span><span class="profile-info-val" id="infoEmail">—</span></div>
            <div class="profile-info-item"><span class="profile-info-label">Account Type</span><span class="profile-info-val" id="infoRole">—</span></div>
            <div class="profile-info-item"><span class="profile-info-label">Member Since</span><span class="profile-info-val" id="infoJoined">—</span></div>
          </div>
        </section>

        <section class="profile-section" id="upgradeSection">
          <div class="upgrade-card">
            <div class="upgrade-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg></div>
            <div class="upgrade-text">
              <h4>${cfg['upgrade title']}</h4>
              <p>${cfg['upgrade text']}</p>
            </div>
            <button class="btn btn-primary upgrade-btn" id="upgradeBtn">${cfg['upgrade cta']}</button>
          </div>
        </section>

        <section class="profile-section">
          <div class="profile-section-header">
            <h3 class="profile-section-title">${cfg['saved title']}</h3>
            <a href="${cfg['wishlist path']}" class="see-more">See all</a>
          </div>
          <div class="profile-mini-grid" id="profileWishlistGrid">
            <p class="muted-note" id="wishlistPreviewEmpty">No saved items yet.</p>
          </div>
        </section>
      </div>
    </div>
  </div>
`;

export default async function decorate(block) {
  const cfg = readConfig(block);
  if (!requireAuth(cfg['login path'])) return;

  block.innerHTML = buildShell(cfg);
  const $ = (id) => block.querySelector('#' + id);
  const set = (id, val) => { const el = $(id); if (el) el.textContent = val; };

  const user = getCurrentUser();
  if (!user) return;

  /* avatar initials */
  const initials = [user.firstName, user.lastName].filter(Boolean).map((n) => n[0].toUpperCase()).join('') || user.name?.[0]?.toUpperCase() || '?';
  set('profileInitials', initials);
  set('profileName', user.name || `${user.firstName} ${user.lastName}`);
  set('profileEmail', user.email);

  /* role badge */
  const roleBadge = $('profileRole');
  if (roleBadge) {
    roleBadge.textContent = user.role || 'buyer';
    roleBadge.classList.add(`role-${user.role || 'buyer'}`);
  }

  /* stats */
  const wishlist = getWishlist();
  const cart = getCart();
  let orders = [];
  try { orders = JSON.parse(localStorage.getItem('rewear_orders') || '[]'); } catch { orders = []; }
  const myOrders = orders.filter((o) => o.userId === user.id || o.userEmail === user.email);
  set('statWishlist', wishlist.length);
  set('statCart', cart.reduce((s, i) => s + (i.qty || 1), 0));
  set('statOrders', myOrders.length);

  /* info grid */
  set('infoName', user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim());
  set('infoEmail', user.email);
  set('infoRole', cap(user.role || 'buyer'));
  set('infoJoined', user.joinedAt ? new Date(user.joinedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—');

  /* seller/admin: show sell link, hide upgrade */
  if (user.role === 'seller' || user.role === 'admin') {
    $('profileSellLink')?.classList.remove('is-hidden');
    const up = $('upgradeSection'); if (up) up.style.display = 'none';
  }

  /* logout */
  $('profileLogout')?.addEventListener('click', () => { if (confirm('Sign out of RE:WEAR?')) logout(); });

  /* upgrade */
  $('upgradeBtn')?.addEventListener('click', () => {
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
      $('wishlistPreviewEmpty')?.remove();
      const grid = $('profileWishlistGrid');
      grid.innerHTML = products.map((p) => `
        <article class="product-card" data-id="${p.id}" role="link">
          <div class="product-card-img">
            ${p.images?.[0] ? `<img src="${p.images[0]}" alt="${p.name}" loading="lazy">` : '<div class="img-placeholder"></div>'}
          </div>
          <div class="product-card-body">
            <p class="product-name">${p.name}</p>
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