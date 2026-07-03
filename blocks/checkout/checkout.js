/*
 * blocks/checkout/checkout.js
 *
 * 3-step checkout (Delivery -> Payment -> Confirm), converted from the
 * original page script into an EDS block.
 *
 * What changed for EDS / CSP:
 *  - No DOMContentLoaded: decorate(block) already runs at the right time.
 *  - The block builds its own progress bar + main region (the page just
 *    needs an empty `checkout` block placeholder).
 *  - ALL inline onclick="" handlers and window.* globals are gone —
 *    replaced with addEventListener / event delegation (strict CSP blocks
 *    inline handlers).
 *  - Inline style="" attributes moved into checkout.css classes.
 *  - requireAuth imported from /scripts (shared module).
 *
 * Note: the pincode lookup calls api.postalpincode.in — under a strict EDS
 * CSP you'll need to add that host to connect-src, or it will be blocked.
 * GSAP is used only if present (window.gsap); it degrades gracefully.
 */

import { requireAuth, cartKey } from '../../scripts/auth-guard.js';

const DEFAULTS = {
  'login path': '/login',
  'cart path': '/cart',
  'home path': '/',
  'orders path': '/orders',
  'free threshold': '999',
  'delivery fee': '99',
  'express fee': '199',
  'promo code': 'REWEAR10',
};

function readConfig(block) {
  const cfg = { ...DEFAULTS };
  block.querySelectorAll(':scope > div').forEach((row) => {
    const cells = row.querySelectorAll(':scope > div');
    if (cells.length >= 2) {
      const key = cells[0].textContent.trim().toLowerCase();
      const val = cells[1].textContent.trim();
      if (key) cfg[key] = val;
    }
  });
  return cfg;
}

let CFG = { ...DEFAULTS };

const USER_KEY = 'rewear_user';

const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN');

let currentStep = 1;
let orderData = { address: {}, delivery: 'standard', payment: 'upi' };
let mainEl = null; // the .checkout-main region inside the block

/* ── cart helpers ── */
function getCart() {
  try { return JSON.parse(localStorage.getItem(cartKey())) || []; }
  catch { return []; }
}
function getSubtotal() {
  return getCart().reduce((s, i) => s + i.price * (i.qty || 1), 0);
}
function deliveryCost() {
  const free = Number(CFG['free threshold']) || 999;
  const fee = Number(CFG['delivery fee']) || 99;
  const exp = Number(CFG['express fee']) || 199;
  return orderData.delivery === 'express' ? exp : (getSubtotal() >= free ? 0 : fee);
}

/* ── field validation helpers ── */
function setCkErr(el, msg) {
  const field = el?.closest('.checkout-field'); if (!field) return;
  field.classList.add('has-error');
  let e = field.querySelector('.checkout-err');
  if (!e) { e = document.createElement('span'); e.className = 'checkout-err'; field.appendChild(e); }
  e.textContent = msg;
}
function clearCkErr(el) {
  const field = el?.closest('.checkout-field'); if (!field) return;
  field.classList.remove('has-error');
  const e = field.querySelector('.checkout-err'); if (e) e.textContent = '';
}

/* ══════════════════════════ RENDER ══════════════════════════ */
function renderStep(step) {
  currentStep = step;
  updateProgressBar(step);

  if (step === 1) renderDelivery();
  if (step === 2) renderPayment();
  if (step === 3) renderConfirmed();

  if (window.gsap) {
    window.gsap.from('.checkout-form-section, .checkout-confirmed', {
      y: 20, opacity: 0, duration: 0.4, ease: 'power2.out',
    });
  }
}

function updateProgressBar(step) {
  mainEl.closest('.checkout').querySelectorAll('.checkout-step').forEach((el, i) => {
    el.classList.remove('active', 'done');
    if (i + 1 === step) el.classList.add('active');
    if (i + 1 < step) el.classList.add('done');
  });
}

const STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'];

