/*
 * blocks/contact/contact.js — Contact page (CONFIG-DRIVEN, HerbAtlas-style)
 * Hero + validated contact form + side info cards. No GSAP. CSP-clean (no <form>, no inline).
 *
 * Row types:
 *   CONFIG (2 cells):  key | value
 *   CARD   (4 cells):  Card | title | line1 | line2
 *   TOPIC  (2 cells):  Topic | Order help      (subject dropdown option)
 *
 * Author on the `contact` doc:
 *
 *   | Contact |         |
 *   | Kicker           | Get in Touch |
 *   | Title            | We'd love to hear from you |
 *   | Subtitle         | Questions about an order, selling, or just want to say hello?... |
 *   | Submit Text      | Send Message |
 *   | Success Text     | Thanks for reaching out — we'll be in touch soon. |
 *   | Card | Reach us directly | hello@rewear.com | Bhopal, India |
 *   | Card | Quick answers     | Many questions are answered on our FAQ and How It Works pages. | |
 *   | Card | Response time     | We typically reply within 1–2 business days, Monday to Friday. | |
 *   | Topic | Order help |
 *   | Topic | Selling on RE:WEAR |
 *   | Topic | Returns & delivery |
 *   | Topic | Account |
 *   | Topic | Something else |
 */

const DEFAULTS = {
  'kicker': 'Get in Touch',
  'title': "We'd love to hear from you",
  'subtitle': "Questions about an order, selling, or just want to say hello? Send us a note and we'll get back to you within 1–2 business days.",
  'submit text': 'Send Message',
  'success text': "Thanks for reaching out — we'll be in touch soon.",
};

const FALLBACK_CARDS = [
  ['Reach us directly', 'hello@rewear.com', 'Bhopal, India'],
  ['Quick answers', 'Many questions are answered on our FAQ and How It Works pages.', ''],
  ['Response time', 'We typically reply within 1–2 business days, Monday to Friday.', ''],
];
const FALLBACK_TOPICS = ['Order help', 'Selling on RE:WEAR', 'Returns & delivery', 'Account', 'Something else'];

function parseBlock(block) {
  const cfg = { ...DEFAULTS };
  const cards = [];
  const topics = [];
  block.querySelectorAll(':scope > div').forEach((row) => {
    const plain = [...row.querySelectorAll(':scope > div')].map((c) => c.textContent.trim());
    if (!plain.length) return;
    const first = plain[0].toLowerCase();
    if (first === 'card') cards.push([plain[1] || '', plain[2] || '', plain[3] || '']);
    else if (first === 'topic') { if (plain[1]) topics.push(plain[1]); }
    else if (plain.length >= 2 && plain[0]) cfg[first] = plain[1];
  });
  return {
    cfg,
    cards: cards.length ? cards : FALLBACK_CARDS,
    topics: topics.length ? topics : FALLBACK_TOPICS,
  };
}

export default function decorate(block) {
  const { cfg, cards, topics } = parseBlock(block);

  block.innerHTML = `
    <section class="contact-hero">
      <div class="container">
        <p class="contact-kicker">${cfg['kicker']}</p>
        <h1 class="contact-title">${cfg['title']}</h1>
        <p class="contact-sub">${cfg['subtitle']}</p>
      </div>
    </section>

    <section class="contact-body">
      <div class="container contact-wrap">
        <div class="contact-form" id="contactForm">
          <div class="contact-field">
            <label for="cName">Name</label>
            <input type="text" id="cName" placeholder="Your name">
          </div>
          <div class="contact-field">
            <label for="cEmail">Email</label>
            <input type="email" id="cEmail" placeholder="you@example.com">
          </div>
          <div class="contact-field">
            <label for="cSubject">Subject</label>
            <select id="cSubject">
              <option value="">Select a topic</option>
              ${topics.map((t) => `<option value="${t}">${t}</option>`).join('')}
            </select>
          </div>
          <div class="contact-field">
            <label for="cMessage">Message</label>
            <textarea id="cMessage" placeholder="How can we help?"></textarea>
          </div>
          <button type="button" class="btn btn-primary contact-submit" id="contactSubmit">${cfg['submit text']}</button>
          <p class="contact-success" id="contactSuccess" hidden>${cfg['success text']}</p>
        </div>

        <aside class="contact-side">
          ${cards.map(([title, l1, l2]) => `
            <div class="contact-card">
              <h3>${title}</h3>
              ${l1 ? `<p class="contact-line">${l1}</p>` : ''}
              ${l2 ? `<p class="contact-line">${l2}</p>` : ''}
            </div>`).join('')}
        </aside>
      </div>
    </section>`;

  /* validation */
  const $ = (id) => block.querySelector('#' + id);
  const setErr = (el, msg) => {
    const field = el.closest('.contact-field');
    field?.classList.add('has-error');
    let e = field?.querySelector('.contact-err');
    if (!e && field) { e = document.createElement('span'); e.className = 'contact-err'; field.appendChild(e); }
    if (e) e.textContent = msg;
  };
  const clearErr = (el) => {
    const field = el.closest('.contact-field');
    field?.classList.remove('has-error');
    const e = field?.querySelector('.contact-err'); if (e) e.textContent = '';
  };

  ['cName', 'cEmail', 'cSubject', 'cMessage'].forEach((id) => {
    const el = $(id);
    el?.addEventListener('input', () => clearErr(el));
    el?.addEventListener('change', () => clearErr(el));
  });

  $('contactSubmit')?.addEventListener('click', () => {
    let ok = true, firstBad = null;
    const fail = (el, msg) => { setErr(el, msg); if (!firstBad) firstBad = el; ok = false; };
    const name = $('cName'), email = $('cEmail'), msg = $('cMessage');

    if (!name.value.trim()) fail(name, 'Please enter your name.');
    if (!email.value.trim()) fail(email, 'Please enter your email.');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) fail(email, 'Enter a valid email address.');
    if (!msg.value.trim()) fail(msg, 'Please write a message.');

    if (!ok) { firstBad?.scrollIntoView({ behavior: 'smooth', block: 'center' }); firstBad?.focus({ preventScroll: true }); return; }

    // No backend — demo success confirmation.
    ['cName', 'cEmail', 'cSubject', 'cMessage'].forEach((id) => { const el = $(id); if (el) el.value = ''; });
    const success = $('contactSuccess');
    if (success) { success.hidden = false; success.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  });
}
