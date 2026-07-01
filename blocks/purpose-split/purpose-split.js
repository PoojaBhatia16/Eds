/*
 * blocks/purpose-split/purpose-split.js
 *
 * Robust version: works whether the author put each line in its own paragraph
 * OR mashed them into one paragraph with line breaks. It identifies parts by
 * ROLE, not position:
 *   - the link  -> CTA button
 *   - the bold run (<strong>/<b>) -> title
 *   - the first short line -> eyebrow
 *   - the longest remaining line -> body text
 */

function textLines(cell) {
  // Split on <br> and block boundaries so soft line-breaks become separate lines.
  const html = cell.innerHTML
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h\d)>/gi, '\n');
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent.split('\n').map((s) => s.trim()).filter(Boolean);
}

function buildCard(cell, variant) {
  const link = cell.querySelector('a');
  const strong = cell.querySelector('strong, b');
  const title = strong ? strong.textContent.trim() : '';

  let lines = textLines(cell);
  const ctaText = link ? link.textContent.trim() : '';
  lines = lines.filter((l) => l && l !== ctaText);

  const withoutTitle = lines.filter((l) => l !== title);
  const eyebrow = withoutTitle[0] || '';
  const body = withoutTitle.slice(1).sort((a, b) => b.length - a.length)[0] || '';

  const card = document.createElement('div');
  card.className = `purpose-card purpose-card--${variant}`;
  card.innerHTML = `
    <p class="purpose-eyebrow">${eyebrow}</p>
    <h3 class="purpose-title">${title || eyebrow}</h3>
    <p class="purpose-sub">${body}</p>
    ${link ? `<a href="${link.getAttribute('href')}" class="btn btn-accent purpose-btn">${ctaText}</a>` : ''}
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