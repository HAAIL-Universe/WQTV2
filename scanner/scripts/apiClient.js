
// Assignment API: POST /assignments/next
export async function getNextAssignment(token, { device_id, company_id, role }) {
  if (MOCK_MODE) {
    // Deterministic mock assignment (no logic)
    return {
      assignment_id: 'mock-assign-001',
      customer: 'Acme Corp',
      order_label: 'Order #A123',
      zone: 'Z1',
      route: 'R2',
      started_at: new Date().toISOString(),
      // Add more static fields as needed
    };
  }
  const resp = await fetch(`${API_BASE_URL}/assignments/next`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ device_id, company_id, role }),
  });
  if (!resp.ok) throw new Error('Failed to get next assignment');
  return await resp.json();
}
// apiClient.js - all API calls go through here
import { API_BASE_URL, MOCK_MODE } from './config.js';


// Temporary mock: code-to-role mapping
const MOCK_ROLE_MAP = {
  '12345': 'picker',
  '54321': 'operative',
};

export async function loginWithCode(code) {
  if (MOCK_MODE) {
    const role = MOCK_ROLE_MAP[code];
    if (role) {
      // Mock session fields
      return {
        success: true,
        session: {
          token: 'mock-token',
          role,
          company_id: 'mock-company',
          device_id: 'mock-device',
          user_id: 'mock-user',
        }
      };
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
  return {
    success: true,
    session: {
      token: data.token,
      role: data.role,
      company_id: data.company_id,
      device_id: data.device_id,
      user_id: data.user_id,
    }
  };
}

export async function getScannerState(token) {
  if (MOCK_MODE) {
    // Deterministic fake state for picker
    return {
      header: 'Picker',
      queueCount: 0,
      lastUpdated: new Date().toISOString(),
      metrics: {
        live_rate_display: '—',
        total_units: 0,
        perf_score_display: '—',
      },
      assignment: {
        active: false
      }
    };
  }
  const resp = await fetch(`${API_BASE_URL}/scanner/state`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!resp.ok) throw new Error('Failed to fetch state');
  return await resp.json();
}
