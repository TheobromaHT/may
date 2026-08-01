const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('.desktop-nav');

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
  nav.classList.toggle('is-open', !opened);
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', () => {
    menu?.setAttribute('aria-expanded', 'false');
    nav?.classList.remove('is-open');
  });
});
