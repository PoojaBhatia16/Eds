/*
 * blocks/sell/sell.js — Seller onboarding + dashboard + add-product
 * Ported from sell.js (603 lines). No GSAP. Already CSP-clean (all addEventListener).
 * Author empty block on `sell` doc:  | Sell |
 *
 * localStorage: rewear_pending_products, rewear_seller_profile,
 *   rewear_approved_products, rewear_rejected_products
 */

import { requireAuth, getCurrentUser, upgradeToSeller } from '../../scripts/auth-guard.js';

const PENDING_KEY = 'rewear_pending_products';
const SELLER_KEY = 'rewear_seller_profile';
const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN');

const ICON = {
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V4M8 8l4-4 4 4"/><path d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9"/></svg>',
  coin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M14.5 9.2c-.5-.8-1.4-1.2-2.5-1.2-1.7 0-2.7.9-2.7 2s1 1.8 2.7 2 2.7.9 2.7 2-1 2-2.7 2c-1.1 0-2-.5-2.5-1.2"/><path d="M12 6.5v11"/></svg>',
  leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 014 13C4 7 9 4 20 4c0 11-4 16-9 16z"/><path d="M5 19c3.5-4 7.5-6 11-7"/></svg>',
  box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/></svg>',
  image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5L5 20"/></svg>',
  bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7a3 3 0 016 0"/></svg>',
};

const IMG_SLOTS = [
  { key: 'front', label: 'Front view', required: true },
  { key: 'back', label: 'Back view', required: true },
  { key: 'detail', label: 'Detail shot', required: true },
  { key: 'tag', label: 'Brand / care tag', required: false },
  { key: 'flaw', label: 'Any imperfection', required: false },
  { key: 'extra', label: 'Styled / extra', required: false },
];

