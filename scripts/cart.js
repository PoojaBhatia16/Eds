/* ============================================
   CART.JS — Cart utility functions
   ============================================ */

import { cartKey } from './auth-guard.js';

export function getCart() {
  try { return JSON.parse(localStorage.getItem(cartKey())) || []; }
  catch { return []; }
}

export function saveCart(cart) {
  localStorage.setItem(cartKey(), JSON.stringify(cart));
}

export function addItem(product, size, qty = 1) {
  const cart = getCart();
  const existing = cart.find(i => i.id === String(product.id) && i.size === size);
  if (existing) {
    /* one-of-a-kind thrift piece: only a single unit ever exists, so qty stays 1 */
    existing.qty = 1;
  } else {
    cart.push({
      id:            String(product.id),
      name:          product.name,
      brand:         product.brand || '',
      price:         product.price,
      originalPrice: product.originalPrice || null,
      image:         product.images?.[0] || '',
      size,
      qty,
    });
  }
  saveCart(cart);
  return cart;
}

export function removeItem(id, size) {
  const cart = getCart().filter(i => !(i.id === String(id) && i.size === size));
  saveCart(cart);
  return cart;
}

export function updateQty(id, size, qty) {
  const cart = getCart();
  const item = cart.find(i => i.id === String(id) && i.size === size);
  if (item) {
    item.qty = qty;
    if (item.qty <= 0) return removeItem(id, size);
  }
  saveCart(cart);
  return cart;
}

export function getCartCount() {
  return getCart().reduce((s, i) => s + (i.qty || 1), 0);
}

export function syncNavBadge() {
  const badge = document.querySelector('.cart-badge');
  if (!badge) return;
  const count = getCartCount();
  badge.textContent   = count || '';
  badge.style.display = count ? 'flex' : 'none';
}