/* ── STEP 1: DELIVERY ── */
function renderDelivery() {
  const user = JSON.parse(localStorage.getItem(USER_KEY));
  const cart = getCart();

  mainEl.innerHTML = `
    <div class="checkout-form-section">
      <h2 class="checkout-section-title">Delivery Address</h2>

      <form class="checkout-form" id="deliveryForm" novalidate>
        <div class="checkout-row">
          <div class="checkout-field">
            <label for="firstName">First Name *</label>
            <input type="text" id="firstName" placeholder="First name" required value="${user?.firstName || ''}">
          </div>
          <div class="checkout-field">
            <label for="lastName">Last Name *</label>
            <input type="text" id="lastName" placeholder="Last name" value="${user?.lastName || ''}">
          </div>
        </div>

        <div class="checkout-field">
          <label for="phone">Phone Number *</label>
          <input type="tel" id="phone" placeholder="+91 XXXXX XXXXX" required>
        </div>

        <div class="checkout-field">
          <label for="address1">Address Line 1 *</label>
          <input type="text" id="address1" placeholder="House/Flat no, Building, Street" required>
        </div>

        <div class="checkout-field">
          <label for="address2">Address Line 2</label>
          <input type="text" id="address2" placeholder="Area, Locality (optional)">
        </div>

        <div class="checkout-row">
          <div class="checkout-field">
            <label for="city">City *</label>
            <input type="text" id="city" placeholder="City" required>
          </div>
          <div class="checkout-field">
            <label for="pincode">PIN Code *</label>
            <input type="text" id="pincode" placeholder="6-digit PIN" maxlength="6" required inputmode="numeric">
            <span class="pin-status" id="pinStatus"></span>
          </div>
        </div>

        <div class="checkout-row">
          <div class="checkout-field">
            <label for="state">State *</label>
            <select id="state" required>
              <option value="">Select state</option>
              ${STATES.map((s) => `<option value="${s}">${s}</option>`).join('')}
            </select>
          </div>
          <div class="checkout-field">
            <label for="addressType">Address Type</label>
            <select id="addressType">
              <option value="home">Home</option>
              <option value="work">Work</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div class="checkout-delivery-block">
          <p class="checkout-field-heading">Delivery Option</p>
          <div class="delivery-options">
            <label class="delivery-option selected" id="optStandard">
              <input type="radio" name="delivery" value="standard" checked>
              <div class="delivery-option-info">
                <p class="delivery-option-name">Standard Delivery</p>
                <p class="delivery-option-desc">5–7 business days</p>
              </div>
              <span class="delivery-option-price" id="stdPrice">${getSubtotal() >= (Number(CFG['free threshold'])||999) ? 'Free' : '₹'+(Number(CFG['delivery fee'])||99)}</span>
            </label>
            <label class="delivery-option" id="optExpress">
              <input type="radio" name="delivery" value="express">
              <div class="delivery-option-info">
                <p class="delivery-option-name">Express Delivery</p>
                <p class="delivery-option-desc">2–3 business days</p>
              </div>
              <span class="delivery-option-price">₹${Number(CFG['express fee'])||199}</span>
            </label>
          </div>
        </div>

        <button type="submit" class="btn btn-primary checkout-continue">Continue to Payment →</button>
      </form>
    </div>

    ${buildSummaryHTML(cart)}
  `;

  /* Delivery option toggle */
  mainEl.querySelectorAll('[name="delivery"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      orderData.delivery = radio.value;
      mainEl.querySelectorAll('.delivery-option').forEach((o) => o.classList.remove('selected'));
      radio.closest('.delivery-option').classList.add('selected');
    });
  });

  /* numeric restrictions + pincode auto-lookup */
  const pinEl = mainEl.querySelector('#pincode');
  let pinTimer;
  pinEl.addEventListener('input', () => {
    pinEl.value = pinEl.value.replace(/\D/g, '').slice(0, 6);
    clearCkErr(pinEl);
    const ps = mainEl.querySelector('#pinStatus');
    if (ps) { ps.textContent = ''; ps.className = 'pin-status'; }
    clearTimeout(pinTimer);
    if (pinEl.value.length === 6) {
      if (ps) { ps.textContent = 'Looking up…'; ps.className = 'pin-status loading'; }
      pinTimer = setTimeout(() => lookupPincode(pinEl.value), 350);
    }
  });
  const phEl = mainEl.querySelector('#phone');
  phEl.addEventListener('input', () => { phEl.value = phEl.value.replace(/[^\d+\s]/g, ''); clearCkErr(phEl); });
  ['firstName', 'lastName', 'address1', 'city', 'state'].forEach((id) => {
    const el = mainEl.querySelector(`#${id}`);
    el?.addEventListener('input', () => clearCkErr(el));
    el?.addEventListener('change', () => clearCkErr(el));
  });

  /* submit -> validate -> step 2 */
  mainEl.querySelector('#deliveryForm').addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true; let firstBad = null;
    const fail = (id, msg) => { const el = mainEl.querySelector(`#${id}`); setCkErr(el, msg); if (!firstBad) firstBad = el; ok = false; };

    const fn = mainEl.querySelector('#firstName').value.trim();
    const phRaw = mainEl.querySelector('#phone').value.replace(/\D/g, '');
    const a1 = mainEl.querySelector('#address1').value.trim();
    const city = mainEl.querySelector('#city').value.trim();
    const pinV = mainEl.querySelector('#pincode').value.trim();
    const st = mainEl.querySelector('#state').value;

    if (!fn) fail('firstName', 'First name is required.');
    if (!phRaw) fail('phone', 'Phone number is required.');
    else if (phRaw.length < 10) fail('phone', 'Enter a valid 10-digit phone number.');
    if (!a1) fail('address1', 'Address is required.');
    if (!city) fail('city', 'City is required.');
    if (!pinV) fail('pincode', 'PIN code is required.');
    else if (!/^\d{6}$/.test(pinV)) fail('pincode', 'PIN code must be exactly 6 digits.');
    if (!st) fail('state', 'Please select a state.');

    if (!ok) { firstBad?.scrollIntoView({ behavior: 'smooth', block: 'center' }); firstBad?.focus({ preventScroll: true }); return; }

    orderData.address = {
      firstName: mainEl.querySelector('#firstName').value,
      lastName: mainEl.querySelector('#lastName').value,
      phone: mainEl.querySelector('#phone').value,
      address1: mainEl.querySelector('#address1').value,
      address2: mainEl.querySelector('#address2').value,
      city: mainEl.querySelector('#city').value,
      pincode: mainEl.querySelector('#pincode').value,
      state: mainEl.querySelector('#state').value,
      type: mainEl.querySelector('#addressType').value,
    };
    renderStep(2);
  });
}

