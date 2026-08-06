const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('.desktop-nav');
const THEOBROMA_PASSWORD = '4560';
const AUTH_SESSION_KEY = 'theobroma_authenticated';
const currentFile = location.pathname.split('/').pop() || 'index.html';
const protectedPages = new Set(['staff.html', 'staff-profile.html', 'guests.html', 'guest-profile.html']);

function isAuthenticated() {
  try {
    if (sessionStorage.getItem(AUTH_SESSION_KEY) === 'yes') return true;
  } catch (_) {}
  return window.name.split('|').includes(AUTH_SESSION_KEY);
}

function authenticate(password) {
  if (password !== THEOBROMA_PASSWORD) return false;
  try { sessionStorage.setItem(AUTH_SESSION_KEY, 'yes'); } catch (_) {}
  if (!window.name.split('|').includes(AUTH_SESSION_KEY)) window.name = [window.name, AUTH_SESSION_KEY].filter(Boolean).join('|');
  return true;
}

function clearAuthentication() {
  try { sessionStorage.removeItem(AUTH_SESSION_KEY); } catch (_) {}
  window.name = window.name.split('|').filter((part) => part && part !== AUTH_SESSION_KEY).join('|');
}

function createLoginPanel({ lockedPage = false } = {}) {
  const backdrop = document.createElement('div');
  backdrop.className = `login-backdrop${lockedPage ? ' page-lock' : ''}`;
  backdrop.innerHTML = `
    <section class="login-panel" role="dialog" aria-modal="true" aria-labelledby="login-title">
      <p class="chapter-kicker">THEOBROMA / PRIVATE ACCESS</p>
      <h2 id="login-title">${lockedPage ? '로그인이 필요한 페이지입니다' : '로그인'}</h2>
      <p class="login-description">직원 및 투숙객 명부를 열람하려면 비밀번호를 입력해 주세요.</p>
      <form class="login-form">
        <label for="site-password">비밀번호</label>
        <input id="site-password" name="password" type="password" inputmode="numeric" autocomplete="current-password" required autofocus>
        <p class="login-error" aria-live="polite"></p>
        <button type="submit">로그인</button>
      </form>
      ${lockedPage ? '<a class="login-home" href="index.html">메인으로 돌아가기</a>' : '<button class="login-close" type="button" aria-label="로그인 창 닫기">닫기</button>'}
    </section>`;
  document.body.append(backdrop);
  document.body.classList.add('login-open');

  const input = backdrop.querySelector('input');
  const error = backdrop.querySelector('.login-error');
  backdrop.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    if (!authenticate(input.value)) {
      error.textContent = '비밀번호가 올바르지 않습니다.';
      input.select();
      return;
    }
    if (lockedPage) location.reload();
    else {
      backdrop.remove();
      document.body.classList.remove('login-open');
      updateLoginButton();
    }
  });
  backdrop.querySelector('.login-close')?.addEventListener('click', () => {
    backdrop.remove();
    document.body.classList.remove('login-open');
  });
}

function updateLoginButton() {
  const button = document.querySelector('.auth-login');
  if (!button) return;
  button.textContent = isAuthenticated() ? '로그인 완료' : '로그인';
  button.classList.toggle('is-authenticated', isAuthenticated());
}

const localFontStylesheet = document.createElement('link');
localFontStylesheet.rel = 'stylesheet';
localFontStylesheet.href = 'fonts.css';
document.head.append(localFontStylesheet);

if (nav) {
  nav.innerHTML = `
    <a href="notice.html">공지사항</a>
    <a href="world.html">세계관</a>
    <a href="character-guide.html">캐릭터 가이드</a>
    <a href="system.html">시스템</a>
    <a href="guests.html">투숙객</a>
    <a href="staff.html">직원</a>
  `;
}

const siteHeader = document.querySelector('.site-header');
if (siteHeader) {
  const loginButton = document.createElement('button');
  loginButton.type = 'button';
  loginButton.className = 'auth-login';
  loginButton.addEventListener('click', () => {
    if (isAuthenticated()) {
      clearAuthentication();
      updateLoginButton();
      if (protectedPages.has(currentFile)) location.href = 'index.html';
      return;
    }
    createLoginPanel();
  });
  siteHeader.append(loginButton);
  updateLoginButton();
}

if (protectedPages.has(currentFile) && !isAuthenticated()) createLoginPanel({ lockedPage: true });

menu?.addEventListener('click', () => {
  const opened = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!opened));
  nav?.classList.toggle('is-open', !opened);
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', () => {
    menu?.setAttribute('aria-expanded', 'false');
    nav?.classList.remove('is-open');
  });
});

function setManagedText(element, value) {
  element.textContent = value;
  element.style.whiteSpace = 'pre-line';
}

function applyManagedContent() {
  const fileName = currentFile;
  const pageKey = fileName === 'staff-profile.html' && location.search ? `${fileName}${location.search}` : fileName;
  const pageContent = window.THEOBROMA_CONTENT?.[pageKey] || window.THEOBROMA_CONTENT?.[fileName];
  if (!pageContent) return;

  Object.entries(pageContent).forEach(([selector, content]) => {
    const element = document.querySelector(selector);
    if (!element || !content) return;
    if (typeof content.text === 'string') setManagedText(element, content.text);
    if (typeof content.href === 'string' && content.href.trim()) element.setAttribute('href', content.href.trim());
  });
}

if ((location.pathname.split('/').pop() || '') === 'staff.html') {
  document.querySelectorAll('.staff-grid > a').forEach((link, index) => {
    link.href = `staff-profile.html?id=${index + 1}`;
  });
}

const contentScript = document.createElement('script');
contentScript.src = 'site-content.js';
contentScript.addEventListener('load', applyManagedContent);
document.head.append(contentScript);
