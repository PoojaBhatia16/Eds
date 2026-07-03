/*
 * blocks/cart/cart.js — shopping bag (CONFIG-DRIVEN, HerbAtlas-style)
 *
 * Author on the `cart` doc as a 2-column table (omit any row → default used):
 *
 *   | Cart |            |
 *   | Title            | Your Bag |
 *   | Browse Path      | /browse |
 *   | Checkout Path    | /checkout |
 *   | Product Path     | /product |
 *   | Free Threshold   | 999 |
 *   | Delivery Fee     | 99 |
 *   | Promo Code       | REWEAR10 |
 *   | Empty Title      | Your bag is empty |
 *   | Empty Text       | Looks like you haven't added anything yet. |
 *   | Empty CTA Text   | Start Browsing |
 *   | Checkout CTA     | Proceed to Checkout |
 *   | Login Prompt     | Please log in to check out and place your order |
 */

import { ensureAuth } from '../../scripts/auth-guard.js';
import { getCart, saveCart } from '../../scripts/cart.js';

const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN');

const DEFAULTS = {
  'title': 'Your Bag',
  'browse path': '/browse',
  'checkout path': '/checkout',
  'product path': '/product',
  'free threshold': '999',
  'delivery fee': '99',
  'promo code': 'REWEAR10',
  'empty title': 'Your bag is empty',
  'empty text': "Looks like you haven't added anything yet.",
  'empty cta text': 'Start Browsing',
  'checkout cta': 'Proceed to Checkout',
  'login prompt': 'Please log in to check out and place your order',
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

function removeFromCart(id, size) {
  saveCart(getCart().filter((i) => !(String(i.id) === String(id) && i.size === size)));
}

function updateCartBadge() {
  const badge = document.querySelector('.cart-badge');
  if (!badge) return;
  const count = getCart().reduce((s, i) => s + (i.qty || 1), 0);
  badge.textContent = count || '';
  badge.style.display = count ? 'flex' : 'none';
}

export default function decorate(block) {
  const cfg = readConfig(block);
  const freeThreshold = Number(cfg['free threshold']) || 999;
  const deliveryFee = Number(cfg['delivery fee']) || 99;

  block.innerHTML = `
    <div class="cart-page container">
      <nav class="cart-breadcrumb"><a href="/">Home</a> <span>/</span> <span>Shopping Bag</span></nav>
      <h1 class="cart-title">${cfg['title']}</h1>
      <div class="cart-layout" id="cartLayout"></div>
    </div>`;

  const layout = block.querySelector('#cartLayout');
  render();

  function render() {
    const cart = getCart();
    if (!cart.length) {
      layout.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty-icon"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg></div>
          <h2>${cfg['empty title']}</h2>
          <p>${cfg['empty text']}</p>
          <a href="${cfg['browse path']}" class="btn btn-primary cart-empty-btn">${cfg['empty cta text']}</a>
        </div>`;
      updateCartBadge();
      return;
    }

    const subtotal = cart.reduce((s, i) => s + i.price * (i.qty || 1), 0);
    const delivery = subtotal >= freeThreshold ? 0 : deliveryFee;
    const total = subtotal + delivery;
    const itemCount = cart.reduce((s, i) => s + (i.qty || 1), 0);

    layout.innerHTML = `
      <div class="cart-items" id="cartItems">
        ${cart.map((item, idx) => itemHTML(item, idx)).join('')}
      </div>
      <div class="cart-summary">
        <h2 class="cart-summary-title">Order Summary</h2>
        <div class="cart-summary-rows">
          <div class="cart-summary-row"><span>Subtotal (${itemCount} items)</span><span>${fmt(subtotal)}</span></div>
          <div class="cart-summary-row"><span>Delivery</span><span>${delivery === 0 ? '<span class="cart-free">Free</span>' : fmt(delivery)}</span></div>
          ${delivery > 0 ? `<div class="cart-summary-row cart-free-hint"><span>Add ${fmt(freeThreshold - subtotal)} more for free delivery</span></div>` : ''}
          <div class="cart-summary-row total"><span>Total</span><span>${fmt(total)}</span></div>
        </div>
        <div class="cart-promo">
          <input type="text" id="promoInput" placeholder="Promo code">
          <button class="cart-promo-btn" id="promoBtn">Apply</button>
        </div>
        <div id="promoMsg" class="cart-promo-msg"></div>
        <button class="btn btn-primary cart-checkout-btn" id="checkoutBtn">${cfg['checkout cta']}</button>
        <a href="${cfg['browse path']}" class="cart-continue">← Continue Shopping</a>
        <div class="cart-trust">
          <div class="cart-trust-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><span>Secure checkout</span></div>
          <div class="cart-trust-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg><span>7-day easy returns</span></div>
          <div class="cart-trust-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg><span>Free delivery above ${fmt(freeThreshold)}</span></div>
        </div>
      </div>`;

    wireItems();
    wireSummary();
    updateCartBadge();
  }

  function itemHTML(item, idx) {
    const saving = item.originalPrice ? Math.round((1 - item.price / item.originalPrice) * 100) : 0;
    return `
      <div class="cart-item" data-idx="${idx}">
        <div class="cart-item-img" data-goto="${item.id}">
          ${item.image ? `<img src="${item.image}" alt="${item.name}">` : '<div class="img-placeholder"></div>'}
        </div>
        <div class="cart-item-info">
          <p class="cart-item-brand">${item.brand || 'RE:WEAR'}</p>
          <p class="cart-item-name" data-goto="${item.id}">${item.name}</p>
          <div class="cart-item-meta">
            ${item.size ? `<span class="cart-meta-chip">Size ${item.size}</span>` : ''}
            <span class="cart-meta-unique">One of a kind</span>
          </div>
        </div>
        <div class="cart-item-right">
          <div class="cart-item-price">
            <span class="cart-item-price-current">${fmt(item.price * (item.qty || 1))}</span>
            ${item.originalPrice ? `<span class="cart-item-price-orig">${fmt(item.originalPrice * (item.qty || 1))}</span>` : ''}
            ${saving > 0 ? `<span class="cart-item-price-saving">-${saving}% off</span>` : ''}
          </div>
          <button class="cart-item-remove" data-remove="${idx}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>
            Remove
          </button>
        </div>
      </div>`;
  }

  function wireItems() {
    layout.querySelectorAll('[data-goto]').forEach((el) => {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => { window.location.href = `${cfg['product path']}?id=${el.dataset.goto}`; });
    });
    layout.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cart = getCart();
        const idx = Number(btn.dataset.remove);
        if (!cart[idx]) return;
        removeFromCart(cart[idx].id, cart[idx].size);
        render();
      });
    });
  }

  function wireSummary() {
    const promoBtn = block.querySelector('#promoBtn');
    const promoInput = block.querySelector('#promoInput');
    const promoMsg = block.querySelector('#promoMsg');
    promoBtn?.addEventListener('click', () => {
      const code = promoInput?.value?.trim().toUpperCase();
      if (code === cfg['promo code'].toUpperCase()) { promoMsg.textContent = '✓ 10% off applied!'; promoMsg.className = 'cart-promo-msg ok'; }
      else if (!code) { promoMsg.textContent = 'Enter a promo code'; promoMsg.className = 'cart-promo-msg err'; }
      else { promoMsg.textContent = 'Invalid promo code'; promoMsg.className = 'cart-promo-msg err'; }
    });

    block.querySelector('#checkoutBtn')?.addEventListener('click', () => {
      if (!ensureAuth(cfg['login prompt'])) return;
      window.location.href = cfg['checkout path'];
    });
  }
}