/* ── STEP 2: PAYMENT ── */
function renderPayment() {
  const cart = getCart();
  const total = getSubtotal() + deliveryCost();

  mainEl.innerHTML = `
    <div class="checkout-form-section">
      <h2 class="checkout-section-title">Payment Method</h2>

      <div class="payment-options">
        <div class="payment-method">
          <label class="payment-option selected" data-method="upi">
            <input type="radio" name="payment" value="upi" checked>
            <span class="payment-option-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2" width="10" height="20" rx="2"/><line x1="11" y1="18" x2="13" y2="18"/></svg></span>
            <div>
              <p class="payment-option-label">UPI</p>
              <p class="payment-option-desc">Google Pay, PhonePe, Paytm, BHIM</p>
            </div>
          </label>
          <div class="payment-detail">
            <p class="pay-detail-label">Choose an app</p>
            <div class="upi-apps">
              <button type="button" class="upi-app selected" data-app="Google Pay"><span class="upi-dot upi-dot-gpay"></span>Google Pay</button>
              <button type="button" class="upi-app" data-app="PhonePe"><span class="upi-dot upi-dot-phonepe"></span>PhonePe</button>
              <button type="button" class="upi-app" data-app="Paytm"><span class="upi-dot upi-dot-paytm"></span>Paytm</button>
              <button type="button" class="upi-app" data-app="BHIM"><span class="upi-dot upi-dot-bhim"></span>BHIM</button>
            </div>
            <p class="pay-detail-label">Or pay using UPI ID</p>
            <input type="text" class="pay-input" id="upiId" placeholder="yourname@upi" autocomplete="off">
          </div>
        </div>

        <div class="payment-method">
          <label class="payment-option" data-method="card">
            <input type="radio" name="payment" value="card">
            <span class="payment-option-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg></span>
            <div>
              <p class="payment-option-label">Credit / Debit Card</p>
              <p class="payment-option-desc">Visa, Mastercard, RuPay</p>
            </div>
          </label>
          <div class="payment-detail">
            <input class="pay-input" id="cardNumber" placeholder="Card number" inputmode="numeric" maxlength="19" autocomplete="off">
            <input class="pay-input" id="cardName" placeholder="Name on card" autocomplete="off">
            <div class="pay-row">
              <input class="pay-input" id="cardExpiry" placeholder="MM / YY" maxlength="7" inputmode="numeric" autocomplete="off">
              <input class="pay-input" id="cardCvv" placeholder="CVV" type="password" inputmode="numeric" maxlength="3" autocomplete="off">
            </div>
          </div>
        </div>

        <div class="payment-method">
          <label class="payment-option" data-method="cod">
            <input type="radio" name="payment" value="cod">
            <span class="payment-option-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg></span>
            <div>
              <p class="payment-option-label">Cash on Delivery</p>
              <p class="payment-option-desc">Pay when your order arrives</p>
            </div>
          </label>
          <div class="payment-detail">
            <p class="pay-cod-note">Pay in cash when your order is delivered. Please keep exact change handy for a smooth handover.</p>
          </div>
        </div>

        <div class="payment-method">
          <label class="payment-option" data-method="netbanking">
            <input type="radio" name="payment" value="netbanking">
            <span class="payment-option-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10l9-6 9 6"/><path d="M4 10v9h16v-9"/><line x1="9" y1="14" x2="9" y2="19"/><line x1="15" y1="14" x2="15" y2="19"/></svg></span>
            <div>
              <p class="payment-option-label">Net Banking</p>
              <p class="payment-option-desc">All major banks supported</p>
            </div>
          </label>
          <div class="payment-detail">
            <div class="bank-chips">
              <button type="button" class="bank-chip" data-bank="HDFC Bank">HDFC</button>
              <button type="button" class="bank-chip" data-bank="State Bank of India">SBI</button>
              <button type="button" class="bank-chip" data-bank="ICICI Bank">ICICI</button>
              <button type="button" class="bank-chip" data-bank="Axis Bank">Axis</button>
            </div>
            <select class="pay-input" id="bankSelect">
              <option value="">Select your bank</option>
              <option>HDFC Bank</option><option>State Bank of India</option><option>ICICI Bank</option>
              <option>Axis Bank</option><option>Kotak Mahindra Bank</option><option>Punjab National Bank</option>
              <option>Bank of Baroda</option><option>Yes Bank</option><option>IDFC First Bank</option>
            </select>
          </div>
        </div>
      </div>

      <div class="checkout-secure-note">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        Your payment information is encrypted and secure. This is a demo store.
      </div>

      <div class="checkout-actions">
        <button type="button" class="btn btn-secondary checkout-back">← Back</button>
        <button type="button" class="btn btn-primary checkout-place">Place Order · ${fmt(total)}</button>
      </div>
    </div>

    ${buildSummaryHTML(cart)}
  `;

  /* payment method select (was inline onclick="selectPayment(...)") */
  mainEl.querySelectorAll('.payment-option').forEach((opt) => {
    opt.addEventListener('click', () => {
      orderData.payment = opt.dataset.method;
      mainEl.querySelectorAll('.payment-option').forEach((o) => o.classList.remove('selected'));
      opt.classList.add('selected');
    });
  });

  /* nav buttons (were inline onclick) */
  mainEl.querySelector('.checkout-back').addEventListener('click', () => renderStep(1));
  mainEl.querySelector('.checkout-place').addEventListener('click', () => renderStep(3));

  setupPaymentUI();
}

