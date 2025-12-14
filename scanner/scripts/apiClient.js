
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
import * as eventQueue from './eventQueue.js';

// Emit an event (offline-first, durable queue)
export async function emitEvent(event_type, payload, session) {
  // Compose event
  const { device_id, company_id, user_id } = session || {};
  const event = eventQueue.makeEvent({ event_type, payload, device_id, company_id, user_id });
  let sent = false, queued = false;
  if (navigator.onLine) {
    try {
      const resp = await fetch(`${API_BASE_URL}/events/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session && session.token ? { 'Authorization': `Bearer ${session.token}` } : {})
        },
        body: JSON.stringify({ events: [event] })
      });
      if (resp.ok) {
        const data = await resp.json();
        // Per-event status
        const status = data && data.status && data.status[0];
        if (status && (status.result === 'accepted' || status.result === 'duplicate')) {
          sent = true;
        } else {
          // Rejected or unknown: queue it
          eventQueue.enqueue(event);
          queued = true;
        }
      } else {
        // Network/server error: queue it
        eventQueue.enqueue(event);
        queued = true;
      }
    } catch (e) {
      eventQueue.enqueue(event);
      queued = true;
    }
  } else {
    eventQueue.enqueue(event);
    queued = true;
  }
  return { sent, queued };
}


// Sync lock to prevent concurrent syncs
let syncInProgress = false;
export async function syncEventQueue(session) {
  if (!navigator.onLine || syncInProgress) return;
  syncInProgress = true;
  try {
    const batch = eventQueue.peekBatch(25);
    if (!batch.length) {
      syncInProgress = false;
      return;
    }
    const resp = await fetch(`${API_BASE_URL}/events/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session && session.token ? { 'Authorization': `Bearer ${session.token}` } : {})
      },
      body: JSON.stringify({ events: batch })
    });
    if (!resp.ok) {
      syncInProgress = false;
      return;
    }
    const data = await resp.json();
    if (data && Array.isArray(data.status)) {
      const toRemove = [], toReject = [], rejectReasons = {};
      data.status.forEach((s, i) => {
        if (s.result === 'accepted' || s.result === 'duplicate') {
          toRemove.push(batch[i].client_event_id);
        } else if (s.result === 'rejected') {
          toReject.push(batch[i].client_event_id);
          rejectReasons[batch[i].client_event_id] = s.reason || 'rejected by server';
        }
      });
      if (toRemove.length) eventQueue.markBatchDone(toRemove);
      if (toReject.length) {
        toReject.forEach(id => eventQueue.markBatchRejected([id], rejectReasons[id]));
      }
    }
  } catch (e) {
    // Network error: do nothing, will retry later
  } finally {
    syncInProgress = false;
  }
}


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
