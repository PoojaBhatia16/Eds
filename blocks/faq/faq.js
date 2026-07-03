/*
 * blocks/faq/faq.js — FAQ page (CONFIG-DRIVEN, HerbAtlas-style)
 * Hero + grouped accordion. No GSAP. CSP-clean (event delegation).
 *
 * Row types:
 *   CONFIG (2 cells):  key | value
 *   FAQ    (4 cells):  FAQ | group | question | answer
 *
 * Author on the `faq` doc — each Q&A is one row; "group" buckets them into sections:
 *
 *   | FAQ |            |               |                       |
 *   | Kicker           | Help Centre |             |          |
 *   | Title            | Frequently Asked Questions | |       |
 *   | Subtitle         | Everything you need to know... |  |  |
 *   | Contact Text     | Still have a question? |     |       |
 *   | Contact Path     | /contact |                  |       |
 *   | FAQ | Buying  | How do I know the condition of an item? | Every listing has a condition rating... |
 *   | FAQ | Buying  | Are the items authentic?                | Yes. Every item is reviewed...          |
 *   | FAQ | Selling | How do I start selling on RE:WEAR?      | Create an account, head to Sell Items...|
 *   ... add / reorder rows freely; rows sharing a "group" render under one heading.
 */

const DEFAULTS = {
  'kicker': 'Help Centre',
  'title': 'Frequently Asked Questions',
  'subtitle': 'Everything you need to know about buying and selling pre-loved fashion on RE:WEAR.',
  'contact text': 'Still have a question?',
  'contact cta': 'Contact us',
  'contact path': '/contact',
};

const FALLBACK = [
  ['Buying', 'How do I know the condition of an item?', 'Every listing has a condition rating — Excellent, Good or Fair — along with photos showing the front, back and close-up details. Our team reviews each listing before it goes live, so what you see is what you get.'],
  ['Buying', 'Are the items authentic and quality-checked?', "Yes. Every item is reviewed by our team for quality and an accurate description before it's approved and listed on the marketplace."],
  ['Buying', 'How do sizes work for second-hand pieces?', 'Each listing shows the size of that specific piece — since every item is a single, pre-loved garment, sellers list it in the one size it actually is. We recommend checking any measurements in the description for the best fit.'],
  ['Buying', 'Can I return an item?', "Because these are one-of-a-kind pre-loved pieces, returns are limited. If an item arrives noticeably different from its description, reach out within 48 hours and we'll help make it right."],
  ['Selling', 'How do I start selling on RE:WEAR?', 'Create an account, head to Sell Items, and complete a quick seller profile. Then list your pieces with photos and details — it only takes a few minutes.'],
  ['Selling', 'What can I sell?', 'Pre-loved clothing in good, wearable condition — dresses, tops, shirts, jackets, co-ords, ethnic wear and accessories. Clean, clearly-photographed items get approved fastest.'],
  ['Selling', 'How are my listings approved?', "After you submit a listing, our team reviews it — usually within 24 hours — to check quality and accuracy before it goes live. You can track each listing's status in your seller dashboard."],
  ['Orders & Delivery', 'How can I track my order?', "You'll find all your orders and their current status under Orders in your profile."],
  ['Orders & Delivery', 'What are the delivery charges?', 'Standard delivery is free on orders over ₹999; otherwise a small flat fee applies. An express option with a faster timeline is available at checkout for an added charge.'],
  ['Account', 'Do I need an account to browse?', 'No — you can browse the full marketplace freely. An account is only needed when you want to add items to your cart or wishlist, buy, or sell.'],
  ['Account', 'Is my information safe?', "We only store what's needed to run your account and orders. Your details are never sold or shared for advertising."],
];

const CHEV = '<svg class="faq-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>';

function parseBlock(block) {
  const cfg = { ...DEFAULTS };
  const items = [];
  block.querySelectorAll(':scope > div').forEach((row) => {
    const plain = [...row.querySelectorAll(':scope > div')].map((c) => c.textContent.trim());
    if (!plain.length) return;
    if (plain[0].toLowerCase() === 'faq') items.push([plain[1] || 'General', plain[2] || '', plain[3] || '']);
    else if (plain.length >= 2 && plain[0]) cfg[plain[0].toLowerCase()] = plain[1];
  });
  return { cfg, items: items.length ? items : FALLBACK };
}

export default function decorate(block) {
  const { cfg, items } = parseBlock(block);

  // group items by their group name, preserving first-seen order
  const order = [];
  const groups = {};
  items.forEach(([group, q, a]) => {
    if (!groups[group]) { groups[group] = []; order.push(group); }
    groups[group].push([q, a]);
  });

  block.innerHTML = `
    <section class="faq-hero">
      <div class="container">
        <p class="faq-kicker">${cfg['kicker']}</p>
        <h1 class="faq-title">${cfg['title']}</h1>
        <p class="faq-sub">${cfg['subtitle']}</p>
      </div>
    </section>

    <section class="faq-body">
      <div class="container">
        ${order.map((group) => `
          <div class="faq-group">
            <h2 class="faq-group-title">${group}</h2>
            ${groups[group].map(([q, a]) => `
              <div class="faq-item">
                <button class="faq-q" type="button">
                  <span>${q}</span>
                  ${CHEV}
                </button>
                <div class="faq-a"><p>${a}</p></div>
              </div>`).join('')}
          </div>`).join('')}

        <div class="faq-contact">
          <p>${cfg['contact text']}</p>
          <a href="${cfg['contact path']}" class="btn btn-primary">${cfg['contact cta']}</a>
        </div>
      </div>
    </section>`;

  // accordion (event delegation, CSP-clean)
  block.querySelectorAll('.faq-group').forEach((group) => {
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('.faq-q');
      if (!btn) return;
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      group.querySelectorAll('.faq-item').forEach((i) => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}