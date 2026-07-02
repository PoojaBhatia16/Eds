/*
 * blocks/auth/auth.js — Login + Signup (split-screen layout)
 *
 * Replaces login.html + signup.html with a single block that handles both.
 * Author as an empty block on both /login and /signup docs:  | Auth |
 *
 * The block detects which page it's on via URL (/signup → opens signup tab).
 * All logic is self-contained (no GSAP dependency). CSP-clean.
 *
 * localStorage keys (shared with auth-guard.js):
 *   rewear_users   — all registered users
 *   rewear_user    — current session
 */

const USERS_KEY = 'rewear_users';
const SESSION_KEY = 'rewear_user';
const ADMIN_EMAIL = 'admin@rewear.com';
const SEED = [
  { email: 'admin@rewear.com', password: 'admin123', firstName: 'Admin', lastName: 'User', role: 'admin' },
];

/* ── helpers ── */
const getUsers = () => { try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch { return []; } };
const saveUsers = (u) => localStorage.setItem(USERS_KEY, JSON.stringify(u));
const getSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; } };
const setSession = (u) => { const { passwordHash, ...safe } = u; localStorage.setItem(SESSION_KEY, JSON.stringify(safe)); };
const hashPw = (pw) => btoa(unescape(encodeURIComponent(pw)));
const checkPw = (pw, hash) => hashPw(pw) === hash;
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const findByEmail = (email) => getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());

function seedDefaults() {
  const users = getUsers(); let changed = false;
  SEED.forEach((acc) => {
    if (!users.some((u) => u.email.toLowerCase() === acc.email.toLowerCase())) {
      users.push({ id: `USR-SEED-${acc.role}`, firstName: acc.firstName, lastName: acc.lastName, name: `${acc.firstName} ${acc.lastName}`, email: acc.email, passwordHash: hashPw(acc.password), role: acc.role, joinedAt: new Date().toISOString(), seeded: true });
      changed = true;
    }
  });
  if (changed) saveUsers(users);
}

function redirectAfterLogin(session) {
  const intended = sessionStorage.getItem('rewear_redirect');
  if (intended) { sessionStorage.removeItem('rewear_redirect'); window.location.href = intended; return; }
  window.location.href = session.role === 'admin' ? '/admin' : '/';
}

/* ── Block HTML ── */
const AUTH_HTML = `
  <div class="auth-left">
    <div class="auth-left-inner">
      <div class="auth-brand-tag">Est. Pre-Loved</div>
      <a href="/" class="auth-brand-logo">RE:WEAR</a>
      <p class="auth-brand-tagline">Every piece has a<br>second life.</p>
      <p class="auth-brand-sub">Curated vintage &amp; thrift — where conscious style meets character.</p>
      <ul class="auth-brand-perks">
        <li>✶ 100% Pre-Loved</li>
        <li>✶ Quality Checked by Hand</li>
        <li>✶ Ships within 48 Hours</li>
      </ul>
    </div>
  </div>

  <div class="auth-right">
    <div class="auth-card">
      <div class="auth-tabs">
        <button class="auth-tab active" data-tab="login">Sign in</button>
        <button class="auth-tab" data-tab="signup">Create account</button>
      </div>

      <!-- LOGIN -->
      <div class="auth-panel" id="loginPanel">
        <div class="auth-card-heading">
          <h1>Welcome back</h1>
          <p>Log in to pick up where you left off.</p>
        </div>
        <form id="loginForm" novalidate>
          <div class="form-group">
            <label class="form-label" for="loginEmail">Email</label>
            <div class="form-field-wrap">
              <input class="form-input" type="email" id="loginEmail" required autocomplete="email">
            </div>
            <span class="form-error"></span>
          </div>
          <div class="form-group">
            <label class="form-label" for="loginPassword">Password</label>
            <div class="form-field-wrap">
              <input class="form-input" type="password" id="loginPassword" required autocomplete="current-password">
              <button type="button" class="form-eye-toggle" aria-label="Show password">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
            <span class="form-error"></span>
          </div>
          <div class="form-check-row">
            <label class="form-check"><input type="checkbox" id="rememberMe"> <span>Remember me</span></label>
            <button type="button" class="form-forgot" id="forgotBtn">Forgot password?</button>
          </div>
          <button type="submit" class="auth-submit btn btn-primary">
            <span class="btn-text">Log in</span>
          </button>
          <p class="auth-switch">New here? <button type="button" class="auth-switch-btn" data-tab="signup">Create an account</button></p>
        </form>
      </div>

      <!-- SIGNUP -->
      <div class="auth-panel is-hidden" id="signupPanel">
        <div class="auth-card-heading">
          <h1>Join RE:WEAR</h1>
          <p>Create your account to start shopping consciously.</p>
        </div>
        <form id="signupForm" novalidate>
          <div class="form-row-two">
            <div class="form-group">
              <label class="form-label" for="firstName">First Name</label>
              <div class="form-field-wrap">
                <input class="form-input" type="text" id="firstName" required autocomplete="given-name">
              </div>
              <span class="form-error"></span>
            </div>
            <div class="form-group">
              <label class="form-label" for="lastName">Last Name</label>
              <div class="form-field-wrap">
                <input class="form-input" type="text" id="lastName" autocomplete="family-name">
              </div>
              <span class="form-error"></span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="signupEmail">Email</label>
            <div class="form-field-wrap">
              <input class="form-input" type="email" id="signupEmail" required autocomplete="email">
            </div>
            <span class="form-error"></span>
          </div>
          <div class="form-group">
            <label class="form-label" for="signupPassword">Password</label>
            <div class="form-field-wrap">
              <input class="form-input" type="password" id="signupPassword" required autocomplete="new-password" minlength="8">
              <button type="button" class="form-eye-toggle" aria-label="Show password">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
            <div class="strength-bar"><div class="strength-fill" id="strengthFill"></div></div>
            <span class="strength-label" id="strengthLabel"></span>
            <span class="form-error"></span>
          </div>
          <div class="form-group">
            <label class="form-label" for="confirmPassword">Confirm Password</label>
            <div class="form-field-wrap">
              <input class="form-input" type="password" id="confirmPassword" required autocomplete="new-password">
            </div>
            <span class="form-error"></span>
          </div>
          <label class="form-check form-terms">
            <input type="checkbox" id="termsCheck">
            <span>I agree to the <a href="/how-it-works">Terms of Service</a> and <a href="/how-it-works">Privacy Policy</a></span>
          </label>
          <button type="submit" class="auth-submit btn btn-primary">
            <span class="btn-text">Create Account</span>
          </button>
          <p class="auth-switch">Already have an account? <button type="button" class="auth-switch-btn" data-tab="login">Sign in</button></p>
        </form>
      </div>
    </div>
  </div>
`;

