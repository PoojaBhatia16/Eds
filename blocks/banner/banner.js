/*
 * blocks/banner/banner.js — page banner / browse header (CONFIG-DRIVEN, HerbAtlas-style)
 *
 * Author on the `browse` doc (above the Product Grid block) as a 2-column table:
 *
 *   | Banner |         |
 *   | Title          | All Finds |
 *   | Label          | Curated pieces |
 *   | Show Count     | true |
 *
 * - Title: the LAST word becomes the orange <em> accent (e.g. "All Finds").
 * - Label: sits next to the live item count.
 * - Show Count: "false" hides the count + label meta row.
 * The count itself is filled live by the product-grid block via #bannerCount.
 *
 * Backward compatible: a bare positional table (row1 = title, row2 = label,
 * with no "Title"/"Label" keys) still works.
 */

const DEFAULTS = {
  'title': 'All Finds',
  'label': 'Curated pieces',
  'show count': 'true',
};

function readConfig(block) {
  const cfg = { ...DEFAULTS };
  const rows = [...block.querySelectorAll(':scope > div')];
  let keyed = false;

  rows.forEach((row) => {
    const cells = row.querySelectorAll(':scope > div');
    if (cells.length >= 2) {
      const key = cells[0].textContent.trim().toLowerCase();
      if (key === 'title' || key === 'label' || key === 'show count') {
        cfg[key] = cells[1].textContent.trim();
        keyed = true;
      }
    }
  });

  // fallback: old positional style (row1 = title, row2 = label)
  if (!keyed) {
    if (rows[0]) cfg['title'] = rows[0].textContent.trim() || cfg['title'];
    if (rows[1]) cfg['label'] = rows[1].textContent.trim() || cfg['label'];
  }
  return cfg;
}

export default function decorate(block) {
  const cfg = readConfig(block);
  const showCount = String(cfg['show count']).toLowerCase() === 'true';
  block.textContent = '';

  // split title so the last word becomes the orange <em> accent
  const parts = cfg['title'].split(' ');
  const last = parts.pop();
  const head = parts.join(' ');

  block.innerHTML = `
    <div class="container">
      <div class="browse-banner-inner">
        <h1 class="browse-banner-title">${head} <em>${last}</em></h1>
        ${showCount ? `
        <div class="browse-banner-meta">
          <span class="browse-banner-count" id="bannerCount">—</span>
          <span class="browse-banner-label">${cfg['label']}</span>
        </div>` : ''}
      </div>
    </div>
  `;
}