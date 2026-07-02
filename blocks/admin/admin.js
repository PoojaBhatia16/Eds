/*
 * blocks/admin/admin.js — Admin panel (pending/approved/rejected/users/orders/soldout)
 * Ported from admin.js (780 lines). No GSAP. Inline onclick → event delegation (CSP-clean).
 * Author empty block on `admin` doc:  | Admin |
 *
 * localStorage: rewear_pending_products, rewear_approved_products,
 *   rewear_rejected_products, rewear_users, rewear_orders, rewear_removed
 */

import { requireRole } from '../../scripts/auth-guard.js';
import { getRemoved, isSold } from '../../scripts/products.js';

const PENDING_KEY = 'rewear_pending_products';
const APPROVED_KEY = 'rewear_approved_products';
const REJECTED_KEY = 'rewear_rejected_products';
const USERS_KEY = 'rewear_users';
const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

const ICON = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/></svg>',
  inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 6h13l3 6v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-6l3.5-6z"/></svg>',
  image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5L5 20"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.3 6.8.6-5.1 4.5 1.5 6.7L12 17.3 5.9 20.6l1.5-6.7L2.3 8.9l6.8-.6z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/></svg>',
};

/* storage helpers */
const KMAP = { pending: PENDING_KEY, approved: APPROVED_KEY, rejected: REJECTED_KEY };
const getList = (k) => { try { return JSON.parse(localStorage.getItem(KMAP[k])) || []; } catch { return []; } };
const setList = (k, arr) => localStorage.setItem(KMAP[k], JSON.stringify(arr));
const getUsers = () => { try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch { return []; } };
const setUsers = (arr) => localStorage.setItem(USERS_KEY, JSON.stringify(arr));