function setupPaymentUI() {
  mainEl.querySelectorAll('.upi-app').forEach((chip) => {
    chip.addEventListener('click', () => {
      mainEl.querySelectorAll('.upi-app').forEach((c) => c.classList.remove('selected'));
      chip.classList.add('selected');
      const upiId = mainEl.querySelector('#upiId');
      if (upiId) upiId.value = '';
    });
  });
  const upiId = mainEl.querySelector('#upiId');
  if (upiId) upiId.addEventListener('input', () => {
    if (upiId.value.trim()) mainEl.querySelectorAll('.upi-app').forEach((c) => c.classList.remove('selected'));
  });

  mainEl.querySelectorAll('.bank-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      mainEl.querySelectorAll('.bank-chip').forEach((c) => c.classList.remove('selected'));
      chip.classList.add('selected');
      const sel = mainEl.querySelector('#bankSelect');
      if (sel) sel.value = chip.dataset.bank;
    });
  });
  const bankSel = mainEl.querySelector('#bankSelect');
  if (bankSel) bankSel.addEventListener('change', () => {
    mainEl.querySelectorAll('.bank-chip').forEach((c) => c.classList.toggle('selected', c.dataset.bank === bankSel.value));
  });

  const cn = mainEl.querySelector('#cardNumber');
  if (cn) cn.addEventListener('input', () => {
    const v = cn.value.replace(/\D/g, '').slice(0, 16);
    cn.value = v.replace(/(.{4})/g, '$1 ').trim();
  });
  const ex = mainEl.querySelector('#cardExpiry');
  if (ex) ex.addEventListener('input', () => {
    let v = ex.value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) v = v.slice(0, 2) + ' / ' + v.slice(2);
    ex.value = v;
  });
  const cv = mainEl.querySelector('#cardCvv');
  if (cv) cv.addEventListener('input', () => { cv.value = cv.value.replace(/\D/g, '').slice(0, 3); });
}

