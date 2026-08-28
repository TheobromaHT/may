const STAFF_LOGIN_API = 'https://script.google.com/macros/s/AKfycbwIHN-h472oc3QL5KaX_mbMWQ7nE2tzvLLp2tx5bA6piw6sQtIMArCk5pSw1kRlR_dSMQ/exec';
const EMERGENCY_PASSWORDS = ['4560', 'rlfkxlsk'];
const MEMBER_AUTH_KEY = 'theobroma_member_authenticated_v2';
const STAFF_LOGIN_PASSWORD_KEY = 'theobroma_staff_login_password';
const loginForm = document.querySelector('#member-login-form');
const loginInput = document.querySelector('#member-password');
const loginError = document.querySelector('#member-login-error');
const loginButton = loginForm.querySelector('button');

function setMemberAuthenticated() {
  try { sessionStorage.setItem(MEMBER_AUTH_KEY, 'yes'); } catch (_) {}
  if (!window.name.split('|').includes(MEMBER_AUTH_KEY)) {
    window.name = [window.name, MEMBER_AUTH_KEY].filter(Boolean).join('|');
  }
}

function getDestination() {
  const requested = new URLSearchParams(location.search).get('next') || 'index.html';
  return /^(?:guests|guest-profile|staff|staff-profile)\.html(?:[?#].*)?$/.test(requested) ? requested : 'index.html';
}

loginInput.addEventListener('input', () => {
  const allowedCharacters = loginInput.value.replace(/[^A-Za-z0-9]/g, '');
  if (loginInput.value !== allowedCharacters) loginInput.value = allowedCharacters;
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const password = loginInput.value;
  if (!password) return;

  loginButton.disabled = true;
  loginError.textContent = '직원 기록을 확인하고 있습니다.';

  try {
    const response = await fetch(STAFF_LOGIN_API, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'login', password })
    });
    const result = await response.json();
    if (!result.success && !EMERGENCY_PASSWORDS.includes(password)) {
      loginError.textContent = result.msg || '비밀번호가 올바르지 않습니다.';
      loginInput.select();
      return;
    }
  } catch (_) {
    if (!EMERGENCY_PASSWORDS.includes(password)) {
      loginError.textContent = '로그인 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.';
      return;
    }
  } finally {
    loginButton.disabled = false;
  }

  setMemberAuthenticated();
  try { sessionStorage.setItem(STAFF_LOGIN_PASSWORD_KEY, password); } catch (_) {}
  location.replace(getDestination());
});