export default function decorate(block) {
  if (!requireRole('admin', '/')) return;

  let baseProducts = [];
  let activeTab = 'pending';

  block.innerHTML = `
    <div class="admin-layout">
      <aside class="admin-sidebar">
        <div class="admin-sidebar-logo"><span class="admin-logo-ico">${ICON.shield}</span>Admin Panel</div>
        <nav class="admin-nav">
          <button class="admin-nav-item active" data-tab="pending">Pending <span class="admin-nav-badge" id="pendingBadge">0</span></button>
          <button class="admin-nav-item" data-tab="approved">Approved <span class="admin-nav-badge admin-nav-badge--green" id="approvedBadge">0</span></button>
          <button class="admin-nav-item" data-tab="rejected">Rejected <span class="admin-nav-badge admin-nav-badge--red" id="rejectedBadge">0</span></button>
          <button class="admin-nav-item" data-tab="users">Users <span class="admin-nav-badge" id="usersBadge">0</span></button>
          <button class="admin-nav-item" data-tab="orders">Orders <span class="admin-nav-badge" id="ordersBadge">0</span></button>
          <button class="admin-nav-item" data-tab="soldout">Sold Out <span class="admin-nav-badge" id="soldoutBadge">0</span></button>
        </nav>
        <div class="admin-stats">
          <div class="admin-stat"><span class="admin-stat-num" id="statTotal">0</span><span class="admin-stat-label">Live</span></div>
          <div class="admin-stat"><span class="admin-stat-num" id="statPending">0</span><span class="admin-stat-label">Pending</span></div>
          <div class="admin-stat"><span class="admin-stat-num" id="statSellers">0</span><span class="admin-stat-label">Sellers</span></div>
          <div class="admin-stat"><span class="admin-stat-num" id="statUsers">0</span><span class="admin-stat-label">Users</span></div>
          <div class="admin-stat admin-stat--link"><span class="admin-stat-num" id="statOrders">0</span><span class="admin-stat-label">Orders</span></div>
        </div>
        <button class="admin-export-btn" id="exportJsonBtn">Export approved JSON</button>
      </aside>
      <main class="admin-main">
        <div class="admin-topbar">
          <div><h1 class="admin-title" id="adminTabTitle">Pending Review</h1><p class="admin-subtitle" id="adminTabSub">Products submitted by sellers awaiting approval</p></div>
          <button class="admin-refresh-btn" id="adminRefresh"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>Refresh</button>
        </div>
        <div id="adminContent"></div>
      </main>
    </div>`;

  const $ = (id) => block.querySelector('#' + id);
  const content = $('adminContent');

  /* fetch base catalogue for Live/SoldOut counts */
  fetch('/data/products.json').then((r) => r.json()).then((arr) => {
    baseProducts = Array.isArray(arr) ? arr : (arr.products || []);
    renderTab(activeTab);
    updateBadges();
  }).catch(() => {});

  /* tab nav */
  block.querySelectorAll('.admin-nav-item').forEach((btn) => btn.addEventListener('click', () => {
    activeTab = btn.dataset.tab;
    block.querySelectorAll('.admin-nav-item').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    renderTab(activeTab);
  }));

  $('adminRefresh').addEventListener('click', () => { renderTab(activeTab); updateBadges(); });
  $('exportJsonBtn').addEventListener('click', exportJson);

  /* delegated actions on content */
  content.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) {
      const view = e.target.closest('[data-view]');
      if (view) openView(view.dataset.view, view.dataset.tab);
      return;
    }
    const { act, id, tab } = el.dataset;
    if (act === 'approve') approveProduct(id);
    else if (act === 'reject') openRejectModal(id);
    else if (act === 'feature') toggleFeature(id);
    else if (act === 'takedown') takeDown(id);
    else if (act === 'undo') undoProduct(id, tab);
    else if (act === 'stage') advanceStage(id);
    else if (act === 'remove') removeFromStore(id);
    else if (act === 'suspend') toggleSuspend(el.dataset.email);
  });
  content.addEventListener('change', (e) => {
    const sel = e.target.closest('[data-role-email]');
    if (sel) changeUserRole(sel.dataset.roleEmail, sel.value);
  });

  renderTab('pending');

  /* ── render tab ── */
  function renderTab(tab) {
    const tabs = {
      pending: { title: 'Pending Review', sub: 'Products submitted by sellers awaiting approval' },
      approved: { title: 'Approved', sub: 'Products live on the store' },
      rejected: { title: 'Rejected', sub: 'Products that were not approved' },
      users: { title: 'Users', sub: 'All registered RE:WEAR accounts' },
      orders: { title: 'Orders', sub: 'All orders placed across the store' },
      soldout: { title: 'Sold Out', sub: 'Sold pieces — remove them from the store for good' },
    };
    $('adminTabTitle').textContent = tabs[tab].title;
    $('adminTabSub').textContent = tabs[tab].sub;

    if (tab === 'users') renderUsers();
    else if (tab === 'orders') renderOrders();
    else if (tab === 'soldout') renderSoldOut();
    else renderProducts(getList(tab), tab);

    /* stats */
    const approved = getList('approved');
    const users = getUsers();
    const sellers = users.filter((u) => u.role === 'seller' || u.role === 'admin');
    const orders = JSON.parse(localStorage.getItem('rewear_orders') || '[]');
    const removedIds = getRemoved();
    const liveAll = [...baseProducts, ...approved].filter((p) => !removedIds.includes(String(p.id)));
    $('statTotal').textContent = liveAll.length;
    $('statPending').textContent = getList('pending').length;
    $('statSellers').textContent = sellers.length;
    $('statUsers').textContent = users.length;
    $('statOrders').textContent = orders.length;
  }

  function renderProducts(products, tab) {
    if (!products.length) {
      content.innerHTML = `<div class="admin-empty"><span class="admin-empty-ico">${tab === 'approved' ? ICON.check : tab === 'rejected' ? ICON.x : ICON.inbox}</span><h3>No ${tab} products</h3><p>${tab === 'pending' ? 'All submissions have been reviewed.' : 'Nothing here yet.'}</p></div>`;
      return;
    }
    content.innerHTML = `<div class="admin-grid">${products.map((p) => {
      const sz = p.size || (Array.isArray(p.sizes) ? p.sizes[0] : '') || '';
      return `
      <div class="admin-card" data-id="${p.id}">
        <div class="admin-card-img" data-view="${p.id}" data-tab="${tab}">${p.images?.[0] ? `<img src="${p.images[0]}" alt="${p.name}">` : `<div class="img-placeholder">${ICON.image}</div>`}</div>
        <div class="admin-card-info" data-view="${p.id}" data-tab="${tab}">
          <p class="admin-card-brand">${p.brand || '—'}</p>
          <p class="admin-card-name">${p.name}</p>
          <div class="admin-card-meta">
            <span class="admin-meta-tag">${fmt(p.price)}</span>
            ${p.originalPrice ? `<span class="admin-meta-tag">${fmt(p.originalPrice)} orig</span>` : ''}
            <span class="admin-meta-tag">${p.gender || '—'}</span>
            <span class="admin-meta-tag">${p.collection_type || p.category || '—'}</span>
            <span class="admin-meta-tag">${p.condition || '—'}</span>
            ${sz ? `<span class="admin-meta-tag">${sz}</span>` : ''}
          </div>
          ${p.sellerName ? `<p class="admin-card-seller">By <strong>${p.sellerName}</strong> · ${p.sellerEmail || ''}</p>` : ''}
          ${p.submittedAt ? `<p class="admin-card-seller">Submitted: ${new Date(p.submittedAt).toLocaleDateString('en-IN')}</p>` : ''}
          ${tab === 'pending' ? `<p class="admin-card-stage"><span class="admin-stage-dot"></span>${stageLabel(p.stage)}</p>` : ''}
          ${p.description ? `<p class="admin-card-desc">${p.description}</p>` : ''}
          ${tab !== 'pending' ? `<span class="admin-status-badge ${tab}">${tab === 'approved' ? 'Approved' : 'Rejected'}</span>` : ''}
          ${tab === 'approved' && p.featured ? `<span class="admin-featured-tag">${ICON.star} Featured on home</span>` : ''}
          ${tab === 'rejected' && p.rejectionReason ? `<p class="admin-reject-reason"><strong>Reason:</strong> ${p.rejectionReason}</p>` : ''}
        </div>
        <div class="admin-card-actions">
          ${tab === 'pending' ? `
            ${stageAdvanceButton(p)}
            <button class="admin-btn-approve" data-act="approve" data-id="${p.id}">${ICON.check}<span>Approve</span></button>
            <button class="admin-btn-reject" data-act="reject" data-id="${p.id}">${ICON.x}<span>Reject</span></button>
          ` : tab === 'approved' ? `
            <button class="admin-btn-feature${p.featured ? ' is-on' : ''}" data-act="feature" data-id="${p.id}">${ICON.star}<span>${p.featured ? 'Featured' : 'Feature'}</span></button>
            <button class="admin-btn-takedown" data-act="takedown" data-id="${p.id}">${ICON.trash}<span>Take Down</span></button>
            <button class="admin-btn-undo" data-act="undo" data-id="${p.id}" data-tab="${tab}">${ICON.undo}<span>Re-review</span></button>
          ` : `
            <button class="admin-btn-undo" data-act="undo" data-id="${p.id}" data-tab="${tab}">${ICON.undo}<span>Move to Pending</span></button>
          `}
        </div>
      </div>`;
    }).join('')}</div>`;
  }

  function renderUsers() {
    const users = getUsers();
    if (!users.length) { content.innerHTML = `<div class="admin-empty"><span class="admin-empty-ico">${ICON.inbox}</span><h3>No registered users</h3><p>Users will appear here after signing up.</p></div>`; return; }
    content.innerHTML = `<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      ${users.map((u) => {
        const role = u.role || 'buyer';
        const isAdmin = role === 'admin';
        return `<tr class="${u.suspended ? 'is-suspended' : ''}">
          <td><strong>${u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim()}</strong></td>
          <td>${u.email}</td>
          <td><span class="user-role-badge ${role}">${role}</span></td>
          <td>${u.joinedAt ? new Date(u.joinedAt).toLocaleDateString('en-IN') : '—'}</td>
          <td><span class="user-status ${u.suspended ? 'suspended' : 'active'}">${u.suspended ? 'Suspended' : 'Active'}</span></td>
          <td class="user-actions">${isAdmin ? '<span class="user-actions-na">Protected</span>' : `
            <select class="user-role-select" data-role-email="${u.email}"><option value="buyer" ${role === 'buyer' ? 'selected' : ''}>Buyer</option><option value="seller" ${role === 'seller' ? 'selected' : ''}>Seller</option></select>
            <button class="user-suspend-btn ${u.suspended ? 'reactivate' : ''}" data-act="suspend" data-email="${u.email}">${u.suspended ? 'Activate' : 'Suspend'}</button>`}</td>
        </tr>`;
      }).join('')}</tbody></table></div>`;
  }

  function renderOrders() {
    const orders = JSON.parse(localStorage.getItem('rewear_orders') || '[]');
    if (!orders.length) { content.innerHTML = `<div class="admin-empty"><span class="admin-empty-ico">${ICON.inbox}</span><h3>No orders yet</h3><p>Orders placed by buyers will appear here with full details.</p></div>`; return; }
    content.innerHTML = `<div class="admin-orders">${orders.slice().reverse().map((o) => {
      const a = o.address || {};
      const customer = `${a.firstName || ''} ${a.lastName || ''}`.trim() || 'Customer';
      const itemCount = (o.items || []).reduce((s, i) => s + (i.qty || 1), 0);
      return `<div class="admin-order-card">
        <div class="admin-order-head"><div><p class="admin-order-id">${o.id}</p><p class="admin-order-date">${o.date ? new Date(o.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''} · ${itemCount} item${itemCount !== 1 ? 's' : ''}</p></div><span class="admin-order-status">${o.status || 'Processing'}</span></div>
        <div class="admin-order-items">${(o.items || []).map((i) => `<div class="admin-order-item"><div class="admin-order-thumb">${i.image ? `<img src="${i.image}" alt="${i.name}">` : ''}</div><div class="admin-order-item-info"><span class="admin-order-item-name">${i.name}</span><span class="admin-order-item-meta">${i.brand ? i.brand + ' · ' : ''}Size ${i.size || '—'} · Qty ${i.qty || 1}</span></div><span class="admin-order-item-price">${fmt((i.price || 0) * (i.qty || 1))}</span></div>`).join('')}</div>
        <div class="admin-order-foot"><div class="admin-order-customer"><span class="admin-order-cust-name">${customer}</span>${a.phone ? `<span>${a.phone}</span>` : ''}${a.city ? `<span>${a.city}${a.pincode ? ' · ' + a.pincode : ''}</span>` : ''}</div><div class="admin-order-total">Total <strong>${fmt(o.total)}</strong></div></div>
      </div>`;
    }).join('')}</div>`;
  }

  function renderSoldOut() {
    const removedIds = getRemoved();
    const all = [...baseProducts, ...getList('approved')];
    const sold = all.filter((p) => isSold(p.id) && !removedIds.includes(String(p.id)));
    if (!sold.length) { content.innerHTML = `<div class="admin-empty"><span class="admin-empty-ico">${ICON.inbox}</span><h3>No sold-out pieces</h3><p>When an item sells, it shows here so you can take it off the store.</p></div>`; return; }
    content.innerHTML = `<div class="admin-soldout">${sold.map((p) => `
      <div class="admin-soldout-card" data-id="${p.id}">
        <div class="admin-soldout-img">${p.images?.[0] ? `<img src="${p.images[0]}" alt="${p.name}">` : ''}</div>
        <div class="admin-soldout-info"><p class="admin-soldout-brand">${p.brand || 'RE:WEAR'}</p><p class="admin-soldout-name">${p.name}</p><p class="admin-soldout-meta">${fmt(p.price)} · Size ${p.size || (Array.isArray(p.sizes) ? p.sizes[0] : '') || '—'}</p></div>
        <button class="admin-soldout-remove" data-act="remove" data-id="${p.id}">${ICON.trash}<span>Remove from store</span></button>
      </div>`).join('')}</div>`;
  }

  /* ── stage ── */
  function stageLabel(stage) {
    return ({ submitted: 'Awaiting pickup', picked: 'Picked up — heading to warehouse', warehouse: 'At warehouse — under review' })[stage || 'submitted'] || 'Awaiting pickup';
  }
  function stageAdvanceButton(p) {
    const s = p.stage || 'submitted';
    if (s === 'submitted') return `<button class="admin-btn-stage" data-act="stage" data-id="${p.id}">${ICON.arrow}<span>Mark Picked Up</span></button>`;
    if (s === 'picked') return `<button class="admin-btn-stage" data-act="stage" data-id="${p.id}">${ICON.arrow}<span>Received at Warehouse</span></button>`;
    return '';
  }
  function advanceStage(id) {
    const pending = getList('pending');
    const p = pending.find((x) => String(x.id) === String(id));
    if (!p) return;
    const next = { submitted: 'picked', picked: 'warehouse' };
    const cur = p.stage || 'submitted';
    if (!next[cur]) return;
    p.stage = next[cur];
    setList('pending', pending);
    renderTab('pending');
    toast(p.stage === 'picked' ? `"${p.name}" marked as picked up` : `"${p.name}" received at warehouse`);
  }

  /* ── approve / reject / feature / takedown / undo ── */
  function approveProduct(id) {
    const pending = getList('pending');
    const product = pending.find((p) => String(p.id) === String(id));
    if (!product) return;
    const approved = getList('approved');
    product.approvedAt = new Date().toISOString(); product.approved = true; product.status = 'approved';
    approved.push(product);
    setList('pending', pending.filter((p) => String(p.id) !== String(id)));
    setList('approved', approved);
    renderTab('pending'); updateBadges();
    toast(`"${product.name}" approved and live on store`);
  }
  function toggleFeature(id) {
    const approved = getList('approved');
    const product = approved.find((p) => String(p.id) === String(id));
    if (!product) return;
    product.featured = !product.featured;
    setList('approved', approved);
    renderTab('approved');
    toast(`"${product.name}" ${product.featured ? 'featured on home' : 'removed from featured'}`);
  }
  function takeDown(id) {
    const approved = getList('approved');
    const product = approved.find((p) => String(p.id) === String(id));
    if (!product) return;
    const rejected = getList('rejected');
    product.rejectedAt = new Date().toISOString(); product.status = 'rejected'; product.rejectionReason = 'Removed from store by admin';
    delete product.approvedAt; delete product.approved; delete product.featured;
    rejected.push(product);
    setList('approved', approved.filter((p) => String(p.id) !== String(id)));
    setList('rejected', rejected);
    renderTab('approved'); updateBadges();
    toast(`"${product.name}" taken down from store`);
  }
  function undoProduct(id, fromTab) {
    const list = getList(fromTab);
    const product = list.find((p) => String(p.id) === String(id));
    if (!product) return;
    delete product.approvedAt; delete product.rejectedAt; delete product.approved;
    const pending = getList('pending');
    pending.push(product);
    setList(fromTab, list.filter((p) => String(p.id) !== String(id)));
    setList('pending', pending);
    renderTab(fromTab); updateBadges();
    toast(`"${product.name}" moved back to pending`);
  }
  function removeFromStore(id) {
    const removed = getRemoved();
    if (!removed.includes(String(id))) removed.push(String(id));
    localStorage.setItem('rewear_removed', JSON.stringify(removed));
    renderTab('soldout'); updateBadges();
    toast("Removed from store — it won't show on Browse anymore");
  }
  function changeUserRole(email, role) {
    const users = getUsers();
    const u = users.find((x) => x.email === email);
    if (!u) return;
    u.role = role; if (role === 'seller') u.isSeller = true;
    setUsers(users);
    renderTab('users'); updateBadges();
    toast(`${u.name || email} set to ${role}`);
  }
  function toggleSuspend(email) {
    const users = getUsers();
    const u = users.find((x) => x.email === email);
    if (!u) return;
    u.suspended = !u.suspended;
    setUsers(users);
    renderTab('users');
    toast(`${u.name || email} ${u.suspended ? 'suspended' : 'reactivated'}`);
  }

  /* ── reject modal ── */
  function openRejectModal(id) {
    const reasons = ['Photos unclear', 'Price too high', 'Not as described', 'Poor condition', 'Prohibited item'];
    const overlay = document.createElement('div');
    overlay.className = 'admin-modal-overlay'; overlay.id = 'rejectModalOverlay';
    overlay.innerHTML = `<div class="reject-modal" role="dialog" aria-modal="true">
      <h3 class="reject-modal-title">Reject listing</h3>
      <p class="reject-modal-sub">Give the seller a reason — they'll see it in their dashboard.</p>
      <div class="reject-chips">${reasons.map((r) => `<button type="button" class="reject-chip" data-reason="${r}">${r}</button>`).join('')}</div>
      <textarea id="rejectReasonText" class="reject-textarea" placeholder="Add a note (optional)"></textarea>
      <div class="reject-modal-actions"><button type="button" class="reject-cancel" id="rejCancel">Cancel</button><button type="button" class="reject-confirm" id="rejConfirm">Confirm Reject</button></div>
    </div>`;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => overlay.classList.add('open'));
    const ta = overlay.querySelector('#rejectReasonText');
    overlay.querySelectorAll('.reject-chip').forEach((chip) => chip.addEventListener('click', () => {
      overlay.querySelectorAll('.reject-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active'); ta.dataset.preset = chip.dataset.reason;
    }));
    const close = () => { overlay.classList.remove('open'); document.body.style.overflow = ''; setTimeout(() => overlay.remove(), 200); };
    overlay.querySelector('#rejCancel').addEventListener('click', close);
    overlay.querySelector('#rejConfirm').addEventListener('click', () => {
      const note = ta.value.trim(); const preset = ta.dataset.preset || '';
      const reason = [preset, note].filter(Boolean).join(' — ') || 'Did not meet listing guidelines';
      close(); confirmReject(id, reason);
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  }
  function confirmReject(id, reason) {
    const pending = getList('pending');
    const product = pending.find((p) => String(p.id) === String(id));
    if (!product) return;
    const rejected = getList('rejected');
    product.rejectedAt = new Date().toISOString(); product.status = 'rejected'; product.rejectionReason = reason;
    rejected.push(product);
    setList('pending', pending.filter((p) => String(p.id) !== String(id)));
    setList('rejected', rejected);
    renderTab('pending'); updateBadges();
    toast(`"${product.name}" rejected`);
  }

  /* ── product view modal ── */
  function openView(id, tab) {
    const product = getList(tab).find((p) => String(p.id) === String(id));
    if (!product) return;
    const imgs = (product.images || []).filter(Boolean);
    const discount = product.originalPrice && product.price ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;
    const row = (label, val) => val ? `<div class="apm-row"><span class="apm-label">${label}</span><span class="apm-val">${val}</span></div>` : '';
    const gallery = imgs.length ? `<div class="apm-gallery"><div class="apm-main"><img id="apmMainImg" src="${imgs[0]}" alt="${product.name}"></div>${imgs.length > 1 ? `<div class="apm-thumbs">${imgs.map((src, i) => `<img src="${src}" class="apm-thumb${i === 0 ? ' active' : ''}" data-src="${src}" alt="view ${i + 1}">`).join('')}</div>` : ''}</div>` : `<div class="apm-gallery apm-noimg"><small>No images uploaded</small></div>`;
    const actions = tab === 'pending'
      ? `<button class="admin-btn-approve" data-modal-act="approve" data-id="${id}">✓ Approve</button><button class="admin-btn-reject" data-modal-act="reject" data-id="${id}">✗ Reject</button>`
      : `<button class="admin-btn-undo" data-modal-act="undo" data-id="${id}" data-tab="${tab}">↩ Move to Pending</button>`;

    const overlay = document.createElement('div');
    overlay.className = 'admin-modal-overlay'; overlay.id = 'adminModalOverlay';
    overlay.innerHTML = `<div class="admin-modal" role="dialog" aria-modal="true">
      <button class="admin-modal-close" id="apmClose" aria-label="Close">×</button>
      <div class="apm-body">${gallery}
        <div class="apm-details">
          <p class="apm-brand">${product.brand || '—'}</p>
          <h2 class="apm-name">${product.name}</h2>
          <div class="apm-price"><span class="apm-price-now">${fmt(product.price)}</span>${product.originalPrice ? `<span class="apm-price-orig">${fmt(product.originalPrice)}</span>` : ''}${discount ? `<span class="apm-price-off">${discount}% off</span>` : ''}</div>
          ${product.description ? `<p class="apm-desc">${product.description}</p>` : ''}
          <div class="apm-rows">${row('Gender', product.gender)}${row('Category', product.collection_type || product.category)}${row('Condition', product.condition)}${row('Size', product.size || (Array.isArray(product.sizes) ? product.sizes[0] : '') || '—')}${row('Colours', (product.colors || []).join(', '))}${row('Material', product.material)}${row('Style', (product.style || []).join(', '))}</div>
          ${(product.sellerName || product.sellerEmail) ? `<div class="apm-seller"><p class="apm-seller-title">Seller details</p><div class="apm-seller-grid">${product.sellerName ? `<div><span>Name</span><strong>${product.sellerName}</strong></div>` : ''}${product.sellerEmail ? `<div><span>Email</span><strong>${product.sellerEmail}</strong></div>` : ''}${product.sellerPhone ? `<div><span>Phone</span><strong>${product.sellerPhone}</strong></div>` : ''}${product.sellerCity ? `<div><span>City</span><strong>${product.sellerCity}</strong></div>` : ''}${product.submittedAt ? `<div><span>Submitted</span><strong>${new Date(product.submittedAt).toLocaleDateString('en-IN')}</strong></div>` : ''}</div></div>` : ''}
          <div class="apm-actions">${actions}</div>
        </div>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => overlay.classList.add('open'));
    const close = () => { overlay.classList.remove('open'); document.body.style.overflow = ''; document.removeEventListener('keydown', esc); setTimeout(() => overlay.remove(), 220); };
    function esc(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', esc);
    overlay.querySelector('#apmClose').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    overlay.querySelectorAll('.apm-thumb').forEach((t) => t.addEventListener('click', () => {
      overlay.querySelector('#apmMainImg').src = t.dataset.src;
      overlay.querySelectorAll('.apm-thumb').forEach((x) => x.classList.remove('active'));
      t.classList.add('active');
    }));
    overlay.querySelectorAll('[data-modal-act]').forEach((btn) => btn.addEventListener('click', () => {
      const a = btn.dataset.modalAct;
      close();
      if (a === 'approve') approveProduct(btn.dataset.id);
      else if (a === 'reject') openRejectModal(btn.dataset.id);
      else if (a === 'undo') undoProduct(btn.dataset.id, btn.dataset.tab);
    }));
  }

  /* ── badges ── */
  function updateBadges() {
    $('pendingBadge').textContent = getList('pending').length;
    $('approvedBadge').textContent = getList('approved').length;
    $('rejectedBadge').textContent = getList('rejected').length;
    $('usersBadge').textContent = getUsers().length;
    $('ordersBadge').textContent = JSON.parse(localStorage.getItem('rewear_orders') || '[]').length;
    const removedIds = getRemoved();
    const soldLive = [...baseProducts, ...getList('approved')].filter((p) => isSold(p.id) && !removedIds.includes(String(p.id)));
    $('soldoutBadge').textContent = soldLive.length;
  }

  /* ── export ── */
  function exportJson() {
    const approved = getList('approved');
    if (!approved.length) { alert('No approved products to export.'); return; }
    const data = approved.map((p, i) => ({
      id: p.id || `SELL-${Date.now()}-${i}`, name: p.name, brand: p.brand || 'RE:WEAR Seller',
      gender: p.gender, category: p.category || 'clothes', collection_type: p.collection_type,
      price: p.price, originalPrice: p.originalPrice || null, condition: p.condition,
      size: p.size || (Array.isArray(p.sizes) ? p.sizes[0] : '') || '', featured: false,
      description: p.description || '', colors: p.colors || [], material: p.material || '', style: p.style || [], images: p.images || [],
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'approved-products.json'; a.click();
    URL.revokeObjectURL(url);
    toast(`${data.length} products exported — add to data/products.json`);
  }

  /* ── toast ── */
  function toast(msg) {
    document.getElementById('adminToast')?.remove();
    const t = document.createElement('div');
    t.id = 'adminToast'; t.className = 'admin-toast'; t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2400);
  }
}