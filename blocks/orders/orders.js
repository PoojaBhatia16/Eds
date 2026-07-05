/*
 * blocks/orders/orders.js — Order history INSIDE the profile layout (matches original)
 * Sidebar (avatar/name/badge/stats/nav) + orders list on the right. CONFIG-DRIVEN.
 *
 * Author on the `orders` doc:
 *   | Orders |          |
 *   | Login Path       | /login |
 *   | Profile Path     | /profile |
 *   | Wishlist Path    | /wishlist |
 *   | Cart Path        | /cart |
 *   | Sell Path        | /sell |
 *   | Browse Path      | /browse |
 *   | Product Path     | /product |
 *   | Empty Title      | No orders yet |
 *   | Empty Text       | When you place an order, it'll show up here. |
 *   | Empty CTA Text   | Start Shopping |
 */

import { requireAuth, getCurrentUser, logout } from '../../scripts/auth-guard.js';
import { getCart } from '../../scripts/cart.js';

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

const DEFAULTS = {
  'login path': '/login',
  'profile path': '/profile',
  'orders path': '/orders',
  'wishlist path': '/wishlist',
  'cart path': '/cart',
  'sell path': '/sell',
  'browse path': '/browse',
  'product path': '/product',
  'empty title': 'No orders yet',
  'empty text': "When you place an order, it'll show up here.",
  'empty cta text': 'Start Shopping',
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

export default function decorate(block) {
  const cfg = readConfig(block);
  if (!requireAuth(cfg['login path'])) return;
  const user = getCurrentUser();
  if (!user) return;

  const initials = [user.firstName, user.lastName].filter(Boolean).map((n) => n[0].toUpperCase()).join('')
    || user.name?.[0]?.toUpperCase() || '?';
  const role = user.role || 'buyer';

  let orders = [];
  try { orders = JSON.parse(localStorage.getItem('rewear_orders') || '[]'); } catch { orders = []; }
  const myOrders = orders
    .filter((o) => o.userId === user.id || o.userEmail === user.email)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const wishlistCount = (() => { try { return JSON.parse(localStorage.getItem(`rewear_wishlist_${user.id || user.email || 'user'}`) || '[]').length; } catch { return 0; } })();
  const cartCount = getCart().reduce((s, i) => s + (i.qty || 1), 0);

  block.innerHTML = `
    <div class="container profile-page">
      <div class="profile-layout">
        <aside class="profile-sidebar">
          <div class="profile-avatar"><span>${initials}</span></div>
          <h2 class="profile-name">${user.name || `${user.firstName} ${user.lastName}`}</h2>
          <p class="profile-email">${user.email}</p>
          <span class="profile-role-badge role-${role}">${role}</span>
          <div class="profile-stats">
            <div class="profile-stat"><span class="profile-stat-num">${wishlistCount}</span><span class="profile-stat-label">Saved</span></div>
            <div class="profile-stat"><span class="profile-stat-num">${cartCount}</span><span class="profile-stat-label">In Bag</span></div>
            <div class="profile-stat"><span class="profile-stat-num">${myOrders.length}</span><span class="profile-stat-label">Orders</span></div>
          </div>
          <nav class="profile-nav">
            <a href="${cfg['profile path']}" class="profile-nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>My Profile</a>
            <a href="${cfg['orders path']}" class="profile-nav-item active"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>Orders</a>
            <a href="${cfg['wishlist path']}" class="profile-nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>Wishlist</a>
            <a href="${cfg['cart path']}" class="profile-nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>My Bag</a>
            ${role === 'seller' || role === 'admin' ? `<a href="${cfg['sell path']}" class="profile-nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>Sell Items</a>` : ''}
            <button class="profile-nav-item profile-logout-btn" id="ordersLogout"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Sign Out</button>
          </nav>
        </aside>

        <div class="profile-main">
          <div class="profile-section">
            <div class="profile-section-header"><h3 class="profile-section-title">My Orders</h3></div>
            <div id="ordersContainer"></div>
          </div>
        </div>
      </div>
    </div>`;

  block.querySelector('#ordersLogout')?.addEventListener('click', () => { if (confirm('Sign out of RE:WEAR?')) logout(); });

  const box = block.querySelector('#ordersContainer');
  if (!myOrders.length) {
    box.innerHTML = `
      <div class="orders-empty">
        <span class="orders-empty-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg></span>
        <h4>${cfg['empty title']}</h4>
        <p>${cfg['empty text']}</p>
        <a href="${cfg['browse path']}" class="btn btn-primary">${cfg['empty cta text']}</a>
      </div>`;
    return;
  }

  box.innerHTML = `<div class="orders-list">${myOrders.map((o) => {
    const date = new Date(o.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const count = o.items.reduce((s, i) => s + (i.qty || 1), 0);
    const addr = o.address || {};
    return `
      <article class="order-card">
        <header class="order-card-head">
          <div>
            <span class="order-id">Order ${o.id}</span>
            <span class="order-date">${date} · ${count} item${count !== 1 ? 's' : ''}</span>
          </div>
          <span class="order-status order-status--${(o.status || 'processing').toLowerCase()}">${o.status || 'Processing'}</span>
        </header>
        <div class="order-items">
          ${o.items.map((i) => {
            const link = i.id ? ` href="${cfg['product path']}?id=${i.id}"` : '';
            const tag = i.id ? 'a' : 'div';
            return `<${tag} class="order-item${i.id ? ' is-link' : ''}"${link}>
              <div class="order-item-img">${i.image ? `<img src="${i.image}" alt="${i.name}">` : ''}</div>
              <div class="order-item-info">
                <p class="order-item-name">${i.name}</p>
                <p class="order-item-meta">${i.brand ? i.brand + ' · ' : ''}Size ${i.size || '—'} · Qty ${i.qty || 1}</p>
              </div>
              <span class="order-item-price">${fmt(i.price * (i.qty || 1))}</span>
              ${i.id ? '<svg class="order-item-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>' : ''}
            </${tag}>`;
          }).join('')}
        </div>
        <footer class="order-card-foot">
          <div class="order-ship">
            <span class="order-ship-label">Delivered to</span>
            <span class="order-ship-val">${addr.firstName || ''} ${addr.lastName || ''}${addr.city ? ', ' + addr.city : ''}</span>
          </div>
          <div class="order-total">
            <span class="order-total-label">Total</span>
            <span class="order-total-val">${fmt(o.total)}</span>
          </div>
        </footer>
      </article>`;
  }).join('')}</div>`;
}