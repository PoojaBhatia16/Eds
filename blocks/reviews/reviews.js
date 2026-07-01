/*
 * blocks/reviews/reviews.js — testimonials / social proof
 * Fixed editorial content baked in. Author as an empty block:  | Reviews |
 */

const STAR = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.3 6.8.6-5.1 4.5 1.5 6.7L12 17.3 5.9 20.6l1.5-6.7L2.3 8.9l6.8-.6z"/></svg>';
const STARS = STAR.repeat(5);
const CHECK = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

const CARDS = [
  { init: 'A', name: 'Aisha R.', tag: 'Verified Buyer', text: 'Found a vintage Levi’s jacket in better shape than described. Smooth, fast, and packaged with care.' },
  { init: 'K', name: 'Karan M.', tag: 'Verified Buyer', text: 'Love that every piece is hand-checked before it’s listed. No surprises — just great finds.' },
  { init: 'N', name: 'Neha S.', tag: 'Verified Seller', text: 'Listed three pieces from my closet in a week. The whole selling flow is genuinely simple.' },
  { init: 'P', name: 'Priya T.', tag: 'Verified Buyer', text: 'A one-of-a-kind co-ord at half the retail price. My new favourite way to shop.' },
];

const PILLS = ['Hand-checked listings', 'Admin-verified sellers', 'One-of-a-kind pieces', 'Free delivery over ₹999'];

export default function decorate(block) {
  block.innerHTML = `
    <div class="container">
      <div class="reviews-head">
        <div>
          <span class="reviews-kicker">What our community says</span>
          <h2 class="reviews-title">Loved by <em>conscious shoppers</em></h2>
        </div>
        <a href="/browse" class="reviews-cta">Browse finds →</a>
      </div>

      <div class="reviews-grid">
        ${CARDS.map((c) => `
          <article class="review-card">
            <div class="review-stars">${STARS}</div>
            <p class="review-text">“${c.text}”</p>
            <div class="review-author">
              <span class="review-avatar">${c.init}</span>
              <div>
                <p class="review-name">${c.name}</p>
                <p class="review-tag">${CHECK} ${c.tag}</p>
              </div>
            </div>
          </article>
        `).join('')}
      </div>

      <div class="reviews-trust">
        ${PILLS.map((p) => `<span class="trust-pill">${p}</span>`).join('')}
      </div>
    </div>
  `;
}