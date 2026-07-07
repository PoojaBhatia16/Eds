/* ============================================
   PRODUCTS.JS — matched to your products.json
   ============================================ */

/* ── LOAD ──────────────────────────────────── */
export async function loadProducts(dataSource = '/data/products.json') {
  try {
    const res = await fetch(dataSource);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const products = await res.json();

    /* merge admin-approved seller products from localStorage */
    const approved = JSON.parse(localStorage.getItem('rewear_approved_products') || '[]');

    /* hide products the admin removed from the store */
    const removed = getRemoved();
    return [...products, ...approved].filter(p => !removed.includes(String(p.id)));

  } catch (err) {
    console.error('loadProducts failed:', err.message);
    return [];
  }
}

/* ── IMAGE RESIZE (Shopify/Westside CDN supports ?width=) ──
   Cards show ~300-400px, so request 400 instead of 990 → ~75% smaller download.
   Shopify auto-serves WebP/AVIF by Accept header, so format is already optimal.
   Local paths (starting with '/') are pre-optimized WebP files served from our
   own origin — they must NOT be rewritten (no ?width= support, and mangling the
   '_800x' in a filename would 404). Pass them through untouched. */
export function resizeImg(url, w = 400) {
  if (!url) return url;
  if (url.startsWith('data:')) return url;          // base64 seller uploads — never rewrite
  if (url.startsWith('/')) return url;               // local pre-optimized asset — never rewrite
  if (/[?&]width=\d+/.test(url))            return url.replace(/([?&]width=)\d+/, `$1${w}`);
  if (/_\d+x\.(jpe?g|png|webp)/i.test(url)) return url.replace(/_\d+x(\.(?:jpe?g|png|webp))/i, `_${w}x$1`);
  return url + (url.includes('?') ? '&' : '?') + 'width=' + w;
}

/* ── RESPONSIVE SRCSET ──
   Only meaningful for CDN URLs that honour ?width=. For local pre-optimized
   assets we return '' so the plain single src is used (no bogus srcset). */
export function buildSrcset(url, widths = [200, 300, 400, 600]) {
  if (!url || url.startsWith('data:') || url.startsWith('/')) return '';
  return widths.map((w) => `${resizeImg(url, w)} ${w}w`).join(', ');
}
export const CARD_SIZES = '(max-width: 600px) 45vw, (max-width: 900px) 30vw, 300px';

/* ── SOLD STOCK (thrift = one physical unit; once bought, it's gone) ── */
export function getSold() {
  try { return JSON.parse(localStorage.getItem('rewear_sold') || '[]').map(String); }
  catch { return []; }
}
export function isSold(id) {
  return getSold().includes(String(id));
}

/* ── REMOVED FROM STORE (admin took it down permanently) ── */
export function getRemoved() {
  try { return JSON.parse(localStorage.getItem('rewear_removed') || '[]').map(String); }
  catch { return []; }
}
export function isRemoved(id) {
  return getRemoved().includes(String(id));
}

