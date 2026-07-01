/*
 * blocks/purpose-split/purpose-split.js
 *
 * The block element ITSELF already has class "purpose-split" (EDS adds it from
 * the table name), and that class is the 1fr/auto/1fr grid. So we put the two
 * cards + divider DIRECTLY inside the block — no inner wrapper (a nested
 * .purpose-split would get crammed into one grid column = narrow/tall cards).
 *
 * Content is fixed editorial copy, baked in to match the original exactly.
 * Author it as an empty block:  | Purpose Split |
 */

const BUY = `
  <div class="purpose-card purpose-card--buy">
    <p class="purpose-eyebrow">For Buyers</p>
    <h2 class="purpose-title">Discover Pre-Loved<br><em>Fashion</em></h2>
    <p class="purpose-sub">Curated vintage, thrift, and contemporary pieces — all verified, all unique.</p>
    <a href="/browse" class="btn btn-primary purpose-btn">Browse Finds →</a>
  </div>`;

const DIVIDER = '<div class="purpose-divider"><span>or</span></div>';

const SELL = `
  <div class="purpose-card purpose-card--sell">
    <p class="purpose-eyebrow">For Sellers</p>
    <h2 class="purpose-title">Turn Your Wardrobe<br>Into <em>Cash</em></h2>
    <p class="purpose-sub">List your pre-loved pieces in minutes. Our team reviews every submission for quality.</p>
    <a href="/sell" class="btn btn-accent purpose-btn">Start Selling →</a>
  </div>`;

export default function decorate(block) {
  block.innerHTML = BUY + DIVIDER + SELL;
}