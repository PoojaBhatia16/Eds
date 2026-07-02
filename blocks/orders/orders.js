/*
 * blocks/orders/orders.js — Order history page (CONFIG-DRIVEN, HerbAtlas-style)
 *
 * Every label / path / message is an author-editable row in the block table.
 * Authors change copy, paths, and toggles WITHOUT touching code.
 *
 * Author on the `orders` doc as a 2-column table:
 *
 *   | Orders |                |
 *   | Login Path       | /login |
 *   | Browse Path      | /browse |
 *   | Require Login    | true |
 *   | Empty Title      | No orders yet |
 *   | Empty Text       | When you place an order, it'll show up here. |
 *   | Empty CTA Text   | Start Shopping |
 *   | Delivered Label  | Delivered to |
 *   | Total Label      | Total |
 *   | Status Label     | Processing |
 *   | Product Path     | /product |
 *
 * Any row you omit falls back to the default below. Order of rows doesn't matter.
 */

import { requireAuth, getCurrentUser } from '../../scripts/auth-guard.js';

const ORDERS_KEY = 'rewear_orders';
const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

/* defaults — used when the author leaves a row out */
const DEFAULTS = {
  'login path': '/login',
  'browse path': '/browse',
  'product path': '/product',
  'require login': 'true',
  'empty title': 'No orders yet',
  'empty text': "When you place an order, it'll show up here.",
  'empty cta text': 'Start Shopping',
  'delivered label': 'Delivered to',
  'total label': 'Total',
  'order label': 'Order',
  'items label': 'items',
};

/* read the authored 2-col table into a {key: value} config object, then remove the table */
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
  const requireLogin = String(cfg['require login']).toLowerCase() === 'true';

  if (requireLogin && !requireAuth(cfg['login path'])) return;
  const user = getCurrentUser();

  block.innerHTML = `
    <div class="container orders-page">
      <div class="orders-head">
        <h1 class="orders-title">${cfg['order label'] === 'Order' ? 'My Orders' : cfg['order label']}</h1>
      </div>
      <div id="ordersContainer"></div>
    </div>`;

  renderOrders();

  function getMyOrders() {
    let all = [];
    try { all = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); } catch { all = []; }
    return all
      .filter((o) => o.userId === user.id || o.userEmail === user.email)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  function renderOrders() {
    const box = block.querySelector('#ordersContainer');
    const orders = getMyOrders();

    if (!orders.length) {
      box.innerHTML = `
        <div class="orders-empty">
          <span class="orders-empty-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg></span>
          <h4>${cfg['empty title']}</h4>
          <p>${cfg['empty text']}</p>
          <a href="${cfg['browse path']}" class="btn btn-primary">${cfg['empty cta text']}</a>
        </div>`;
      return;
    }

    box.innerHTML = `<div class="orders-list">${orders.map((o) => {
      const date = new Date(o.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const count = o.items.reduce((s, i) => s + (i.qty || 1), 0);
      const addr = o.address || {};
      return `
        <article class="order-card">
          <header class="order-card-head">
            <div>
              <span class="order-id">${cfg['order label']} ${o.id}</span>
              <span class="order-date">${date} · ${count} ${cfg['items label']}</span>
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
              <span class="order-ship-label">${cfg['delivered label']}</span>
              <span class="order-ship-val">${addr.firstName || ''} ${addr.lastName || ''}${addr.city ? ', ' + addr.city : ''}</span>
            </div>
            <div class="order-total">
              <span class="order-total-label">${cfg['total label']}</span>
              <span class="order-total-val">${fmt(o.total)}</span>
            </div>
          </footer>
        </article>`;
    }).join('')}</div>`;
  }
}