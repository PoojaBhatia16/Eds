/*
 * blocks/footer/footer.js - RE:WEAR site footer (CONFIG-DRIVEN, cart-style)
 *
 * Content is authored in the `/footer` document as ONE "Footer" block table,
 * exactly like the cart block. The boilerplate loadFooter() creates an empty
 * footer block, so this module fetches `/footer.plain.html`, reads the
 * authored Footer table, and renders it into the RE:WEAR footer layout.
 *
 * -- HOW TO AUTHOR the /footer document --
 * Make a block table. First row = one cell containing the word "Footer".
 * Then one row per section, first cell = key, second cell = value:
 *
 *   | Footer  |                                                          |
 *   | Brand   | RE:WEAR                                                  |
 *   | Tagline | Curated vintage and thrift fashion...                    |
 *   | Explore | [Home](/) [Browse](/browse) [Discover](/collection)      |
 *   | Shop    | [Women's](/browse?gender=women) [Men's](/browse?gender=men)|
 *   | Account | [My Account](/profile) [Orders](/orders) [Sign In](/login)|
 *   | Bottom  | (c) 2026 RE:WEAR                                          |
 *
 * Reserved keys: Brand, Tagline, Bottom. Any OTHER key becomes a link column
 * (the key is the column title, the links in the 2nd cell become the list).
 * A link to /login automatically gets id="footerAuthLink" so Sign In/Out works.
 * Multiple "Bottom" rows are allowed (one <span> each).
 *
 * If the document/table is missing, the built-in fallback renders so the
 * footer is never empty. Styling is global (styles/lazy-styles.css).
 */

const RESERVED = ['brand', 'tagline', 'bottom'];

/* -- Built-in fallback (used only if the /footer table is missing/empty) -- */
const FALLBACK_HTML = `
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
    </div>
    <div class="footer-bottom">
      <span class="footer-copy">&copy; 2026 RE:WEAR</span>
      <span class="footer-copy">Made for sustainable fashion</span>
    </div>
  </div>
`;

/*
 * Read the authored Footer block table out of the parsed document body.
 * In .plain.html a block table becomes:
 *   <div class="footer">
 *     <div><div>KEY</div><div>VALUE</div></div>  ... one per row
 *   </div>
 * Returns an array of { key, valueEl } rows, or [] if none.
 */
function readRows(dom) {
  const block = dom.querySelector('.footer') || dom.querySelector('div > div');
  if (!block) return [];
  return [...block.children].map((row) => {
    const cells = row.children;
    if (cells.length < 2) return null;
    return { key: cells[0].textContent.trim(), valueEl: cells[1] };
  }).filter(Boolean);
}

function buildFromRows(rows) {
  if (!rows.length) return null;

  let brand = '';
  let tagline = '';
  const columns = [];
  const bottom = [];

  rows.forEach(({ key, valueEl }) => {
    const k = key.toLowerCase();
    if (k === 'brand') { brand = valueEl.textContent.trim(); return; }
    if (k === 'tagline') { tagline = valueEl.textContent.trim(); return; }
    if (k === 'bottom') { bottom.push(valueEl.textContent.trim()); return; }

    /* any other key = a link column */
    const links = [...valueEl.querySelectorAll('a')].map((a) => ({
      href: a.getAttribute('href'),
      text: a.textContent.trim(),
    }));
    if (links.length) columns.push({ title: key, links });
  });

  if (!brand && !columns.length) return null;

  const brandCol = `
    <div>
      <div class="footer-brand">${brand || 'RE:WEAR'}</div>
      ${tagline ? `<p class="footer-tagline">${tagline}</p>` : ''}
    </div>`;

  const linkCols = columns.map((col) => `
    <div>
      <div class="footer-col-title">${col.title}</div>
      <ul class="footer-links">
        ${col.links.map((l) => {
          const isAuth = (l.href || '').replace(/\/$/, '').endsWith('/login');
          return `<li><a href="${l.href}"${isAuth ? ' id="footerAuthLink"' : ''}>${l.text}</a></li>`;
        }).join('')}
      </ul>
    </div>`).join('');

  const bottomHTML = bottom.length
    ? bottom.map((t) => `<span class="footer-copy">${t}</span>`).join('')
    : `<span class="footer-copy">&copy; 2026 RE:WEAR</span>`;

  return `
    <div class="container">
      <div class="footer-grid">
        ${brandCol}
        ${linkCols}
      </div>
      <div class="footer-bottom">${bottomHTML}</div>
    </div>`;
}

export default async function decorate(block) {
  let html = FALLBACK_HTML;

  try {
    const resp = await fetch('/footer.plain.html');
    if (resp.ok) {
      const text = await resp.text();
      const dom = new DOMParser().parseFromString(text, 'text/html').body;
      const built = buildFromRows(readRows(dom));
      if (built) html = built;
    }
  } catch (e) {
    // network/parse error -> keep fallback, never break the footer
    // eslint-disable-next-line no-console
    console.warn('Footer doc load failed, using fallback:', e.message);
  }

  block.innerHTML = html;
}