export default function decorate(block) {
  seedDefaults();

  /* If already logged in, redirect */
  const session = getSession();
  if (session) { redirectAfterLogin(session); return; }

  block.innerHTML = AUTH_HTML;

  /* Flash message from auth-guard redirect */
  const msg = sessionStorage.getItem('rewear_auth_msg');
  if (msg) {
    sessionStorage.removeItem('rewear_auth_msg');
    const flash = document.createElement('div');
    flash.className = 'auth-flash';
    flash.textContent = '🔒 ' + msg;
    block.querySelector('.auth-card-heading')?.before(flash);
  }

  /* Prefill email from failed login */
  const prefill = sessionStorage.getItem('rewear_prefill_email');
  if (prefill) {
    const el = block.querySelector('#signupEmail');
    if (el) el.value = prefill;
    sessionStorage.removeItem('rewear_prefill_email');
  }

  /* Tab switching */
  const onTab = window.location.pathname.includes('signup') ? 'signup' : 'login';
  if (onTab === 'signup') switchTab('signup');

  block.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  function switchTab(tab) {
    block.querySelectorAll('.auth-tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === tab));
    block.querySelector('#loginPanel').classList.toggle('is-hidden', tab !== 'login');
    block.querySelector('#signupPanel').classList.toggle('is-hidden', tab !== 'signup');
  }

  /* Password toggles */
  block.querySelectorAll('.form-eye-toggle').forEach((btn) => {
    const input = btn.closest('.form-field-wrap')?.querySelector('input');
    if (!input) return;
    btn.addEventListener('click', () => {
      const hide = input.type === 'password';
      input.type = hide ? 'text' : 'password';
      btn.setAttribute('aria-label', hide ? 'Hide password' : 'Show password');
      btn.querySelector('svg').innerHTML = hide
        ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`
        : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
    });
  });

  /* Password strength */
  const pwEl = block.querySelector('#signupPassword');
  const fill = block.querySelector('#strengthFill');
  const label = block.querySelector('#strengthLabel');
  if (pwEl && fill) {
    pwEl.addEventListener('input', () => {
      const s = getStrength(pwEl.value);
      fill.className = `strength-fill ${s.cls}`;
      if (label) { label.textContent = s.label; label.style.color = s.color; }
    });
  }

  function getStrength(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { cls: 'weak', label: 'Weak', color: '#C44242' };
    if (score <= 2) return { cls: 'fair', label: 'Fair', color: '#BA7517' };
    if (score <= 3) return { cls: 'good', label: 'Good', color: '#639922' };
    return { cls: 'strong', label: 'Strong', color: '#1D9E75' };
  }

  /* Validation */
  function validateField(input) {
    let msg = '';
    if (!input.value.trim()) msg = 'This field is required';
    else if (input.type === 'email' && !isEmail(input.value)) msg = 'Please enter a valid email';
    else if (input.id === 'signupPassword' && input.value.length < 8) msg = 'At least 8 characters required';
    else if (input.id === 'confirmPassword') {
      const pw = block.querySelector('#signupPassword');
      if (pw && input.value !== pw.value) msg = "Passwords don't match";
    } else if (input.id === 'firstName' && input.value.trim().length < 2) msg = 'Enter your first name';

    const group = input.closest('.form-group');
    const err = group?.querySelector('.form-error');
    group?.classList.toggle('has-error', !!msg);
    if (err) err.textContent = msg;
    return !msg;
  }

  function showBanner(form, html) {
    let b = form.querySelector('.form-banner-error');
    if (!b) { b = document.createElement('div'); b.className = 'form-banner-error'; form.prepend(b); }
    b.innerHTML = html;
  }

  block.querySelectorAll('.form-input').forEach((input) => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
      const group = input.closest('.form-group');
      group?.classList.remove('has-error');
      const err = group?.querySelector('.form-error');
      if (err) err.textContent = '';
    });
  });

  /* Forgot password */
  block.querySelector('#forgotBtn')?.addEventListener('click', () => {
    const email = block.querySelector('#loginEmail').value.trim();
    alert(email
      ? `If an account exists for ${email}, a reset link would be sent. (Demo: check localStorage)`
      : 'Enter your email above first.');
  });

  /* LOGIN submit */
  block.querySelector('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const inputs = [...form.querySelectorAll('.form-input[required]')];
    if (!inputs.map(validateField).every(Boolean)) return;

    const btn = form.querySelector('.auth-submit');
    const txt = btn.querySelector('.btn-text');
    btn.disabled = true; txt.textContent = 'Signing in…';
    await delay(600);

    const email = form.querySelector('#loginEmail').value.trim();
    const pw = form.querySelector('#loginPassword').value;
    const user = findByEmail(email);

    if (!user) {
      btn.disabled = false; txt.textContent = 'Log in';
      sessionStorage.setItem('rewear_prefill_email', email);
      showBanner(form, 'No account found with this email. <button type="button" class="form-link-btn" data-tab="signup">Sign up?</button>');
      block.querySelector('[data-tab="signup"]')?.addEventListener('click', () => switchTab('signup'), { once: true });
      return;
    }
    if (!checkPw(pw, user.passwordHash)) {
      btn.disabled = false; txt.textContent = 'Log in';
      showBanner(form, 'Incorrect password. Please try again.');
      return;
    }
    if (user.suspended) {
      btn.disabled = false; txt.textContent = 'Log in';
      showBanner(form, 'This account has been suspended.');
      return;
    }

    setSession(user);
    txt.textContent = '✓ Welcome back!';
    await delay(500);
    redirectAfterLogin(getSession());
  });

  /* SIGNUP submit */
  block.querySelector('#signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.querySelector('#termsCheck').checked) { showBanner(form, 'Please accept the Terms of Service to continue.'); return; }
    const inputs = [...form.querySelectorAll('.form-input[required]')];
    if (!inputs.map(validateField).every(Boolean)) return;

    const btn = form.querySelector('.auth-submit');
    const txt = btn.querySelector('.btn-text');
    btn.disabled = true; txt.textContent = 'Creating account…';
    await delay(600);

    const firstName = form.querySelector('#firstName').value.trim();
    const lastName = form.querySelector('#lastName').value.trim();
    const email = form.querySelector('#signupEmail').value.trim();
    const pw = form.querySelector('#signupPassword').value;

    if (findByEmail(email)) {
      btn.disabled = false; txt.textContent = 'Create Account';
      showBanner(form, 'An account with this email already exists. <button type="button" class="form-link-btn" data-tab="login">Sign in?</button>');
      return;
    }

    const role = email.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'buyer';
    const newUser = { id: `USR-${Date.now()}`, firstName, lastName, name: `${firstName} ${lastName}`, email, passwordHash: hashPw(pw), role, joinedAt: new Date().toISOString() };
    const users = getUsers(); users.push(newUser); saveUsers(users);
    setSession(newUser);
    txt.textContent = '✓ Account created!';
    await delay(600);
    redirectAfterLogin(getSession());
  });
}