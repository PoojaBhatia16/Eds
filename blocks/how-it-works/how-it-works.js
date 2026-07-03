/*
 * blocks/how-it-works/how-it-works.js — How It Works (CONFIG-DRIVEN, HerbAtlas-style)
 * Faithful port: hero + buyer/seller toggle + step accordion (icon+line+cta) + promises + cta.
 * No GSAP. CSP-clean (event delegation).
 *
 * Row types:
 *   CONFIG (2 cells):  key | value
 *   STEP   (7 cells):  Step | buyer|seller | Number | Title | Body | CTA Text | CTA Href
 *
 * Author on `how-it-works` doc — see comment table below.
 */

const DEFAULTS = {
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

/* step circle icons, indexed per group step position */
const STEP_ICONS = {
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

const TOGGLE_ICON = {
  buyer: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
  seller: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
};

const ARROW = '<svg class="hiw-step-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>';

const FALLBACK_STEPS = {
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

const PROMISES = [
  ['<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="20 6 9 17 4 12"/></svg>', 'Quality Checked', 'Every item reviewed before going live'],
  ['<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>', 'Easy Returns', '7-day return window guaranteed'],
  ['<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>', 'Secure Payment', 'All transactions encrypted'],
  ['<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>', 'Fast Delivery', '5–7 business days to your door'],
];

function parseBlock(block) {
  const cfg = { ...DEFAULTS };
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
  if (!steps.buyer.length) steps.buyer = FALLBACK_STEPS.buyer;
  if (!steps.seller.length) steps.seller = FALLBACK_STEPS.seller;
  return { cfg, steps };
}

function flowHTML(group, steps, hidden) {
  const icons = STEP_ICONS[group] || STEP_ICONS.buyer;
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
                ${ARROW}
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

export default function decorate(block) {
  const { cfg, steps } = parseBlock(block);

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
          <button class="hiw-toggle-btn active" data-tab="buyer">${TOGGLE_ICON.buyer} ${cfg['buyer label']}</button>
          <button class="hiw-toggle-btn" data-tab="seller">${TOGGLE_ICON.seller} ${cfg['seller label']}</button>
        </div>
        ${flowHTML('buyer', steps.buyer, false)}
        ${flowHTML('seller', steps.seller, true)}
      </div>
    </section>

    <section class="hiw-promise">
      <div class="container">
        <div class="hiw-promises">
          ${PROMISES.map(([icon, title, text]) => `
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
      if (e.target.closest('.hiw-step-cta')) return; // let CTA links work
      const item = e.target.closest('[data-step]');
      if (!item) return;
      const wasActive = item.classList.contains('active');
      container.querySelectorAll('.hiw-step-item').forEach((it) => it.classList.remove('active'));
      if (!wasActive) item.classList.add('active');
    });
  });
}