/*
 * blocks/header/header.js  — RE:WEAR site header
 *
 * REPLACES the boilerplate's default header.js. The boilerplate's loadHeader()
 * creates an empty `header` block and calls this decorate(); we fill it with the
 * RE:WEAR nav in code (no /nav doc needed) and wire syncNav + mobile + search.
 *
 * Nav styling is global (in styles/lazy-styles.css), so this block needs no CSS.
 * URLs are extensionless to match EDS routing (/browse, not browse.html).
 */

import { syncNav } from '../../scripts/auth-guard.js';

const NAV_HTML = `
  <nav class="nav" aria-label="Main navigation">
    <div class="container nav-inner">
      <a href="/" class="nav-logo">RE<span>:</span>WEAR</a>
      <ul class="nav-links" id="navLinks" role="list">
        <li><a href="/">Home</a></li>
        <li><a href="/browse">Browse</a></li>
        <li><a href="/cards">Discover</a></li>
        <li><a href="/how-it-works">How It Works</a></li>
      </ul>
      <div class="nav-actions">
        <label class="nav-search" for="navSearchInput" aria-label="Search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="search" id="navSearchInput" placeholder="search">
        </label>
        <a href="/login" class="btn btn-secondary nav-login-btn" id="navLoginLink">Login</a>
        <div id="navUserMenu" class="nav-user-menu is-hidden">
          <a href="/wishlist" class="nav-icon-btn" aria-label="Wishlist">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </a>
          <a href="/cart" class="nav-icon-btn nav-cart-icon" aria-label="Bag">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            <span class="cart-badge is-hidden"></span>
          </a>
          <div class="nav-profile-wrap" id="navProfileIconBtn">
            <div class="nav-avatar" id="navUserName">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            </div>
            <div class="nav-hover-dropdown">
              <div class="nav-hover-user">
                <span id="navDropdownName"></span>
                <span id="navDropdownEmail"></span>
              </div>
              <div class="nav-hover-divider"></div>
              <a href="/profile" class="nav-hover-item">My Profile</a>
              <a href="/wishlist" class="nav-hover-item">Wishlist</a>
              <a href="/cart" class="nav-hover-item">My Bag</a>
              <a href="/sell" class="nav-hover-item" id="dropdownSellLink">
                <span id="dropdownSellText">Become a Seller</span>
              </a>
              <div class="nav-hover-divider"></div>
              <button class="nav-hover-item nav-hover-logout" id="navLogoutBtn">Sign Out</button>
            </div>
          </div>
        </div>
        <button class="nav-hamburger" id="navHamburger" aria-label="Toggle menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </nav>
`;

function initMobileNav(root) {
  const btn = root.querySelector('#navHamburger');
  const links = root.querySelector('#navLinks');
  if (!btn || !links) return;
  btn.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    btn.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });
  links.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      links.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
}

function initSearch(root) {
  const input = root.querySelector('#navSearchInput');
  if (!input) return;
  const doSearch = () => {
    const q = input.value.trim();
    if (q) window.location.href = `/browse?search=${encodeURIComponent(q)}`;
  };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
  input.addEventListener('search', doSearch);
  root.querySelector('.nav-search svg')?.addEventListener('click', doSearch);
}

export default function decorate(block) {
  block.innerHTML = NAV_HTML;
  syncNav();
  initMobileNav(block);
  initSearch(block);
}