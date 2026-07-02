/*
 * blocks/auth/auth.js — Login + Signup (exact match to original login.html/signup.html)
 * Full-screen card layout with floating labels. Tabs switch login/signup in place.
 * Author empty block on /login and /signup docs:  | Auth |
 * Detects /signup URL → opens signup. CSP-clean, no GSAP.
 */

const USERS_KEY = 'rewear_users';
const SESSION_KEY = 'rewear_user';
const ADMIN_EMAIL = 'admin@rewear.com';
const SEED = [{ email: 'admin@rewear.com', password: 'admin123', firstName: 'Admin', lastName: 'User', role: 'admin' }];

const getUsers = () => { try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch { return []; } };
const saveUsers = (u) => localStorage.setItem(USERS_KEY, JSON.stringify(u));
const getSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; } };
const setSession = (u) => { const { passwordHash, ...safe } = u; localStorage.setItem(SESSION_KEY, JSON.stringify(safe)); };
const hashPw = (pw) => btoa(unescape(encodeURIComponent(pw)));
const checkPw = (pw, hash) => hashPw(pw) === hash;
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const findByEmail = (email) => getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
const EYE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
const SPIN = '<span class="btn-spinner is-hidden" aria-hidden="true"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg></span>';

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

const LOGIN_LEFT = `
  <span class="brand-eyebrow">Est. Pre-Loved</span>
  <a href="/" class="auth-card-logo">RE<span>:</span>WEAR</a>
  <h2 class="auth-left-headline">Every piece has a<br><em>second life.</em></h2>
  <p class="auth-left-tagline">Curated vintage &amp; thrift — where conscious style meets character.</p>
  <div class="auth-care">
    <div class="auth-care-row"><b>✶</b> 100% Pre-Loved</div>
    <div class="auth-care-row"><b>✶</b> Quality Checked by Hand</div>
    <div class="auth-care-row"><b>✶</b> Ships within 48 Hours</div>
  </div>`;

const SIGNUP_LEFT = `
  <span class="brand-eyebrow">Est. Pre-Loved</span>
  <a href="/" class="auth-card-logo">RE<span>:</span>WEAR</a>
  <h2 class="auth-left-headline">Join the<br><em>conscious</em><br>movement.</h2>
  <p class="auth-left-tagline">Every garment deserves a second chapter. Sell, buy, and discover one-of-a-kind pieces.</p>
  <div class="auth-care">
    <div class="auth-care-row"><b>✶</b> Free to Join</div>
    <div class="auth-care-row"><b>✶</b> 10% Off First Order</div>
    <div class="auth-care-row"><b>✶</b> 24h Listing Review</div>
  </div>`;

const LOGIN_RIGHT = `
  <div class="auth-tabs">
    <button class="auth-tab active" data-tab="login">Sign in</button>
    <button class="auth-tab" data-tab="signup">Create account</button>
  </div>
  <div class="auth-card-heading">
    <h1>Welcome back</h1>
    <p>Log in to pick up where you left off.</p>
  </div>
  <form class="auth-form" id="loginForm" novalidate>
    <div class="form-group" id="emailGroup">
      <div class="form-field-wrap">
        <input type="email" id="loginEmail" class="form-input" placeholder=" " autocomplete="email" required>
        <label class="form-field-label" for="loginEmail">Email</label>
      </div>
      <span class="form-error"></span>
    </div>
    <div class="form-group" id="passwordGroup">
      <div class="form-field-wrap">
        <input type="password" id="loginPassword" class="form-input" placeholder=" " autocomplete="current-password" required>
        <label class="form-field-label" for="loginPassword">Password</label>
        <button type="button" class="form-eye-toggle" aria-label="Show password">${EYE}</button>
      </div>
      <span class="form-error"></span>
    </div>
    <div class="form-row-between">
      <label class="form-checkbox"><input type="checkbox" id="rememberMe"><span>Remember me</span></label>
      <button type="button" class="form-link" id="forgotBtn">Forgot password?</button>
    </div>
    <button type="submit" class="btn auth-submit" id="loginSubmit"><span class="btn-text">Log in</span>${SPIN}</button>
  </form>
  <div class="auth-form-footer">New here? <button type="button" class="form-link" data-tab="signup">Create an account</button></div>`;

