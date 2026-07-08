/*
 * blocks/info/info.js
 *
 * ONE reusable block that replaces two former informational pages —
 * `faq` and `how-it-works` — using EDS variations.
 *
 * Author each on its doc by putting the variation in the block name:
 *
 *   | Info (faq) |        |            |                     |
 *   | Kicker  | Help Centre |          |                     |
 *   | Title   | Frequently Asked Questions | |                |
 *   | FAQ | Buying | How do I know the condition? | Every listing... |
 *   ...
 *
 *   | Info (how-it-works) |     |     |     |     |     |     |
 *   | Eyebrow | Simple & Transparent | | | | | |
 *   | Step | buyer | 01 | Discover Finds | Browse... | Browse Now → | /browse |
 *   ...
 *
 * EDS turns "Info (faq)" into class="info faq" and
 * "Info (how-it-works)" into class="info how-it-works", so we read the
 * variation from the block's classList and render the right page.
 */

/* ═══════════════════════════ FAQ ═══════════════════════════ */

const FAQ_DEFAULTS = {
  'kicker': 'Help Centre',
  'title': 'Frequently Asked Questions',
  'subtitle': 'Everything you need to know about buying and selling pre-loved fashion on RE:WEAR.',
  'contact text': 'Still have a question?',
  'contact cta': 'Contact us',
  'contact path': '/contact',
};

