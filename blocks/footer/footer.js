/*
 * blocks/footer/footer.js — RE:WEAR site footer
 *
 * The boilerplate's loadFooter() creates an empty `footer` block and calls this.
 * We fill it with the RE:WEAR footer in code (no /footer doc needed).
 * Footer styling is global (styles/lazy-styles.css), so no CSS file needed.
 * URLs are extensionless to match EDS routing.
 */

const FOOTER_HTML = `
  <div class="container">
    <div class="footer-grid">
      <div>
        <div class="footer-brand">RE:WEAR</div>
        <p class="footer-tagline">Curated vintage and thrift fashion. Every garment deserves a second chapter.</p>
      </div>
      <div>
        <div class="footer-col-title">Explore</div>
        <ul class="footer-links">
          <li><a href="/">Home</a></li>
          <li><a href="/browse">Browse</a></li>
          <li><a href="/collection">Discover</a></li>
          <li><a href="/how-it-works">How It Works</a></li>
          <li><a href="/faq">FAQ</a></li>
        </ul>
      </div>
      <div>
        <div class="footer-col-title">Shop</div>
        <ul class="footer-links">
          <li><a href="/browse?gender=women">Women's</a></li>
          <li><a href="/browse?gender=men">Men's</a></li>
          <li><a href="/browse?gender=kids">Kids</a></li>
          <li><a href="/sell">Sell</a></li>
          <li><a href="/cart">Cart</a></li>
        </ul>
      </div>
      <div>
        <div class="footer-col-title">Account</div>
        <ul class="footer-links">
          <li><a href="/profile">My Account</a></li>
          <li><a href="/orders">Orders</a></li>
          <li><a href="/wishlist">Wishlist</a></li>
          <li><a href="/login" id="footerAuthLink">Sign In</a></li>
        </ul>
      </div>
      <div>
        <div class="footer-col-title">Social</div>
        <ul class="footer-links footer-social">
          <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><svg class="footer-soc-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>Instagram</a></li>
          <li><a href="https://pinterest.com" target="_blank" rel="noopener noreferrer"><svg class="footer-soc-ico" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 4 5.6 4 8.7c0 1.9.7 3.6 2.3 4.2.3.1.5 0 .5-.3l.2-.8c.1-.2 0-.3-.1-.5-.4-.5-.7-1.1-.7-2C6.5 7.2 8.3 5 11.4 5c2.7 0 4.2 1.7 4.2 3.9 0 2.9-1.3 5.4-3.2 5.4-1 0-1.8-.9-1.6-1.9.3-1.3.9-2.6.9-3.5 0-.8-.4-1.5-1.3-1.5-1.1 0-1.9 1.1-1.9 2.6 0 .9.3 1.6.3 1.6l-1.3 5.4c-.4 1.6-.1 3.5 0 3.7.1.1.3 0 .3 0 .1-.1 1.5-1.9 2-3.6l.7-2.8c.4.7 1.4 1.3 2.5 1.3 3.3 0 5.5-3 5.5-7C20 5.5 17.2 2 12 2z"/></svg>Pinterest</a></li>
          <li><a href="/contact"><svg class="footer-soc-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>Contact</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span class="footer-copy">© 2026 RE:WEAR</span>
      <span class="footer-copy">Made for sustainable fashion</span>
    </div>
  </div>
`;

export default function decorate(block) {
  block.innerHTML = FOOTER_HTML;
}