const SIGNUP_RIGHT = `
  <div class="auth-tabs">
    <button class="auth-tab" data-tab="login">Sign in</button>
    <button class="auth-tab active" data-tab="signup">Create account</button>
  </div>
  <div class="auth-card-heading">
    <h1>Start your story</h1>
    <p>Join RE:WEAR — find pieces with character.</p>
  </div>
  <form class="auth-form" id="signupForm" novalidate>
    <div class="form-row-two">
      <div class="form-group" id="firstNameGroup">
        <div class="form-field-wrap">
          <input type="text" id="firstName" class="form-input" placeholder=" " autocomplete="given-name" required>
          <label class="form-field-label" for="firstName">First name</label>
        </div>
        <span class="form-error"></span>
      </div>
      <div class="form-group" id="lastNameGroup">
        <div class="form-field-wrap">
          <input type="text" id="lastName" class="form-input" placeholder=" " autocomplete="family-name" required>
          <label class="form-field-label" for="lastName">Last name</label>
        </div>
        <span class="form-error"></span>
      </div>
    </div>
    <div class="form-group" id="emailGroup">
      <div class="form-field-wrap">
        <input type="email" id="signupEmail" class="form-input" placeholder=" " autocomplete="email" required>
        <label class="form-field-label" for="signupEmail">Email</label>
      </div>
      <span class="form-error"></span>
    </div>
    <div class="form-group" id="passwordGroup">
      <div class="form-field-wrap">
        <input type="password" id="signupPassword" class="form-input" placeholder=" " autocomplete="new-password" required>
        <label class="form-field-label" for="signupPassword">Password</label>
        <button type="button" class="form-eye-toggle" aria-label="Show password">${EYE}</button>
      </div>
      <div class="password-strength">
        <div class="strength-bar"><div class="strength-fill" id="strengthFill"></div></div>
        <span class="strength-label" id="strengthLabel">Enter a password</span>
      </div>
      <span class="form-error"></span>
    </div>
    <div class="form-group" id="confirmPasswordGroup">
      <div class="form-field-wrap">
        <input type="password" id="confirmPassword" class="form-input" placeholder=" " autocomplete="new-password" required>
        <label class="form-field-label" for="confirmPassword">Confirm password</label>
      </div>
      <span class="form-error"></span>
    </div>
    <label class="form-checkbox auth-check">
      <input type="checkbox" id="termsCheck" required>
      <span>I agree to the <a href="/how-it-works" class="form-link">Terms</a> &amp; <a href="/how-it-works" class="form-link">Privacy Policy</a></span>
    </label>
    <button type="submit" class="btn auth-submit" id="signupSubmit"><span class="btn-text">Create account</span>${SPIN}</button>
  </form>
  <div class="auth-form-footer">Already a member? <button type="button" class="form-link" data-tab="login">Sign in</button></div>`;

