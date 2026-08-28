const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('.desktop-nav');
const currentFile = location.pathname.split('/').pop() || 'index.html';
const MEMBER_AUTH_KEY = 'theobroma_member_authenticated_v2';
const protectedPages = new Set(['guests.html', 'guest-profile.html', 'staff.html', 'staff-profile.html']);

function isMemberAuthenticated() {
  try {
    if (sessionStorage.getItem(MEMBER_AUTH_KEY) === 'yes') return true;
  } catch (_) {}
  return window.name.split('|').includes(MEMBER_AUTH_KEY);
}

function setMemberAuthenticated() {
  try { sessionStorage.setItem(MEMBER_AUTH_KEY, 'yes'); } catch (_) {}
  if (!window.name.split('|').includes(MEMBER_AUTH_KEY)) {
    window.name = [window.name, MEMBER_AUTH_KEY].filter(Boolean).join('|');
  }
}

function clearMemberAuthentication() {
  try { sessionStorage.removeItem(MEMBER_AUTH_KEY); } catch (_) {}
  try { sessionStorage.removeItem('theobroma_staff_login_password'); } catch (_) {}
  window.name = window.name.split('|').filter((part) => part && part !== MEMBER_AUTH_KEY).join('|');
}

function updateMemberLoginButton() {
  const button = document.querySelector('.member-login');
  if (!button) return;
  button.textContent = isMemberAuthenticated() ? '로그아웃' : '로그인';
  button.classList.toggle('is-authenticated', isMemberAuthenticated());
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
  loginButton.className = 'member-login';
  loginButton.addEventListener('click', () => {
    if (isMemberAuthenticated()) {
      clearMemberAuthentication();
      updateMemberLoginButton();
      if (protectedPages.has(currentFile)) location.href = 'index.html';
      return;
    }
    const destination = `${currentFile}${location.search}${location.hash}`;
    location.href = `login.html?next=${encodeURIComponent(destination)}`;
  });
  siteHeader.append(loginButton);
  updateMemberLoginButton();
}

if (protectedPages.has(currentFile) && !isMemberAuthenticated()) {
  const destination = `${currentFile}${location.search}${location.hash}`;
  location.replace(`login.html?next=${encodeURIComponent(destination)}`);
}

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
