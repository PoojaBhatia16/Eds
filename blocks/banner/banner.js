/*
 * blocks/banner/banner.js — page banner (browse header)
 * Authored:
 *   | Banner |
 *   | All Finds |
 *   | Curated pieces |
 * Renders the title (last word italic-orange) + live item count + label.
 * The count is filled by the product-grid block via #bannerCount.
 */

export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const title = rows[0]?.textContent.trim() || 'All Finds';
  const label = rows[1]?.textContent.trim() || 'Curated pieces';
  block.textContent = '';

  // split title so the last word becomes the orange <em> accent
  const parts = title.split(' ');
  const last = parts.pop();
  const head = parts.join(' ');

  block.innerHTML = `
    <div class="container">
      <div class="browse-banner-inner">
        <h1 class="browse-banner-title">${head} <em>${last}</em></h1>
        <div class="browse-banner-meta">
          <span class="browse-banner-count" id="bannerCount">—</span>
          <span class="browse-banner-label">${label}</span>
        </div>
      </div>
    </div>
  `;
}