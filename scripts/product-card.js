/*
 * scripts/product-card.js
 *
 * Single source of truth for the product-card SKELETON shared by the browse
 * grid (`product-grid`) and the wishlist view (`account` → wishlist variation).
 * Previously this markup was copy-pasted in both places.
 *
 * The skeleton owns the parts that are identical everywhere:
 *   <article.product-card> → .product-card-img (sold overlay + img + heart slot)
 *                          → .product-card-body (brand + name + pricing + footer slot)
 *
 * Everything that differs between the two views is passed in as an HTML "slot":
 *   - wishlistButton : the heart button markup (empty ♡ on grid, filled/remove on wishlist)
 *   - footer         : size/condition on grid, add-to-bag on wishlist
 *   - imgAttrs       : e.g. 'width="600" height="800" loading="eager"'
 *   - savingHtml     : the "-NN%" badge (grid only)
 *
 * `esc` defaults to identity so callers that never escaped (product-grid) get
 * byte-identical output; callers that want escaping (wishlist) pass their esc.
 */

export function buildProductCard(p, {
  sold = false,
  soldLabel = 'Sold Out',
  imgAttrs = 'loading="lazy"',
  imgClass = '',
  wishlistButton = '',
  showBrand = true,
  savingHtml = '',
  footer = '',
  fmt = (n) => n,
  esc = (s) => (s == null ? '' : s),
} = {}) {
  const brandText = p.brand?.split('·')[0]?.trim() || '';
  const brand = showBrand ? `<p class="product-brand">${esc(brandText)}</p>` : '';
  const imgClassAttr = imgClass ? ` class="${imgClass}"` : '';
  const img = p.images?.[0]
    ? `<img src="${p.images[0]}" alt="${esc(p.name)}"${imgClassAttr} ${imgAttrs}>`
    : '<div class="img-placeholder"></div>';

  return `
        <article class="product-card${sold ? ' is-sold' : ''}" data-id="${p.id}" role="link" aria-label="${esc(p.name)}">
          <div class="product-card-img">
            ${sold ? `<div class="sold-overlay"><span>${esc(soldLabel)}</span></div>` : ''}
            ${img}
            ${wishlistButton}
          </div>
          <div class="product-card-body">
            ${brand}
            <p class="product-name">${esc(p.name)}</p>
            <div class="product-pricing">
              <span class="product-price">${fmt(p.price)}</span>
              ${p.originalPrice ? `<span class="product-orig">${fmt(p.originalPrice)}</span>` : ''}
              ${savingHtml}
            </div>
            ${footer}
          </div>
        </article>`;
}