/* ── BUILD ONE CARD ────────────────────────── */
export function buildProductCard(product, eager = false) {
  const { id, name, brand, price, originalPrice, images, gender } = product;

  const saving = originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0;
  const fmt    = n => '₹' + Number(n).toLocaleString('en-IN');
  const imgSrc = resizeImg(images?.[0] || '', 400);
  const imgSrcset = buildSrcset(images?.[0] || '');
  const imgAttrs = eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy" decoding="async"';

  /* each listing is a single, one-of-a-kind piece — one size only */
  const size     = product.size || (Array.isArray(product.sizes) ? product.sizes[0] : '') || '';
  const sizePips = size ? `<span class="product-size-pip">${size}</span>` : '';

  /* brand — everything before · */
  const brandShort = brand?.split('·')[0]?.trim() || brand || '';

  const sold = isSold(id);

  return `
    <article class="product-card${sold ? ' is-sold' : ''}" data-id="${id}">
      <a href="/product?id=${id}" style="text-decoration:none;color:inherit;">
        <div class="product-card-img">
          ${sold ? '<div class="sold-overlay"><span>Sold Out</span></div>' : ''}
          ${imgSrc
            ? `<img
                src="${imgSrc}"
                ${imgSrcset ? `srcset="${imgSrcset}" sizes="${CARD_SIZES}"` : ''}
                width="300" height="400"
                alt="${name}"
                ${imgAttrs}
                data-fallback-img
              >
              <div class="img-placeholder" style="display:none;"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5L5 20"/></svg></div>`
            : `<div class="img-placeholder"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5L5 20"/></svg></div>`
          }
          <button
            class="product-wishlist"
            data-id="${id}"
            type="button"
            aria-label="Add to wishlist"
          >♡</button>
        </div>
        <div class="product-card-body">
          <p class="product-brand">${brandShort}</p>
          <h3 class="product-name">${name}</h3>
          <div class="product-pricing">
            <span class="product-price">${fmt(price)}</span>
            ${originalPrice ? `<span class="product-orig">${fmt(originalPrice)}</span>` : ''}
            ${saving > 0   ? `<span class="product-saving" style="font-size:11px;color:#3B6D11;font-weight:600;">-${saving}%</span>` : ''}
          </div>
          <div class="product-sizes" style="display:flex;gap:4px;margin-top:8px;">${sizePips}</div>
        </div>
      </a>
    </article>
  `;
}

/* ── RENDER LIST ───────────────────────────── */
export function renderProducts(products, gridSelector) {
  const grid = document.querySelector(gridSelector);
  if (!grid) return;

  if (!products?.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;padding:40px 0;text-align:center;color:var(--text-muted);">
        <span><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 6h13l3 6v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-6z"/></svg></span>
        <p style="margin-top:8px;">No items found</p>
      </div>`;
    return;
  }

  grid.innerHTML = products.map((p, i) => buildProductCard(p, i < 4)).join('');

  /* CSP-clean image fallback (replaces the old inline onerror) */
  grid.querySelectorAll('img[data-fallback-img]').forEach((img) => {
    img.addEventListener('error', () => {
      img.style.display = 'none';
      const ph = img.nextElementSibling;
      if (ph) ph.style.display = 'flex';
    });
  });
}

/* ── FILTERS ───────────────────────────────── */
export function filterByGender(products, gender) {
  if (!gender || gender === 'all') return products;
  return products.filter(p => p.gender === gender || p.gender === 'unisex');
}

export function filterFeatured(products) {
  return products.filter(p => p.featured === true);
}

export function filterByCollectionType(products, type) {
  if (!type || type === 'all') return products;
  return products.filter(p => p.collection_type === type);
}

export function filterBySize(products, sizes) {
  if (!sizes?.length) return products;
  return products.filter(p => {
    const pSize = p.size || (Array.isArray(p.sizes) ? p.sizes[0] : '') || '';
    return sizes.includes(pSize);
  });
}

export function filterByPrice(products, min, max) {
  return products.filter(p => p.price >= min && p.price <= max);
}

export function searchProducts(products, query) {
  if (!query?.trim()) return products;
  const q = query.toLowerCase().trim();
  return products.filter(p => [
    p.name,
    p.brand,
    p.collection_type,
    p.category,
    p.description,
    p.material,
    p.gender,
    ...(p.style  || []),
    ...(p.colors || []),
  ].filter(Boolean).some(v => v.toLowerCase().includes(q)));
}

export function sortProducts(products, sortBy) {
  const arr = [...products];
  switch (sortBy) {
    case 'price-asc':  return arr.sort((a, b) => a.price - b.price);
    case 'price-desc': return arr.sort((a, b) => b.price - a.price);
    case 'saving':     return arr.sort((a, b) =>
      (1 - b.price / b.originalPrice) - (1 - a.price / a.originalPrice)
    );
    default: return arr;
  }
}

export function getProductById(products, id) {
  return products.find(p => String(p.id) === String(id)) || null;
}

export function getRelatedProducts(products, product, limit = 4) {
  return products
    .filter(p => p.id !== product.id && p.gender === product.gender)
    .slice(0, limit);
}

/* ── COLLECTION TYPES ──────────────────────── */
export function getCollectionTypes(products) {
  const types = [...new Set(products.map(p => p.collection_type).filter(Boolean))];
  return types.sort();
}

/* ── BADGE ── */
export function badgeToCssClass(badge) {
  if (!badge) return "";
  const map = { "new":"badge-new","new arrival":"badge-new","trending":"badge-hot","best seller":"badge-hot","limited":"badge-rare","minimal":"badge-rare" };
  return map[badge.toLowerCase()] || "badge-new";
}