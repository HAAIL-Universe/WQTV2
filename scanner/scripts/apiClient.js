// apiClient.js - all API calls go through here
import { API_BASE_URL, MOCK_MODE } from './config.js';

// Temporary mock: code-to-role mapping
const MOCK_ROLE_MAP = {
  '12345': 'picker',
  '54321': 'operative',
};

export async function loginWithCode(code) {
  if (MOCK_MODE) {
    // --- TEMPORARY MOCK BRANCH ---
    const role = MOCK_ROLE_MAP[code];
    if (role) {
      return { success: true, token: 'mock-token', role };
    } else {
      return { success: false, error: 'Invalid code' };
    }
  }
  // Real API call
  const resp = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });
  if (!resp.ok) return { success: false, error: 'Login failed' };
  const data = await resp.json();
  return { success: true, token: data.token, role: data.role };
}