/* ── STEP 3: CONFIRMED ── */
function renderConfirmed() {
  const orderId = 'RW' + Date.now().toString().slice(-8).toUpperCase();
  const cartItems = getCart();
  const subtotalC = getSubtotal();
  const deliveryC = deliveryCost();

  try {
    const u = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
    const orders = JSON.parse(localStorage.getItem('rewear_orders') || '[]');
    orders.push({
      id: orderId,
      date: new Date().toISOString(),
      items: cartItems.map((i) => ({ id: i.id, name: i.name, image: i.image || '', size: i.size || '', qty: i.qty || 1, price: i.price, brand: i.brand || '' })),
      subtotal: subtotalC, deliveryCost: deliveryC, total: subtotalC + deliveryC,
      deliveryMethod: orderData.delivery, address: orderData.address,
      status: 'Processing', userEmail: u.email || '', userId: u.id || '',
    });
    localStorage.setItem('rewear_orders', JSON.stringify(orders));

    /* one-of-a-kind: mark purchased items as sold */
    const sold = JSON.parse(localStorage.getItem('rewear_sold') || '[]').map(String);
    cartItems.forEach((i) => { if (!sold.includes(String(i.id))) sold.push(String(i.id)); });
    localStorage.setItem('rewear_sold', JSON.stringify(sold));
  } catch (e) { /* ignore */ }

  localStorage.removeItem(cartKey());

  const a = orderData.address;
  mainEl.innerHTML = `
    <div class="checkout-confirmed">
      <div class="confirmed-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12.5l2.5 2.5L16 9"/></svg></div>
      <h2 class="confirmed-title">Order Placed!</h2>
      <p class="confirmed-copy">Thank you for shopping with RE:WEAR. Your order has been placed successfully.</p>
      <div class="confirmed-id">Order ID: ${orderId}</div>
      <div class="confirmed-address-card">
        <p class="confirmed-address-label">Delivering to:</p>
        <p class="confirmed-address">
          ${a.firstName} ${a.lastName}<br>
          ${a.address1}, ${a.city}<br>
          ${a.state} — ${a.pincode}
        </p>
      </div>
      <p class="confirmed-eta">${orderData.delivery === 'express' ? 'Estimated delivery: 2–3 business days' : 'Estimated delivery: 5–7 business days'}</p>
      <div class="confirmed-actions">
        <a href="${CFG['home path']}" class="btn btn-primary">Continue Shopping</a>
        <a href="${CFG['orders path']}" class="btn btn-secondary">My Orders</a>
      </div>
    </div>
  `;

  if (window.gsap) {
    window.gsap.from('.confirmed-icon', { scale: 0, duration: 0.5, ease: 'back.out(1.7)', delay: 0.2 });
    window.gsap.from('.confirmed-title', { y: 20, opacity: 0, duration: 0.4, delay: 0.4 });
  }

  const badge = document.querySelector('.cart-badge');
  if (badge) { badge.textContent = ''; badge.classList.add('is-hidden'); }
}

