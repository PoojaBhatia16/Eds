/* ============================================
   AUTH-GUARD.JS — Page-level access control
   
   HOW TO USE on any page that needs login:
   
   // Require any logged-in user:
   import { requireAuth } from './auth-guard.js';
   requireAuth();
   
   // Require a specific role:
   import { requireRole } from './auth-guard.js';
   requireRole('seller');   // redirects if not seller or admin
   requireRole('admin');    // redirects if not admin
   
   // Get current user anywhere:
   import { getCurrentUser, isLoggedIn } from './auth-guard.js';
   const user = getCurrentUser(); // null if logged out
   
   // Logout from any page:
   import { logout } from './auth-guard.js';
   logout();
   ============================================ */

const SESSION_KEY = 'rewear_user';

/* ── READ SESSION ── */
export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return getCurrentUser() !== null;
}

/* ── per-user storage keys ──
 * Cart & wishlist are namespaced per account so different users on the same
 * browser don't see each other's items. Logged-out = a shared "guest" bucket.
 */
function userScope() {
  const u = getCurrentUser();
  return u ? (u.id || u.email || 'user') : 'guest';
}
export function cartKey() { return `rewear_cart_${userScope()}`; }
export function wishlistKey() { return `rewear_wishlist_${userScope()}`; }

export function getWishlist() {
  try { return JSON.parse(localStorage.getItem(wishlistKey())) || []; } catch { return []; }
}
export function saveWishlist(ids) {
  localStorage.setItem(wishlistKey(), JSON.stringify(ids));
}
export function toggleWishlist(id) {
  const ids = getWishlist().map(String);
  const key = String(id);
  const idx = ids.indexOf(key);
  if (idx >= 0) ids.splice(idx, 1); else ids.push(key);
  saveWishlist(ids);
  return idx < 0; // true = now in wishlist
}

/* ensureAuth(message) — gate an ACTION (add to cart / wishlist / buy) behind login.
   Returns true if logged in. If not: remembers this page + a reason, then sends to login.
   After a successful login, auth.js sends the user back here automatically. */
export function ensureAuth(message = '') {
  if (isLoggedIn()) return true;
  sessionStorage.setItem('rewear_redirect', window.location.href);
  if (message) sessionStorage.setItem('rewear_auth_msg', message);
  window.location.href = 'login.html';
  return false;
}

export function hasRole(role) {
  const user = getCurrentUser();
  if (!user) return false;
  /* Admin can access everything */
  if (user.role === 'admin') return true;
  return user.role === role;
}

/* ── GUARDS ── */

/*
  requireAuth() — call at top of any page script.
  If not logged in, saves intended URL and redirects to login.
*/
export function requireAuth(redirectTo = 'login.html') {
  if (!isLoggedIn()) {
    sessionStorage.setItem('rewear_redirect', window.location.href);
    window.location.href = redirectTo;
    return false;
  }
  return true;
}

/*
  requireRole('seller') or requireRole('admin')
  Admin always passes (admin > seller > buyer in access hierarchy).
*/
export function requireRole(role, redirectTo = 'index.html') {
  if (!requireAuth()) return false; /* not logged in → login page */

  const user = getCurrentUser();

  /* role hierarchy: admin > seller > buyer */
  const hierarchy = { buyer: 1, seller: 2, admin: 3 };
  const userLevel     = hierarchy[user.role]    || 1;
  const requiredLevel = hierarchy[role]         || 1;

  if (userLevel < requiredLevel) {
    /* Logged in but insufficient role */
    alert(`This page requires ${role} access. You're logged in as ${user.role}.`);
    window.location.href = redirectTo;
    return false;
  }

  return true;
}

/* ── LOGOUT ── */
export function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = 'index.html';
}

