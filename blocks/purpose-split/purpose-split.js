/*
 * blocks/purpose-split/purpose-split.js
 *
 * Authored as a 2x2 table:
 *   | Purpose Split |                        |
 *   | For Buyers                             | For Sellers                            |
 *   | **Discover Pre-Loved Fashion**         | **Turn Your Wardrobe Into Cash**       |
 *   | Curated vintage, thrift ...            | List your pre-loved pieces ...         |
 *   | [Browse Finds →](/browse)              | [Start Selling →](/sell)               |
 *
 * (Each cell holds its lines as separate paragraphs.)
 * decorate() reshapes the two cells into the buy/sell cards with the "or" divider.
 */

function buildCard(cell, variant) {
  const paras = [...cell.querySelectorAll('p')];
  const link = cell.querySelector('a');

  const eyebrow = paras[0]?.textContent.trim() || '';
  const title = paras[1]?.textContent.trim() || '';
  // sub = first paragraph after the title that isn't the link
  const sub = paras.slice(2).find((p) => !p.querySelector('a'))?.textContent.trim() || '';

  const card = document.createElement('div');
  card.className = `purpose-card purpose-card--${variant}`;
  card.innerHTML = `
    <p class="purpose-eyebrow">${eyebrow}</p>
    <h3 class="purpose-title">${title}</h3>
    <p class="purpose-sub">${sub}</p>
    ${link ? `<a href="${link.getAttribute('href')}" class="btn btn-accent purpose-btn">${link.textContent.trim()}</a>` : ''}
  `;
  return card;
}

export default function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const buyCell = cells[0];
  const sellCell = cells[1];
  block.textContent = '';

  const wrap = document.createElement('div');
  wrap.className = 'purpose-split';

  if (buyCell) wrap.append(buildCard(buyCell, 'buy'));

  const divider = document.createElement('div');
  divider.className = 'purpose-divider';
  divider.innerHTML = '<span>or</span>';
  wrap.append(divider);

  if (sellCell) wrap.append(buildCard(sellCell, 'sell'));

  block.append(wrap);
}