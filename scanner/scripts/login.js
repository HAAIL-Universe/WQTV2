// login.js - login page logic

import { loginWithCode } from './apiClient.js';
import { setSession } from './auth.js';
import { routeAfterLogin } from './router.js';
import { getDeviceShortId } from './deviceId.js';
import { subscribeConnectivity } from './connectivity.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const codeInput = document.getElementById('code-input');
  const statusPill = document.getElementById('status-pill');
  const deviceIdSpan = document.getElementById('device-id');


  // Connectivity status pill
  function updateStatusPill(online) {
    statusPill.textContent = online ? 'Online' : 'Offline';
    statusPill.classList.toggle('online', online);
    statusPill.classList.toggle('offline', !online);
  }
  subscribeConnectivity(updateStatusPill);

  // Device ID (short form)
  deviceIdSpan.textContent = getDeviceShortId();

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
    if (result.success && result.session) {
      setSession(result.session);
      if (['picker', 'operative'].includes(result.session.role)) {
        routeAfterLogin(result.session.role);
      } else {
        setSession(null);
        alert('Unknown role: ' + (result.session.role || 'none'));
      }
    } else {
      alert(result.error || 'Login failed');
    }
    form.querySelectorAll('button').forEach(btn => btn.disabled = false);
  });

  document.getElementById('create-user-btn').addEventListener('click', () => {
    alert('User creation not implemented.');
  });
});
