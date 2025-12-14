// login.js - login page logic
import { loginWithCode } from './apiClient.js';
import { setSession } from './auth.js';
import { routeAfterLogin } from './router.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const codeInput = document.getElementById('code-input');
  const statusPill = document.getElementById('status-pill');
  const deviceIdSpan = document.getElementById('device-id');

  // Online status
  function updateStatus() {
    statusPill.textContent = navigator.onLine ? 'Online' : 'Offline';
    statusPill.style.background = navigator.onLine ? '#2ecc40' : '#e67e22';
  }
  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);
  updateStatus();

  // Device ID (mock: use userAgent hash)
  function getDeviceId() {
    let ua = navigator.userAgent;
    let hash = 0;
    for (let i = 0; i < ua.length; i++) hash = ((hash << 5) - hash) + ua.charCodeAt(i);
    return 'DEV-' + Math.abs(hash).toString().slice(0, 8);
  }
  deviceIdSpan.textContent = getDeviceId();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = codeInput.value.trim();
    if (!/^\d{5}$/.test(code)) {
      codeInput.setCustomValidity('Enter a 5-digit code');
      codeInput.reportValidity();
      return;
    }
    codeInput.setCustomValidity('');
    form.querySelectorAll('button').forEach(btn => btn.disabled = true);
    const result = await loginWithCode(code);
    if (result.success) {
      setSession(result.token, result.role);
      routeAfterLogin(result.role);
    } else {
      alert(result.error || 'Login failed');
    }
    form.querySelectorAll('button').forEach(btn => btn.disabled = false);
  });

  document.getElementById('create-user-btn').addEventListener('click', () => {
    alert('User creation not implemented.');
  });
});