export default function decorate(block) {
  seedDefaults();
  const session = getSession();
  if (session) { redirectAfterLogin(session); return; }

  document.body.classList.add('auth-page');

  const card = document.createElement('div');
  card.className = 'auth-card';
  card.innerHTML = `<aside class="auth-left-col"></aside><section class="auth-right-col"></section>`;
  block.textContent = '';
  block.append(card);

  const leftCol = card.querySelector('.auth-left-col');
  const rightCol = card.querySelector('.auth-right-col');

  let tab = window.location.pathname.includes('signup') ? 'signup' : 'login';
  renderTab(tab);

  function renderTab(which) {
    tab = which;
    leftCol.innerHTML = which === 'signup' ? SIGNUP_LEFT : LOGIN_LEFT;
    rightCol.innerHTML = which === 'signup' ? SIGNUP_RIGHT : LOGIN_RIGHT;
    wire();
  }

  function wire() {
    rightCol.querySelectorAll('[data-tab]').forEach((btn) => btn.addEventListener('click', () => renderTab(btn.dataset.tab)));

    // flash message
    const msg = sessionStorage.getItem('rewear_auth_msg');
    if (msg && tab === 'login') {
      sessionStorage.removeItem('rewear_auth_msg');
      const flash = document.createElement('div');
      flash.className = 'auth-flash';
      flash.innerHTML = '<b>🔒</b> ' + msg;
      rightCol.querySelector('.auth-card-heading')?.before(flash);
    }

    // prefill
    const prefill = sessionStorage.getItem('rewear_prefill_email');
    if (prefill && tab === 'signup') {
      const el = rightCol.querySelector('#signupEmail');
      if (el) el.value = prefill;
      sessionStorage.removeItem('rewear_prefill_email');
    }

    // password toggles
    rightCol.querySelectorAll('.form-eye-toggle').forEach((btn) => {
      const input = btn.closest('.form-field-wrap')?.querySelector('input');
      if (!input) return;
      btn.addEventListener('click', () => {
        const hide = input.type === 'password';
        input.type = hide ? 'text' : 'password';
        btn.querySelector('svg').innerHTML = hide
          ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
          : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
      });
    });

    // strength
    const pwEl = rightCol.querySelector('#signupPassword');
    const fill = rightCol.querySelector('#strengthFill');
    const label = rightCol.querySelector('#strengthLabel');
    if (pwEl && fill) {
      pwEl.addEventListener('input', () => {
        const s = getStrength(pwEl.value);
        fill.className = `strength-fill ${s.cls}`;
        if (label) { label.textContent = s.label; label.style.color = s.color; }
      });
    }

    rightCol.querySelectorAll('.form-input').forEach((input) => {
      input.addEventListener('blur', () => validateField(input));
      input.addEventListener('input', () => clearErr(input));
    });

    rightCol.querySelector('#forgotBtn')?.addEventListener('click', () => {
      const email = rightCol.querySelector('#loginEmail')?.value.trim();
      alert(email ? `If an account exists for ${email}, a reset link would be sent. (Demo)` : 'Enter your email above first.');
    });

    const loginForm = rightCol.querySelector('#loginForm');
    if (loginForm) loginForm.addEventListener('submit', onLogin);
    const signupForm = rightCol.querySelector('#signupForm');
    if (signupForm) signupForm.addEventListener('submit', onSignup);
  }

  function getStrength(pw) {
    let s = 0;
    if (pw.length >= 8) s++; if (pw.length >= 12) s++;
    if (/[A-Z]/.test(pw)) s++; if (/[0-9]/.test(pw)) s++; if (/[^A-Za-z0-9]/.test(pw)) s++;
    if (s <= 1) return { cls: 'weak', label: 'Weak', color: '#C44242' };
    if (s <= 2) return { cls: 'fair', label: 'Fair', color: '#BA7517' };
    if (s <= 3) return { cls: 'good', label: 'Good', color: '#639922' };
    return { cls: 'strong', label: 'Strong', color: '#1D9E75' };
  }

  function validateField(input) {
    let msg = '';
    if (!input.value.trim()) msg = 'This field is required';
    else if (input.type === 'email' && !isEmail(input.value)) msg = 'Please enter a valid email';
    else if (input.id === 'signupPassword' && input.value.length < 8) msg = 'At least 8 characters required';
    else if (input.id === 'confirmPassword') {
      const pw = rightCol.querySelector('#signupPassword');
      if (pw && input.value !== pw.value) msg = "Passwords don't match";
    } else if (input.id === 'firstName' && input.value.trim().length < 2) msg = 'Enter your first name';
    const group = input.closest('.form-group');
    const err = group?.querySelector('.form-error');
    group?.classList.toggle('has-error', !!msg);
    if (err) err.textContent = msg;
    return !msg;
  }
  function clearErr(input) {
    const group = input.closest('.form-group');
    group?.classList.remove('has-error');
    const err = group?.querySelector('.form-error');
    if (err) err.textContent = '';
  }
  function showBanner(form, html) {
    let b = form.querySelector('.form-banner-error');
    if (!b) { b = document.createElement('div'); b.className = 'form-banner-error'; form.prepend(b); }
    b.innerHTML = html;
    b.querySelectorAll('[data-tab]').forEach((btn) => btn.addEventListener('click', () => renderTab(btn.dataset.tab)));
  }

  async function onLogin(e) {
    e.preventDefault();
    const form = e.currentTarget;
    if (![...form.querySelectorAll('.form-input[required]')].map(validateField).every(Boolean)) return;
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
      showBanner(form, 'No account found with this email. <button type="button" class="form-link" data-tab="signup">Sign up?</button>');
      return;
    }
    if (!checkPw(pw, user.passwordHash)) { btn.disabled = false; txt.textContent = 'Log in'; showBanner(form, 'Incorrect password. Please try again.'); return; }
    if (user.suspended) { btn.disabled = false; txt.textContent = 'Log in'; showBanner(form, 'This account has been suspended.'); return; }
    setSession(user);
    txt.textContent = '✓ Welcome back!';
    await delay(500);
    redirectAfterLogin(getSession());
  }

  async function onSignup(e) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.querySelector('#termsCheck').checked) { showBanner(form, 'Please accept the Terms of Service to continue.'); return; }
    if (![...form.querySelectorAll('.form-input[required]')].map(validateField).every(Boolean)) return;
    const btn = form.querySelector('.auth-submit');
    const txt = btn.querySelector('.btn-text');
    btn.disabled = true; txt.textContent = 'Creating account…';
    await delay(600);
    const firstName = form.querySelector('#firstName').value.trim();
    const lastName = form.querySelector('#lastName').value.trim();
    const email = form.querySelector('#signupEmail').value.trim();
    const pw = form.querySelector('#signupPassword').value;
    if (findByEmail(email)) { btn.disabled = false; txt.textContent = 'Create account'; showBanner(form, 'An account with this email already exists. <button type="button" class="form-link" data-tab="login">Sign in?</button>'); return; }
    const role = email.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'buyer';
    const newUser = { id: `USR-${Date.now()}`, firstName, lastName, name: `${firstName} ${lastName}`, email, passwordHash: hashPw(pw), role, joinedAt: new Date().toISOString() };
    const users = getUsers(); users.push(newUser); saveUsers(users);
    setSession(newUser);
    txt.textContent = '✓ Account created!';
    await delay(600);
    redirectAfterLogin(getSession());
  }
}