/* ── order summary (shared by steps 1 & 2) ── */
function buildSummaryHTML(cart) {
  const subtotal = getSubtotal();
  const delivery = deliveryCost();
  const total = subtotal + delivery;

  return `
    <div class="checkout-summary">
      <h3 class="checkout-summary-title">Order Summary (${cart.length} item${cart.length !== 1 ? 's' : ''})</h3>
      <div class="checkout-items">
        ${cart.map((item) => `
          <div class="checkout-item">
            <div class="checkout-item-img">
              ${item.image ? `<img src="${item.image}" alt="${item.name}">` : '<div class="checkout-item-placeholder"></div>'}
            </div>
            <div class="checkout-item-info">
              <p class="checkout-item-name">${item.name}</p>
              <p class="checkout-item-meta">Size: ${item.size || '—'} · Qty: ${item.qty || 1}</p>
            </div>
            <span class="checkout-item-price">${fmt(item.price * (item.qty || 1))}</span>
          </div>
        `).join('')}
      </div>
      <div class="checkout-summary-rows">
        <div class="checkout-summary-row"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
        <div class="checkout-summary-row">
          <span>Delivery</span>
          <span>${delivery === 0 ? '<span class="free-label">Free</span>' : fmt(delivery)}</span>
        </div>
        <div class="checkout-summary-row total"><span>Total</span><span>${fmt(total)}</span></div>
      </div>
    </div>
  `;
}

/* ── pincode -> city + state (India Post public API) ── */
async function lookupPincode(pin) {
  const ps = mainEl.querySelector('#pinStatus');
  const cityEl = mainEl.querySelector('#city');
  const stateEl = mainEl.querySelector('#state');
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
    const data = await res.json();
    const rec = Array.isArray(data) ? data[0] : null;

    if (!rec || rec.Status !== 'Success' || !rec.PostOffice || !rec.PostOffice.length) {
      if (ps) { ps.textContent = "Couldn't find this PIN — please enter city & state manually"; ps.className = 'pin-status error'; }
      return;
    }
    const po = rec.PostOffice[0];
    const cityName = po.District || po.Division || po.Region || '';
    const stName = po.State || '';

    if (cityEl && cityName) { cityEl.value = cityName; clearCkErr(cityEl); }
    if (stateEl && stName) {
      const norm = stName.trim().toLowerCase();
      const alias = { orissa: 'odisha', pondicherry: 'puducherry', 'nct of delhi': 'delhi' };
      const want = alias[norm] || norm;
      const match = [...stateEl.options].find((o) => o.value.toLowerCase() === want);
      if (match) { stateEl.value = match.value; clearCkErr(stateEl); }
    }
    if (ps) { ps.textContent = `✓ ${cityName}, ${stName}`; ps.className = 'pin-status ok'; }
  } catch (e) {
    if (ps) { ps.textContent = 'Lookup failed — please enter city & state manually'; ps.className = 'pin-status error'; }
  }
}

/* ══════════════════════════ ENTRY ══════════════════════════ */
export default function decorate(block) {
  CFG = readConfig(block);
  // Guard: must be logged in and have a non-empty cart.
  if (!requireAuth(CFG['login path'])) return;
  if (!getCart().length) { window.location.href = CFG['cart path']; return; }

  block.innerHTML = `
    <div class="checkout-progress">
      <div class="container">
        <div class="checkout-steps">
          <div class="checkout-step active" id="step1"><span class="step-num">1</span><span class="step-label">Delivery</span></div>
          <div class="checkout-step-line"></div>
          <div class="checkout-step" id="step2"><span class="step-num">2</span><span class="step-label">Payment</span></div>
          <div class="checkout-step-line"></div>
          <div class="checkout-step" id="step3"><span class="step-num">3</span><span class="step-label">Confirm</span></div>
        </div>
      </div>
    </div>
    <div class="checkout-main container" id="checkoutMain"></div>
  `;

  mainEl = block.querySelector('#checkoutMain');
  currentStep = 1;
  orderData = { address: {}, delivery: 'standard', payment: 'upi' };
  renderStep(1);
}