/* ══════════════════════════
   NAV SYNC
   Call this on every page that has a nav.
   Updates the nav to show user name + logout
   instead of the Login link.
══════════════════════════ */
export function syncNav() {
  const user = getCurrentUser();
  const loginLink = document.getElementById('navLoginLink');
  const userMenu  = document.getElementById('navUserMenu');
  const userName  = document.getElementById('navUserName');
  const logoutBtn = document.getElementById('navLogoutBtn');

  if (user) {
    /* Show user menu, hide login link */
    if (loginLink) loginLink.style.display = 'none';
    if (userMenu)  userMenu.style.display  = 'flex';
    /* User name — always clickable to profile, works for any tag */
    /* navUserName now has SVG icon — do NOT overwrite with text */

    /* Seller link visibility */
    const sellLink = document.getElementById('navSellLink');
    if (sellLink) {
      sellLink.style.display = user.role === 'seller' ? '' : 'none';
    }

    /* Admin link visibility */
    const adminLink = document.getElementById('navAdminLink');
    if (adminLink) {
      adminLink.style.display = user.role === 'admin' ? '' : 'none';
    }


    /* Sell/Admin center nav links */
    const sellCenter  = document.getElementById('navSellLinkCenter');
    const adminCenter = document.getElementById('navAdminLinkCenter');
    if (sellCenter)  sellCenter.style.display  = user.role === 'seller' ? '' : 'none';
    if (adminCenter) adminCenter.style.display = user.role === 'admin' ? '' : 'none';

    /* Profile dropdown toggle — click avatar, close on outside */
    setTimeout(() => {
      const profileWrap = document.getElementById('navProfileIconBtn');
      const avatar      = profileWrap?.querySelector('.nav-avatar');
      const dropdown    = profileWrap?.querySelector('.nav-hover-dropdown');

      if (profileWrap && avatar) {
        avatar.style.cursor = 'pointer';

        avatar.addEventListener('click', (e) => {
          e.stopPropagation();
          profileWrap.classList.toggle('open');
        });

        if (dropdown) {
          dropdown.addEventListener('click', (e) => {
            e.stopPropagation();
          });
        }

        document.addEventListener('click', (e) => {
          if (!profileWrap.contains(e.target)) {
            profileWrap.classList.remove('open');
          }
        });
      }
    }, 100);

    /* Dropdown user info */
    const dName  = document.getElementById('navDropdownName');
    const dEmail = document.getElementById('navDropdownEmail');
    if (dName)  dName.textContent  = user.name || `${user.firstName||''} ${user.lastName||''}`.trim();
    if (dEmail) dEmail.textContent = user.email || '';

    /* Sell text */
    const sellTxt = document.getElementById('dropdownSellText');
    if (sellTxt) sellTxt.textContent = user.role === 'seller' ? 'Seller Dashboard' : 'Become a Seller';
    const sellDropLink = document.getElementById('dropdownSellLink');
    if (sellDropLink) sellDropLink.style.display = user.role === 'admin' ? 'none' : '';

    /* Admin link — add to dropdown if admin */
    if (user.role === 'admin') {
      const drop = document.querySelector('.nav-hover-dropdown');
      if (drop && !document.getElementById('adminDropdownLink')) {
        const divider = drop.querySelector('.nav-hover-divider');
        const adminLink = document.createElement('a');
        adminLink.href = 'admin.html';
        adminLink.className = 'nav-hover-item';
        adminLink.id = 'adminDropdownLink';
        adminLink.style.color = 'var(--terra)';
        adminLink.style.fontWeight = '600';
        adminLink.textContent = 'Admin Panel';
        drop.insertBefore(adminLink, divider);
      }
    }

    /* Admin/Sell nav links */
    const sc = document.getElementById('navSellLinkCenter');
    const ac = document.getElementById('navAdminLinkCenter');
    if (sc) sc.style.display = user.role==='seller' ? '' : 'none';
    if (ac) ac.style.display = user.role==='admin' ? '' : 'none';

    /* ── DROPDOWN TOGGLE ── */
    setTimeout(() => {
      const wrap   = document.getElementById('navProfileIconBtn');
      const avatar = wrap?.querySelector('.nav-avatar');
      const drop   = wrap?.querySelector('.nav-hover-dropdown');

      if (!wrap || !avatar || !drop) return;

      avatar.addEventListener('click', (e) => {
        e.stopPropagation();
        wrap.classList.toggle('open');
      });

      drop.addEventListener('mousedown', (e) => {
        e.stopPropagation();
      });

      document.addEventListener('click', () => {
        wrap.classList.remove('open');
      });
    }, 200);

    /* Logout handler */
    logoutBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });

  } else {
    /* Logged out state */
    if (loginLink) loginLink.style.display = '';
    if (userMenu)  userMenu.style.display  = 'none';

    /* Hide seller/admin links for guests */
    const sellLink  = document.getElementById('navSellLink');
    const adminLink = document.getElementById('navAdminLink');
    if (sellLink)  sellLink.style.display  = 'none';
    if (adminLink) adminLink.style.display = 'none';
  }

  /* Footer auth link — Sign Out when logged in, else Sign In */
  const footAuth = document.getElementById('footerAuthLink');
  if (footAuth) {
    if (user) {
      footAuth.textContent = 'Sign Out';
      footAuth.href = '#';
      footAuth.onclick = (e) => { e.preventDefault(); logout(); };
    } else {
      footAuth.textContent = 'Sign In';
      footAuth.href = 'login.html';
      footAuth.onclick = null;
    }
  }
}

/* ══════════════════════════
   BECOME SELLER
   Call this when a logged-in buyer wants
   to become a seller (from sell.html prompt).
   Updates their stored user record.
══════════════════════════ */
export function upgradeToSeller() {
  const user = getCurrentUser();
  if (!user || user.role !== 'buyer') return;

  /* Update session */
  user.role = 'seller';
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));

  /* Update users store */
  const USERS_KEY = 'rewear_users';
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    const idx   = users.findIndex(u => u.id === user.id);
    if (idx > -1) {
      users[idx].role = 'seller';
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  } catch {
    /* silently fail — session is already updated */
  }
}

/* ══════════════════════════
   MOBILE NAV — runs on every page
══════════════════════════ */
function initMobileNav() {
  const btn   = document.getElementById('navHamburger');
  const links = document.getElementById('navLinks');
  if (!btn || !links) return;

  btn.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    btn.classList.toggle('open', isOpen);
    btn.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  links.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      links.classList.remove('open');
      btn.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

/* Mobile nav is now handled by a self-contained inline script in each page
   (module-independent, so it works even if another module fails to load). */