const FAQ_FALLBACK = [
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

const FAQ_CHEV = '<svg class="faq-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>';

function parseFaq(block) {
  const cfg = { ...FAQ_DEFAULTS };
  const items = [];
  block.querySelectorAll(':scope > div').forEach((row) => {
    const plain = [...row.querySelectorAll(':scope > div')].map((c) => c.textContent.trim());
    if (!plain.length) return;
    if (plain[0].toLowerCase() === 'faq') items.push([plain[1] || 'General', plain[2] || '', plain[3] || '']);
    else if (plain.length >= 2 && plain[0]) cfg[plain[0].toLowerCase()] = plain[1];
  });
  return { cfg, items: items.length ? items : FAQ_FALLBACK };
}

function renderFaq(block) {
  const { cfg, items } = parseFaq(block);

  const tParts = cfg['title'].split(' ');
  const tLast = tParts.pop();
  const tHead = tParts.join(' ');

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
        <h1 class="faq-title">${tHead} <em>${tLast}</em></h1>
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
                  ${FAQ_CHEV}
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

/* ═══════════════════════ HOW IT WORKS ═══════════════════════ */

const HIW_DEFAULTS = {
  'eyebrow': 'Simple & Transparent',
  'title': 'How RE:WEAR Works',
  'subtitle': 'Buy pre-loved fashion or sell what you no longer wear — in just a few steps.',
  'buyer label': 'I want to Buy',
  'seller label': 'I want to Sell',
  'browse path': '/browse',
  'sell path': '/sell',
  'cta title': 'Ready to get started?',
  'cta text': 'Join the RE:WEAR community today',
  'cta browse text': 'Browse Finds',
  'cta sell text': 'Start Selling',
};

const HIW_STEP_ICONS = {
  buyer: [
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="20 6 9 17 4 12"/></svg>',
  ],
  seller: [
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  ],
};

const HIW_TOGGLE_ICON = {
  buyer: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
  seller: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
};

const HIW_ARROW = '<svg class="hiw-step-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>';

const HIW_FALLBACK_STEPS = {
  buyer: [
    ['01', 'Discover Finds', 'Browse hundreds of curated pre-loved pieces. Filter by size, price, category, or condition. Every item is quality-checked before going live.', 'Browse Now →', '/browse'],
    ['02', 'Save & Shortlist', "Heart items you love to save them to your Wishlist. Come back anytime — they'll be waiting. Add to bag when you're ready to buy.", 'Start Shopping →', '/browse'],
    ['03', 'Checkout Easily', 'Enter your delivery address. Choose UPI, card, or cash on delivery. Your order is packed and delivered in 5–7 business days.', '', ''],
    ['04', 'Enjoy & Repeat', 'Receive your order, style it your way, and come back for more. Every purchase is one less garment in a landfill.', '', ''],
  ],
  seller: [
    ['01', 'Create Account', 'Sign up free and head to your profile. Click "Become a Seller" and fill a quick onboarding form — name, city, and UPI ID. Done in under 2 minutes.', 'Sign Up Free →', '/login'],
    ['02', 'List Your Item', 'Upload at least 3 clear photos — front, back, and a detail shot. Add name, description, price, size, and condition. Our form makes it easy.', 'Start Selling →', '/sell'],
    ['03', 'Admin Reviews', "Our team reviews every submission within 24 hours to ensure it meets quality standards. You'll see the status update live in your Seller Dashboard.", '', ''],
    ['04', 'Earn Money', 'Item goes live on RE:WEAR once approved. When it sells, earnings are transferred directly to your UPI ID. Track everything from your dashboard.', '', ''],
  ],
};

const HIW_PROMISES = [
  ['<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="20 6 9 17 4 12"/></svg>', 'Quality Checked', 'Every item reviewed before going live'],
  ['<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>', 'Easy Returns', '7-day return window guaranteed'],
  ['<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>', 'Secure Payment', 'All transactions encrypted'],
  ['<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>', 'Fast Delivery', '5–7 business days to your door'],
];

function parseHiw(block) {
  const cfg = { ...HIW_DEFAULTS };
  const steps = { buyer: [], seller: [] };
  block.querySelectorAll(':scope > div').forEach((row) => {
    const plain = [...row.querySelectorAll(':scope > div')].map((c) => c.textContent.trim());
    if (!plain.length) return;
    if (plain[0].toLowerCase() === 'step') {
      const group = (plain[1] || 'buyer').toLowerCase() === 'seller' ? 'seller' : 'buyer';
      steps[group].push([plain[2] || '', plain[3] || '', plain[4] || '', plain[5] || '', plain[6] || '']);
    } else if (plain.length >= 2 && plain[0]) {
      cfg[plain[0].toLowerCase()] = plain[1];
    }
  });
  if (!steps.buyer.length) steps.buyer = HIW_FALLBACK_STEPS.buyer;
  if (!steps.seller.length) steps.seller = HIW_FALLBACK_STEPS.seller;
  return { cfg, steps };
}

function hiwFlowHTML(group, steps, hidden) {
  const icons = HIW_STEP_ICONS[group] || HIW_STEP_ICONS.buyer;
  return `
    <div class="hiw-flow${hidden ? ' is-hidden' : ''}" data-flow="${group}">
      <div class="hiw-steps-interactive">
        ${steps.map(([num, title, body, ctaText, ctaHref], i) => `
          <div class="hiw-step-item${i === 0 ? ' active' : ''}" data-step>
            <div class="hiw-step-left">
              <div class="hiw-step-circle">${icons[i % icons.length]}</div>
              ${i < steps.length - 1 ? '<div class="hiw-step-line"></div>' : ''}
            </div>
            <div class="hiw-step-right">
              <div class="hiw-step-header">
                <span class="hiw-step-num">Step ${num}</span>
                <h3 class="hiw-step-title">${title}</h3>
                ${HIW_ARROW}
              </div>
              <div class="hiw-step-body">
                <p>${body}</p>
                ${ctaText && ctaHref ? `<a href="${ctaHref}" class="hiw-step-cta">${ctaText}</a>` : ''}
              </div>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}

function renderHowItWorks(block) {
  const { cfg, steps } = parseHiw(block);

  const parts = cfg['title'].split(' ');
  const last = parts.pop();
  const head = parts.join(' ');

  block.innerHTML = `
    <section class="hiw-hero">
      <div class="container">
        <p class="hiw-eyebrow">${cfg['eyebrow']}</p>
        <h1 class="hiw-hero-title">${head} <em>${last}</em></h1>
        <p class="hiw-hero-sub">${cfg['subtitle']}</p>
      </div>
    </section>

    <section class="hiw-steps">
      <div class="container">
        <div class="hiw-toggle">
          <button class="hiw-toggle-btn active" data-tab="buyer">${HIW_TOGGLE_ICON.buyer} ${cfg['buyer label']}</button>
          <button class="hiw-toggle-btn" data-tab="seller">${HIW_TOGGLE_ICON.seller} ${cfg['seller label']}</button>
        </div>
        ${hiwFlowHTML('buyer', steps.buyer, false)}
        ${hiwFlowHTML('seller', steps.seller, true)}
      </div>
    </section>

    <section class="hiw-promise">
      <div class="container">
        <div class="hiw-promises">
          ${HIW_PROMISES.map(([icon, title, text]) => `
            <div class="hiw-promise-card">
              <div class="hiw-promise-icon">${icon}</div>
              <h4>${title}</h4>
              <p>${text}</p>
            </div>`).join('')}
        </div>
      </div>
    </section>

    <section class="hiw-cta">
      <div class="container">
        <div class="hiw-cta-inner">
          <h2 class="hiw-cta-title">${cfg['cta title']}</h2>
          <p class="hiw-cta-sub">${cfg['cta text']}</p>
          <div class="hiw-cta-btns">
            <a href="${cfg['browse path']}" class="btn btn-primary">${cfg['cta browse text']}</a>
            <a href="${cfg['sell path']}" class="btn btn-secondary">${cfg['cta sell text']}</a>
          </div>
        </div>
      </div>
    </section>`;

  const flows = block.querySelectorAll('.hiw-flow');
  block.querySelectorAll('.hiw-toggle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      block.querySelectorAll('.hiw-toggle-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      flows.forEach((f) => f.classList.toggle('is-hidden', f.dataset.flow !== btn.dataset.tab));
    });
  });

  block.querySelectorAll('.hiw-steps-interactive').forEach((container) => {
    container.addEventListener('click', (e) => {
      if (e.target.closest('.hiw-step-cta')) return;
      const item = e.target.closest('[data-step]');
      if (!item) return;
      const wasActive = item.classList.contains('active');
      container.querySelectorAll('.hiw-step-item').forEach((it) => it.classList.remove('active'));
      if (!wasActive) item.classList.add('active');
    });
  });
}

/* ═══════════════════════════ DISPATCH ═══════════════════════════ */

export default function decorate(block) {
  // "Info (how-it-works)" → class="info how-it-works"; "Info (faq)" → class="info faq".
  const isHiw = block.classList.contains('how-it-works')
    || block.classList.contains('hiw')
    || block.classList.contains('guide');
  if (isHiw) renderHowItWorks(block);
  else renderFaq(block);
}