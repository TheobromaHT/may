const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('.desktop-nav');
const currentFile = location.pathname.split('/').pop() || 'index.html';

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