export default function decorate(block) {
  if (!requireAuth('/login')) return;
  block.innerHTML = '<div class="container sell-container"><div id="sellMain"></div></div>';
  const main = block.querySelector('#sellMain');
  let slotImages = {};

  const user = getCurrentUser();
  if (!user.isSeller && user.role !== 'seller' && user.role !== 'admin') renderOnboarding();
  else renderDashboard();

  /* ── validation helpers (scoped to block) ── */
  const fieldOf = (id) => main.querySelector('#' + id)?.closest('.form-field');
  function setError(id, msg) {
    const f = fieldOf(id); if (!f) return;
    f.classList.add('has-error');
    let e = f.querySelector('.field-error');
    if (!e) { e = document.createElement('span'); e.className = 'field-error'; f.appendChild(e); }
    e.textContent = msg;
  }
  function clearError(id) {
    const f = fieldOf(id); if (!f) return;
    f.classList.remove('has-error');
    const e = f.querySelector('.field-error'); if (e) e.textContent = '';
  }
  function autoClear(ids) {
    ids.forEach((id) => {
      const el = main.querySelector('#' + id);
      el?.addEventListener('input', () => clearError(id));
      el?.addEventListener('change', () => clearError(id));
    });
  }
  function focusFirstError() {
    const first = main.querySelector('.form-field.has-error input, .form-field.has-error select, .form-field.has-error textarea');
    if (first) { first.scrollIntoView({ behavior: 'smooth', block: 'center' }); first.focus({ preventScroll: true }); }
  }

  /* ── ONBOARDING ── */
  function renderOnboarding() {
    const perks = [
      [ICON.coin, 'Earn money', 'Get paid for items sitting in your wardrobe.'],
      [ICON.leaf, 'Be sustainable', 'Extend the life of clothing and reduce waste.'],
      [ICON.box, 'Easy listing', 'Upload photos and fill a simple form.'],
      [ICON.shield, 'Quality review', 'Our team reviews every listing for trust.'],
    ];
    main.innerHTML = `
      <div class="onboarding-wrap">
        <div class="onboarding-header">
          <div class="onboarding-icon">${ICON.bag}</div>
          <h1 class="onboarding-title">Start Selling on RE:WEAR</h1>
          <p class="onboarding-sub">Join our community of conscious sellers. List your pre-loved pieces and give them a second life.</p>
        </div>
        <div class="onboarding-perks">
          ${perks.map(([icon, h, p]) => `<div class="onboarding-perk"><span class="onboarding-perk-icon">${icon}</span><div class="onboarding-perk-text"><h4>${h}</h4><p>${p}</p></div></div>`).join('')}
        </div>
        <div class="onboarding-form">
          <h2>Tell us about yourself</h2>
          <form class="sell-form" id="onboardingForm" novalidate>
            <div class="sell-form-row">
              <div class="form-field"><label for="sellerName">Full Name *</label><input type="text" id="sellerName" placeholder="Your full name" value="${user.name || ''}"></div>
              <div class="form-field"><label for="sellerEmail">Email</label><input type="email" id="sellerEmail" value="${user.email || ''}" readonly class="input-readonly"><span class="form-hint">From your account</span></div>
            </div>
            <div class="sell-form-row">
              <div class="form-field"><label for="sellerPhone">Phone Number *</label><input type="tel" id="sellerPhone" placeholder="+91 XXXXX XXXXX"></div>
              <div class="form-field"><label for="sellerCity">City *</label><input type="text" id="sellerCity" placeholder="Your city"></div>
            </div>
            <div class="form-field"><label for="sellerUpi">UPI ID <span class="label-soft">(optional)</span></label><input type="text" id="sellerUpi" placeholder="yourname@upi"><span class="form-hint">For receiving payments</span></div>
            <div class="form-field"><label for="sellerWhy">Why do you want to sell on RE:WEAR? <span class="label-soft">(optional)</span></label><textarea id="sellerWhy" placeholder="Tell us your story..."></textarea></div>
            <button type="submit" class="btn btn-primary sell-submit-btn">Become a Seller</button>
          </form>
        </div>
      </div>`;
    autoClear(['sellerName', 'sellerPhone', 'sellerCity']);
    main.querySelector('#onboardingForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = main.querySelector('#sellerName').value.trim();
      const phone = main.querySelector('#sellerPhone').value.trim();
      const city = main.querySelector('#sellerCity').value.trim();
      let ok = true;
      if (name.length < 2) { setError('sellerName', 'Please enter your full name.'); ok = false; }
      const digits = phone.replace(/\D/g, '');
      if (!phone) { setError('sellerPhone', 'Phone number is required.'); ok = false; }
      else if (digits.length < 10) { setError('sellerPhone', 'Enter a valid phone number (min 10 digits).'); ok = false; }
      if (!city) { setError('sellerCity', 'City is required.'); ok = false; }
      if (!ok) { focusFirstError(); return; }
      localStorage.setItem(SELLER_KEY, JSON.stringify({
        name, email: user.email || '', phone, city,
        upi: main.querySelector('#sellerUpi').value.trim(),
        why: main.querySelector('#sellerWhy').value.trim(),
        joinedAt: new Date().toISOString(),
      }));
      upgradeToSeller();
      renderDashboard();
    });
  }

  /* ── DASHBOARD ── */
  function renderDashboard(tab = 'listings') {
    const mine = getMyListings();
    const total = mine.length;
    const approved = mine.filter((p) => p.status === 'approved').length;
    const pend = mine.filter((p) => p.status === 'pending').length;
    const rejected = mine.filter((p) => p.status === 'rejected').length;
    main.innerHTML = `
      <div class="dashboard-header">
        <div><h1 class="dashboard-title">Seller Dashboard</h1><p class="dashboard-welcome">Welcome back, ${user.firstName || user.name}</p></div>
        <button class="btn btn-primary" id="addProductBtn">+ Add Product</button>
      </div>
      <div class="dashboard-stats">
        <div class="dashboard-stat"><span class="dashboard-stat-num">${total}</span><span class="dashboard-stat-label">Total Listed</span></div>
        <div class="dashboard-stat"><span class="dashboard-stat-num stat-green">${approved}</span><span class="dashboard-stat-label">Approved</span></div>
        <div class="dashboard-stat"><span class="dashboard-stat-num stat-amber">${pend}</span><span class="dashboard-stat-label">Pending</span></div>
        <div class="dashboard-stat"><span class="dashboard-stat-num stat-red">${rejected}</span><span class="dashboard-stat-label">Rejected</span></div>
      </div>
      <div class="dashboard-tabs">
        <button class="dashboard-tab ${tab === 'listings' ? 'active' : ''}" data-tab="listings">My Listings</button>
        <button class="dashboard-tab ${tab === 'earnings' ? 'active' : ''}" data-tab="earnings">Earnings</button>
      </div>
      <div id="dashboardContent"></div>`;
    main.querySelector('#addProductBtn').addEventListener('click', renderAddProduct);
    main.querySelectorAll('.dashboard-tab').forEach((btn) => btn.addEventListener('click', () => {
      main.querySelectorAll('.dashboard-tab').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderDashboardTab(btn.dataset.tab);
    }));
    renderDashboardTab(tab);
  }

  function renderDashboardTab(tab) {
    const content = main.querySelector('#dashboardContent');
    if (tab === 'listings') renderListings(content);
    if (tab === 'earnings') renderEarnings(content);
  }

  function renderListings(container) {
    const listings = getMyListings();
    if (!listings.length) {
      container.innerHTML = `<div class="dashboard-empty"><span class="dashboard-empty-icon">${ICON.box}</span><h3>No listings yet</h3><p>Add your first product to get started.</p></div>`;
      return;
    }
    const statusText = (s) => s === 'approved' ? 'Approved' : s === 'rejected' ? 'Rejected' : 'Pending review';
    const buildTimeline = (status, stage) => {
      const labels = ['Submitted', 'Picked up', 'At warehouse', 'Under review', status === 'rejected' ? 'Not approved' : 'Live on store'];
      const stageIdx = { submitted: 0, picked: 1, warehouse: 2 };
      let doneUpto = 0, activeIdx = -1, rejected = false, allDone = false;
      if (status === 'approved') allDone = true;
      else if (status === 'rejected') { doneUpto = 3; rejected = true; }
      else { const si = stageIdx[stage || 'submitted'] ?? 0; doneUpto = si; activeIdx = si + 1; }
      const checkSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
      const xSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>';
      return `<div class="listing-timeline ${status || 'pending'}">${labels.map((label, i) => {
        let cls;
        if (allDone) cls = 'done';
        else if (rejected) cls = i < 4 ? 'done' : 'rejected';
        else cls = i <= doneUpto ? 'done' : (i === activeIdx ? 'active' : 'todo');
        return `<div class="lt-step ${cls}"><span class="lt-dot">${cls === 'done' ? checkSvg : cls === 'rejected' ? xSvg : ''}</span><span class="lt-label">${label}</span></div>`;
      }).join('')}</div>`;
    };
    container.innerHTML = `<div class="listings-grid">${listings.map((p) => `
      <div class="listing-card">
        <div class="listing-card-img">${p.images?.[0] ? `<img src="${p.images[0]}" alt="${p.name}">` : `<div class="listing-noimg">${ICON.image}</div>`}</div>
        <div>
          <p class="listing-card-name">${p.name}</p>
          <div class="listing-card-meta"><span>${fmt(p.price)}</span><span>${p.gender}</span><span>${p.collection_type}</span><span>ID: ${p.id}</span></div>
          <span class="listing-status ${p.status || 'pending'}">${statusText(p.status)}</span>
          ${p.status === 'rejected' && p.rejectionReason ? `<p class="listing-reject-reason"><strong>Why:</strong> ${p.rejectionReason}</p>` : ''}
        </div>
        <div class="listing-card-date">${new Date(p.submittedAt).toLocaleDateString('en-IN')}</div>
        ${buildTimeline(p.status, p.stage)}
      </div>`).join('')}</div>`;
  }

  function renderEarnings(container) {
    const approved = getMyListings().filter((p) => p.status === 'approved');
    const potential = approved.reduce((s, p) => s + p.price, 0);
    container.innerHTML = `
      <div class="earnings-card">
        <h3 class="earnings-title">Earnings Overview</h3>
        <div class="earnings-grid">
          <div class="earnings-stat"><span class="earnings-num stat-green">${fmt(0)}</span><span class="earnings-label">Total Earned</span></div>
          <div class="earnings-stat"><span class="earnings-num">${fmt(potential)}</span><span class="earnings-label">Potential (live)</span></div>
          <div class="earnings-stat"><span class="earnings-num">${approved.length}</span><span class="earnings-label">Live Products</span></div>
        </div>
        <p class="earnings-note">Checkout and payment integration coming soon. Earnings will reflect actual sales.</p>
      </div>`;
  }

  /* ── ADD PRODUCT ── */
  function renderAddProduct() {
    const id = `SELL-${Date.now()}`;
    slotImages = {};
    main.innerHTML = `
      <div class="add-product-wrap">
        <div class="add-product-head"><button class="btn btn-secondary" id="backToDashboard">← Back</button><h1 class="add-product-title">Add New Product</h1></div>
        <form class="sell-form" id="addProductForm" novalidate>
          <div class="form-field" id="imagesField">
            <label>Product Photos <span class="label-soft">— each view in its own slot</span></label>
            <p class="img-slots-help">Front, back and a detail shot are required. Clear photos get approved faster.</p>
            <div class="img-slots">
              ${IMG_SLOTS.map((s) => `
                <div class="img-slot${s.required ? ' is-required' : ''}" data-key="${s.key}">
                  <input type="file" accept="image/*" class="img-slot-input" id="slot_${s.key}" hidden>
                  <label for="slot_${s.key}" class="img-slot-empty"><span class="img-slot-ico">${ICON.upload}</span><span class="img-slot-name">${s.label}${s.required ? ' *' : ''}</span><span class="img-slot-tier">${s.required ? 'Required' : 'Optional'}</span></label>
                  <div class="img-slot-filled" hidden><img alt="${s.label}"><span class="img-slot-tag">${s.label}</span><button type="button" class="img-slot-remove" aria-label="Remove photo">×</button></div>
                </div>`).join('')}
            </div>
            <span class="field-error" id="imagesError"></span>
          </div>
          <div class="sell-form-row">
            <div class="form-field"><label for="productName">Product Name *</label><input type="text" id="productName" placeholder="e.g. Floral Wrap Midi Dress"></div>
            <div class="form-field"><label for="productBrand">Brand / Label <span class="label-soft">(optional)</span></label><input type="text" id="productBrand" placeholder="e.g. Zara, H&M, Handmade"></div>
          </div>
          <div class="form-field"><label for="productDesc">Description *</label><textarea id="productDesc" placeholder="Describe the item — fabric, fit, styling notes, any flaws..."></textarea></div>
          <div class="sell-form-row">
            <div class="form-field"><label for="productPrice">Your Price (₹) *</label><input type="number" id="productPrice" placeholder="e.g. 1200" min="1"></div>
            <div class="form-field"><label for="productOriginal">Original Price (₹) <span class="label-soft">(optional)</span></label><input type="number" id="productOriginal" placeholder="e.g. 3500" min="1"><span class="form-hint">What it originally cost — shows discount %</span></div>
          </div>
          <div class="sell-form-row">
            <div class="form-field"><label for="productGender">Gender *</label><select id="productGender"><option value="">Select gender</option><option value="women">Women</option><option value="men">Men</option><option value="kids">Kids</option><option value="unisex">Unisex</option></select></div>
            <div class="form-field"><label for="productCollection">Category *</label><select id="productCollection"><option value="">Select category</option><option value="dresses">Dresses</option><option value="tops">Tops</option><option value="shirts">Shirts</option><option value="jackets">Jackets</option><option value="trousers">Trousers</option><option value="co-ords">Co-ords</option><option value="ethnic">Ethnic wear</option><option value="accessories">Accessories</option><option value="other">Other</option></select></div>
          </div>
          <div class="sell-form-row">
            <div class="form-field"><label for="productCondition">Condition *</label><select id="productCondition"><option value="">Select condition</option><option value="Excellent">Excellent — like new, no flaws</option><option value="Good">Good — minor wear, no damage</option><option value="Fair">Fair — visible wear, priced accordingly</option></select></div>
            <div class="form-field"><label for="productMaterial">Material <span class="label-soft">(optional)</span></label><input type="text" id="productMaterial" placeholder="e.g. 100% Cotton, Silk Blend"></div>
          </div>
          <div class="form-field" id="sizesField">
            <label>Size *</label>
            <div class="size-chips-wrap" id="sizeChips">${['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'].map((s) => `<button type="button" class="size-chip-sel" data-size="${s}">${s}</button>`).join('')}</div>
            <span class="field-error" id="sizesError"></span>
          </div>
          <div class="sell-form-row">
            <div class="form-field"><label for="productColors">Colours <span class="label-soft">(optional)</span></label><input type="text" id="productColors" placeholder="e.g. Red, Ivory (comma separated)"></div>
            <div class="form-field"><label for="productStyle">Style Tags <span class="label-soft">(optional)</span></label><input type="text" id="productStyle" placeholder="e.g. Minimal, Vintage, Streetwear"><span class="form-hint">Comma separated — helps buyers find your item</span></div>
          </div>
          <div class="sell-submit-row"><button type="submit" class="btn btn-primary sell-submit-btn">Submit for Review</button><span class="sell-auto-id">Product ID: <strong>${id}</strong> (auto-assigned)</span></div>
        </form>
      </div>`;
    main.querySelector('#backToDashboard').addEventListener('click', () => renderDashboard());
    initImageSlots();
    autoClear(['productName', 'productDesc', 'productPrice', 'productOriginal', 'productGender', 'productCollection', 'productCondition']);
    main.querySelectorAll('.size-chip-sel').forEach((chip) => chip.addEventListener('click', () => {
      main.querySelectorAll('.size-chip-sel').forEach((c) => c.classList.remove('selected'));
      chip.classList.add('selected');
      main.querySelector('#sizesField')?.classList.remove('has-error');
      const e = main.querySelector('#sizesError'); if (e) e.textContent = '';
    }));
    main.querySelector('#addProductForm').addEventListener('submit', (e) => { e.preventDefault(); submitProduct(id); });
  }

  function resizeImageFile(file, maxDim, cb) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const image = new Image();
      image.onload = () => {
        let { width, height } = image;
        if (width > height && width > maxDim) { height = Math.round(height * maxDim / width); width = maxDim; }
        else if (height >= width && height > maxDim) { width = Math.round(width * maxDim / height); height = maxDim; }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(image, 0, 0, width, height);
        cb(canvas.toDataURL('image/jpeg', 0.8));
      };
      image.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function initImageSlots() {
    IMG_SLOTS.forEach((s) => {
      const wrap = main.querySelector(`.img-slot[data-key="${s.key}"]`);
      const input = wrap.querySelector('.img-slot-input');
      const empty = wrap.querySelector('.img-slot-empty');
      const fill = wrap.querySelector('.img-slot-filled');
      const img = fill.querySelector('img');
      input.addEventListener('change', () => {
        const file = input.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;
        resizeImageFile(file, 1000, (dataUrl) => {
          slotImages[s.key] = dataUrl;
          img.src = dataUrl;
          empty.hidden = true; fill.hidden = false;
          wrap.classList.add('filled');
          main.querySelector('#imagesField')?.classList.remove('has-error');
          const e = main.querySelector('#imagesError'); if (e) e.textContent = '';
        });
      });
      fill.querySelector('.img-slot-remove').addEventListener('click', () => {
        delete slotImages[s.key];
        input.value = ''; img.src = '';
        empty.hidden = false; fill.hidden = true;
        wrap.classList.remove('filled');
      });
    });
  }

  function submitProduct(id) {
    const val = (i) => main.querySelector('#' + i).value.trim();
    const name = val('productName'), brand = val('productBrand'), desc = val('productDesc');
    const price = parseFloat(main.querySelector('#productPrice').value);
    const original = parseFloat(main.querySelector('#productOriginal').value) || null;
    const gender = main.querySelector('#productGender').value;
    const collection = main.querySelector('#productCollection').value;
    const condition = main.querySelector('#productCondition').value;
    const material = val('productMaterial');
    const size = main.querySelector('.size-chip-sel.selected')?.dataset.size || '';

    let ok = true;
    if (name.length < 3) { setError('productName', 'Product name must be at least 3 characters.'); ok = false; }
    if (desc.length < 10) { setError('productDesc', 'Add a description (at least 10 characters).'); ok = false; }
    if (!price || price <= 0) { setError('productPrice', 'Enter a valid price.'); ok = false; }
    if (original && original <= price) { setError('productOriginal', 'Original price should be higher than your price.'); ok = false; }
    if (!gender) { setError('productGender', 'Select a gender.'); ok = false; }
    if (!collection) { setError('productCollection', 'Select a category.'); ok = false; }
    if (!condition) { setError('productCondition', 'Select the condition.'); ok = false; }
    if (!size) { main.querySelector('#sizesField').classList.add('has-error'); main.querySelector('#sizesError').textContent = 'Select the size.'; ok = false; }

    const missing = IMG_SLOTS.filter((s) => s.required && !slotImages[s.key]).map((s) => s.label);
    if (missing.length) { main.querySelector('#imagesField').classList.add('has-error'); main.querySelector('#imagesError').textContent = `Please add: ${missing.join(', ')}.`; ok = false; }
    if (!ok) { focusFirstError(); return; }

    const images = IMG_SLOTS.map((s) => slotImages[s.key]).filter(Boolean);
    const colorsRaw = val('productColors'), styleRaw = val('productStyle');
    const sellerProfile = JSON.parse(localStorage.getItem(SELLER_KEY) || '{}');
    const product = {
      id, name, brand: brand || 'RE:WEAR Seller', description: desc, price, originalPrice: original,
      gender, category: 'clothes', collection_type: collection, condition,
      material: material || null, size,
      colors: colorsRaw ? colorsRaw.split(',').map((s) => s.trim()).filter(Boolean) : [],
      style: styleRaw ? styleRaw.split(',').map((s) => s.trim()).filter(Boolean) : [],
      featured: false, images,
      sellerId: user.id, sellerName: user.name || `${user.firstName} ${user.lastName}`, sellerEmail: user.email,
      sellerPhone: sellerProfile.phone || '', sellerCity: sellerProfile.city || '',
      submittedAt: new Date().toISOString(), status: 'pending', approved: false, stage: 'submitted',
    };
    const pending = getPending();
    pending.push(product);
    try { localStorage.setItem(PENDING_KEY, JSON.stringify(pending)); }
    catch { main.querySelector('#imagesField')?.classList.add('has-error'); const e = main.querySelector('#imagesError'); if (e) e.textContent = 'Storage is full — please use fewer or smaller photos.'; return; }

    main.innerHTML = `
      <div class="submit-success">
        <span class="submit-success-icon">${ICON.check}</span>
        <h2 class="submit-success-title">Submitted for Review</h2>
        <p class="submit-success-text"><strong>${name}</strong> has been submitted. Our team will review it within 24 hours — you'll see the status in your dashboard.</p>
        <p class="submit-success-id">Product ID: <strong>${id}</strong></p>
        <div class="submit-success-actions"><button class="btn btn-primary" id="goDashboard">View Dashboard</button><button class="btn btn-secondary" id="goAddAnother">Add Another</button></div>
      </div>`;
    main.querySelector('#goDashboard').addEventListener('click', () => renderDashboard());
    main.querySelector('#goAddAnother').addEventListener('click', renderAddProduct);
  }

  /* ── helpers ── */
  function getPending() { try { return JSON.parse(localStorage.getItem(PENDING_KEY)) || []; } catch { return []; } }
  function getMyListings() {
    const pending = getPending();
    const approved = JSON.parse(localStorage.getItem('rewear_approved_products') || '[]');
    const rejected = JSON.parse(localStorage.getItem('rewear_rejected_products') || '[]');
    return [
      ...pending.map((p) => ({ ...p, status: p.status || 'pending' })),
      ...approved.map((p) => ({ ...p, status: 'approved' })),
      ...rejected.map((p) => ({ ...p, status: 'rejected' })),
    ].filter((p) => p.sellerId === user.id);
  }
}