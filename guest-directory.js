const GUEST_DIRECTORY_API = 'https://script.google.com/macros/s/AKfycbxwrzF8av2VzyuAPjtA_bOyB-H6LvwLF6Cv_Ubq3P0rccsiXzUp3wIObxc23LQz7a5cig/exec';

const guestGrid = document.querySelector('#guest-directory-grid');
const guestListView = document.querySelector('#guest-list-view');
const guestProfileView = document.querySelector('#guest-profile-view');
const guestCount = document.querySelector('#guest-count');
const guestBack = document.querySelector('#guest-back');
const guestCache = new Map();

function guestImageUrl(url) {
  if (!url) return '';
  const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/) || url.match(/id=([a-zA-Z0-9-_]+)/);
  return driveMatch ? `https://drive.google.com/uc?export=view&id=${driveMatch[1]}` : url;
}

function safeText(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

function buildCard(guest, index) {
  const card = document.createElement('button');
  const name = safeText(guest.name || '이름 미등록');
  const imageUrl = guestImageUrl(guest.img);
  const label = guest.isNpc ? 'HOTEL RECORD / NPC' : `STAFF RECORD / ${String(index + 1).padStart(2, '0')}`;
  card.type = 'button';
  card.className = 'guest-record-card';
  card.innerHTML = `
    <span class="guest-record-label">${label}</span>
    <span class="guest-record-image">${imageUrl ? `<img src="${safeText(imageUrl)}" alt="${name} 초상">` : '<span>STAFF<br>PORTRAIT</span>'}</span>
    <strong>${name}</strong>
    <span class="guest-record-open">RECORD OPEN <i>↗</i></span>`;
  card.addEventListener('click', () => openGuestProfile(guest.name));
  return card;
}

function showList() {
  guestProfileView.hidden = true;
  guestListView.hidden = false;
  if (location.hash === '#profile') history.replaceState({}, '', location.pathname);
}

function setProfilePortrait(guest) {
  const portrait = document.querySelector('#guest-profile-portrait');
  const imageUrl = guestImageUrl(guest.img);
  portrait.innerHTML = imageUrl ? `<img src="${safeText(imageUrl)}" alt="${safeText(guest.name)} 초상">` : '<span>STAFF<br>PORTRAIT</span>';
}

function applyImportedDocument(html) {
  const parser = new DOMParser();
  const documentFragment = parser.parseFromString(html || '', 'text/html');
  documentFragment.querySelectorAll('script, iframe, object, embed, form, input, button, style, link, meta').forEach((element) => element.remove());
  documentFragment.querySelectorAll('*').forEach((element) => {
    [...element.attributes].forEach((attribute) => {
      if (attribute.name.startsWith('on') || attribute.name === 'style' || attribute.name === 'class') element.removeAttribute(attribute.name);
      if ((attribute.name === 'href' || attribute.name === 'src') && /^javascript:/i.test(attribute.value)) element.removeAttribute(attribute.name);
    });
  });
  return documentFragment.body.innerHTML || '<p>등록된 상세 기록이 없습니다.</p>';
}

async function openGuestProfile(name) {
  const guest = guestCache.get(name);
  if (!guest) return;
  guestListView.hidden = true;
  guestProfileView.hidden = false;
  document.querySelector('#guest-profile-name').textContent = guest.name || '이름 미등록';
  document.querySelector('#guest-profile-type').textContent = guest.isNpc ? 'HOTEL RECORD / NPC' : 'THEOBROMA / STAFF RECORD';
  document.querySelector('#guest-hp').textContent = guest.hp ?? '-';
  document.querySelector('#guest-str').textContent = guest.str ?? '-';
  document.querySelector('#guest-agi').textContent = guest.agi ?? '-';
  document.querySelector('#guest-luk').textContent = guest.luk ?? '-';
  setProfilePortrait(guest);
  const documentPanel = document.querySelector('#guest-profile-document');
  documentPanel.innerHTML = '<p class="guest-document-loading">기록을 불러오는 중입니다.</p>';
  history.pushState({ view: 'guest-profile', name }, '', '#profile');
  guestProfileView.scrollIntoView({ behavior: 'smooth', block: 'start' });
  try {
    const response = await fetch(`${GUEST_DIRECTORY_API}?action=detail&name=${encodeURIComponent(name)}`, { redirect: 'follow' });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    if (!data.success) throw new Error('상세 기록을 불러오지 못했습니다.');
    documentPanel.innerHTML = applyImportedDocument(data.html);
  } catch (error) {
    documentPanel.innerHTML = `<p class="guest-document-error">${safeText(error.message || '상세 기록을 불러오지 못했습니다.')}</p>`;
  }
}

async function loadGuestDirectory() {
  try {
    const response = await fetch(`${GUEST_DIRECTORY_API}?action=list`, { redirect: 'follow' });
    const data = await response.json();
    if (!data.success || !Array.isArray(data.list) || data.list.length === 0) throw new Error('등록된 직원 기록이 없습니다.');
    guestGrid.innerHTML = '';
    data.list.forEach((guest, index) => {
      guestCache.set(guest.name, guest);
      guestGrid.append(buildCard(guest, index));
    });
    guestCount.textContent = `STAFF RECORDS / ${String(data.list.length).padStart(2, '0')}`;
  } catch (error) {
    guestGrid.innerHTML = `<p class="directory-error">${safeText(error.message || '직원 기록을 불러오지 못했습니다.')}</p>`;
    guestCount.textContent = 'STAFF RECORDS / ERROR';
  }
}

guestBack?.addEventListener('click', showList);
window.addEventListener('popstate', () => { if (location.hash !== '#profile') showList(); });
loadGuestDirectory();
