/*
 * blocks/cards/cards.js — dispatcher
 *
 * ONE `cards` block with two variations, chosen by the block name in the doc:
 *
 *   | Cards (products) |      |     →  full browse experience
 *   | Cards |             or          →  curated collection tiles (default)
 *   | Cards (collections) |
 *
 * The heavy logic lives in two sibling modules, loaded on demand:
 *   - cards-products.js     : browse grid + filter bar + banner (was `product-grid`)
 *   - cards-collections.js  : curated collection tiles (was `discover`)
 *
 * For the products variation we also add the legacy `product-grid` class to the
 * block, so all the existing `.product-grid …` styles keep matching unchanged.
 */

export default async function decorate(block) {
  if (block.classList.contains('products')) {
    block.classList.add('product-grid');
    const { default: renderProducts } = await import('./cards-products.js');
    await renderProducts(block);
  } else {
    const { default: renderCollections } = await import('./cards-collections.js');
    await renderCollections(block);
  }
}