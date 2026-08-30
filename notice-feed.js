const NOTICE_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxj_2AirYSOyYX7eIW2uKcme_CWQ3YIsd0Qr-301JpQH3ht6o-tsThcaRz91Xm8p2Wh/exec';
const noticeFeed = document.querySelector('#notice-feed');

function showNotice(text, isError = false) {
  noticeFeed.innerHTML = '';
  const content = document.createElement('div');
  content.className = 'notice-remote-content';
  content.textContent = text;
  if (isError) content.classList.add('notice-remote-error');
  noticeFeed.append(content);
}

function readResponse(raw) {
  try {
    const data = JSON.parse(raw);
    if (typeof data === 'string') return data;
    return data.content || data.text || data.notice || data.html || JSON.stringify(data, null, 2);
  } catch {
    return raw;
  }
}

function showHtml(html) {
  const documentFromFeed = new DOMParser().parseFromString(html, 'text/html');
  const originalCss = [...documentFromFeed.querySelectorAll('style')]
    .map((style) => style.textContent)
    .join('\n');
  const classStyles = new Map();
  for (const match of originalCss.matchAll(/\.([\w-]+)\s*\{([^}]*)\}/g)) {
    classStyles.set(match[1], match[2]);
  }
  documentFromFeed.querySelectorAll('script, style, link, meta, title').forEach((element) => element.remove());
  documentFromFeed.querySelectorAll('*').forEach((element) => {
    element.classList.forEach((className) => {
      const css = classStyles.get(className);
      if (css) {
        const readableCss = css.replace(/color\s*:\s*#(?:000000|1c1c1c|434343|666666)\b/gi, 'color:#f4efe5');
        element.style.cssText += `;${readableCss}`;
      }
    });
    if (element.matches('td, th')) {
      element.style.verticalAlign = 'middle';
      element.style.backgroundColor = 'transparent';
      element.style.borderColor = '#b99a63';
    }
    if (element.matches('td p, th p, td li, th li')) element.style.lineHeight = '2.15';
    [...element.attributes].forEach((attribute) => {
      if (attribute.name !== 'href' && attribute.name !== 'colspan' && attribute.name !== 'rowspan' && attribute.name !== 'style') {
        element.removeAttribute(attribute.name);
      }
    });
  });
  [...documentFromFeed.body.querySelectorAll('p, h1, h2, h3')].forEach((element) => {
    if (element.textContent.trim() === '✅ 공지') element.remove();
  });
  [...documentFromFeed.body.querySelectorAll('p, h1, h2, h3, td, th')].forEach((element) => {
    if (!['경고 목록', '강제 제명 목록'].includes(element.textContent.trim())) return;
    const cell = element.closest('td, th');
    if (cell) {
      cell.style.textAlign = 'left';
      cell.style.verticalAlign = 'middle';
      cell.style.paddingLeft = '22px';
      const table = cell.closest('table');
      if (table) table.style.margin = '4rem 0 2.5rem';
    }
  });
  noticeFeed.innerHTML = '';
  const content = document.createElement('div');
  content.className = 'notice-remote-content';
  content.innerHTML = documentFromFeed.body.innerHTML;
  noticeFeed.append(content);
}

fetch(NOTICE_ENDPOINT, { cache: 'no-store' })
  .then((response) => {
    if (!response.ok) throw new Error('공지 데이터를 불러오지 못했습니다.');
    return response.text();
  })
  .then((raw) => {
    const text = readResponse(raw).trim();
    if (!text || /accounts\.google\.com|로그인|Sign in/i.test(text)) {
      throw new Error('공지 데이터에 접근할 수 없습니다.');
    }
    if (/<[a-z][\s\S]*>/i.test(text)) showHtml(text);
    else showNotice(text);
  })
  .catch(() => showNotice('공지 내용을 불러오지 못했습니다. 관리자에게 문의해 주세요.', true));
