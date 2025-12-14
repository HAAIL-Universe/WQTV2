// role.js - shared shell for role pages
document.addEventListener('DOMContentLoaded', () => {
import { getSession, isAuthenticated, getRole } from './auth.js';
import { getScannerState, getNextAssignment, emitEvent, syncEventQueue } from './apiClient.js';
import * as eventQueue from './eventQueue.js';
import { subscribeConnectivity } from './connectivity.js';

function getPageRole() {
  // Infer from file name
  if (window.location.pathname.includes('picker')) return 'picker';
  if (window.location.pathname.includes('operative')) return 'operative';
  return null;
}

function redirectToLogin() {
  window.location.href = 'index.html';
}

function redirectToRole(role) {
  if (role === 'picker') window.location.href = 'picker.html';
  else if (role === 'operative') window.location.href = 'operative.html';
  else redirectToLogin();
}

async function bootstrap() {
  // Guard: must be authenticated
  if (!isAuthenticated()) {
    redirectToLogin();
    return;
  }
  const session = getSession();
  const userRole = session && session.role;
  const pageRole = getPageRole();
  if (userRole !== pageRole) {
    redirectToRole(userRole);
    return;
  }

  // Picker-specific tab logic (QuickCalc/Tracker)
  const tabBtns = document.querySelectorAll('.pill-tab');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.toggle('active', b === btn));
      // No panel switching, just UI toggle
    });
  });

  // User pill
  const userPill = document.getElementById('user-pill');
  if (userPill && session && session.display_name) {
    userPill.textContent = session.display_name;
  } else if (userPill) {
    userPill.textContent = session && session.user_id ? session.user_id : '--';
  }

  // Render read model
  const headerEl = document.querySelector('.role-header');
  let statusStrip = document.getElementById('status-strip');
  if (!statusStrip) {
    statusStrip = document.createElement('div');
    statusStrip.id = 'status-strip';
    statusStrip.style = 'display:flex;gap:1.5em;align-items:center;justify-content:flex-end;font-size:1.01rem;opacity:0.85;margin:0.5em 2em 0 0;';
    headerEl.parentNode.insertBefore(statusStrip, headerEl.nextSibling);
  }

  // Connectivity
  let online = navigator.onLine;
  function updateStatusStrip() {
    statusStrip.innerHTML = `<span class="status-pill ${online ? 'online' : 'offline'}">${online ? 'Online' : 'Offline'}</span> <span id="queue-count">Queue: 0</span>`;
  }
  subscribeConnectivity(val => { online = val; updateStatusStrip(); });
  updateStatusStrip();

    function updateQueueCount() {
      const queueEl = statusStrip.querySelector('#queue-count');
      if (queueEl) queueEl.textContent = `Queue: ${eventQueue.getCount()}`;
    }

    // Listen for queue changes (localStorage event for multi-tab)
    window.addEventListener('storage', e => {
      if (e.key === 'wqt_event_queue_v2') updateQueueCount();
    });

    // Listen for online/offline
    window.addEventListener('online', () => {
      online = true;
      updateStatusStrip();
      syncEventQueue(getSession());
    });
    window.addEventListener('offline', () => {
      online = false;
      updateStatusStrip();
    });

    // Opportunistically sync on load
    if (online) setTimeout(() => syncEventQueue(getSession()), 500);


  // Render picker metrics and assignment
  async function renderPickerState(state) {
    // Metrics
    document.getElementById('live-rate-display').textContent = (state.metrics && state.metrics.live_rate_display) || '—';
    document.getElementById('total-units-display').textContent = (state.metrics && typeof state.metrics.total_units === 'number') ? state.metrics.total_units : 0;
    document.getElementById('perf-score-display').textContent = (state.metrics && state.metrics.perf_score_display) || '—';

    // Assignment panel
    const panel = document.getElementById('assignment-panel');
    panel.innerHTML = '';
    const title = document.createElement('div');
    title.className = 'assignment-title';
    title.textContent = 'ASSIGNMENT';
    panel.appendChild(title);
    if (!state.assignment || !state.assignment.active) {
      // No active assignment: show Start next order
      const btn = document.createElement('button');
      btn.className = 'assignment-btn';
      btn.id = 'start-next-order-btn';
      btn.textContent = 'Start next order';
      btn.onclick = async () => {
        btn.disabled = true;
        try {
          const assignment = await getNextAssignment(session.token, {
            device_id: session.device_id,
            company_id: session.company_id,
            role: session.role
          });
          // Emit event for assignment claimed/received
          await emitEvent('assignment_received', { assignment_id: assignment.assignment_id }, session);
          // Patch state and re-render (render-only)
          state.assignment = { active: true, ...assignment };
          renderPickerState(state);
        } catch (e) {
          btn.disabled = false;
          btn.textContent = 'Error. Retry';
        }
      };
      panel.appendChild(btn);
    } else {
      // Active assignment: show details
      const details = document.createElement('div');
      details.className = 'assignment-details';
      details.innerHTML =
        `<strong>${state.assignment.customer || ''}</strong> <br>${state.assignment.order_label || ''}` +
        (state.assignment.zone ? `<br>Zone: ${state.assignment.zone}` : '') +
        (state.assignment.route ? `, Route: ${state.assignment.route}` : '') +
        `<br>ID: <span style="opacity:0.7;">${state.assignment.assignment_id ? state.assignment.assignment_id.slice(-6) : ''}</span>` +
        (state.assignment.started_at ? `<br>Started: ${new Date(state.assignment.started_at).toLocaleTimeString()}` : '');
      panel.appendChild(details);
      const btn = document.createElement('button');
      btn.className = 'assignment-btn';
      btn.id = 'resume-assignment-btn';
      btn.textContent = 'Resume';
      btn.onclick = async () => {
        await emitEvent('assignment_resumed', { assignment_id: state.assignment.assignment_id }, session);
      };
      panel.appendChild(btn);
    }
    // Wire picker action buttons to emit events
    document.addEventListener('click', async (e) => {
      if (!(e.target instanceof HTMLElement)) return;
      const el = e.target;
      if (el.id === 'log-delay-btn') {
        await emitEvent('log_delay', { assignment_id: (window.currentAssignmentId || null) }, getSession());
      }
      if (el.id === 'shared-pick-btn') {
        await emitEvent('shared_pick', { assignment_id: (window.currentAssignmentId || null) }, getSession());
      }
      if (el.classList.contains('pill-tab') && el.dataset.tab === 'tracker') {
        // Only emit if assignment is active
        const state = await getScannerState(getSession().token);
        if (state.assignment && state.assignment.active) {
          await emitEvent('tracker_opened', { assignment_id: state.assignment.assignment_id }, getSession());
        }
      }
    });
  }

  // Fetch and render state
  try {
    const state = await getScannerState(session.token);
    if (state.header && headerEl) headerEl.textContent = state.header;
    // Render queue count if present
    if (typeof state.queueCount === 'number') {
      const queueEl = statusStrip.querySelector('#queue-count');
      if (queueEl) queueEl.textContent = `Queue: ${state.queueCount}`;
    }

      // Always update queue count from eventQueue
      updateQueueCount();
    // Last updated
    let lastUpd = document.getElementById('last-updated');
    if (!lastUpd) {
      lastUpd = document.createElement('div');
      lastUpd.id = 'last-updated';
      lastUpd.style = 'text-align:right;font-size:0.97rem;opacity:0.7;margin:0.2em 2em 0 0;';
      statusStrip.parentNode.insertBefore(lastUpd, statusStrip.nextSibling);
    }
    if (state.lastUpdated) {
      lastUpd.textContent = `Last updated: ${new Date(state.lastUpdated).toLocaleString()}`;
    }

    // Patch: ensure metrics/assignment shape for picker
    if (!state.metrics) state.metrics = {};
    if (!state.assignment) state.assignment = {};
    await renderPickerState(state);
  } catch (e) {
    // Show error in status strip
    statusStrip.innerHTML += `<span style="color:#e67e22;margin-left:1em;">State unavailable</span>`;
  }
}

// Tracker panel render and event logic
async function renderTrackerPanel(state) {
  const trackerPanel = document.getElementById('trackerPanel');
  if (!trackerPanel) return;
  // Assignment/order summary
  const assignment = state.assignment || {};
  const summary = state.order_summary || {};
  document.getElementById('trkOrderLabel').textContent = assignment.order_label || assignment.customer || '—';
  document.getElementById('trkQty').textContent = summary.qty != null ? summary.qty : '0';
  document.getElementById('trkLocations').textContent = summary.locations || '—';
  document.getElementById('trkPallets').textContent = summary.pallets || '—';
  document.getElementById('trkRate').textContent = summary.rate || '—';
  document.getElementById('trkETA').textContent = summary.eta || '—';
  // Progress
  const pct = (state.order_progress && state.order_progress.percent) || summary.progress_pct || null;
  document.getElementById('trkProgressPct').textContent = pct != null ? pct : '—';
  document.getElementById('trkProgressFill').style.width = (pct && typeof pct === 'string' && pct.endsWith('%')) ? pct : (pct ? pct + '%' : '0%');
  // Log
  const logList = document.getElementById('trkLogList');
  logList.innerHTML = '';
  const log = Array.isArray(state.order_log) ? state.order_log : [];
  if (log.length === 0) {
    logList.innerHTML = '<div style="opacity:0.6;">No log entries</div>';
  } else {
    log.forEach(entry => {
      const div = document.createElement('div');
      div.className = 'trk-log-entry';
      div.innerHTML = `<span>${entry.message || '—'}</span> <span style="opacity:0.7;font-size:0.93em;">${entry.at || ''}</span>`;
      logList.appendChild(div);
    });
  }
}

// Tracker scan capture logic
function setupTrackerScanInput(state) {
  const scanInput = document.getElementById('scanInput');
  if (!scanInput) return;
  function focusScan() { scanInput.focus(); }
  // Focus when Tracker tab is active
  document.getElementById('trackerPanel').addEventListener('focusin', focusScan);
  document.getElementById('trackerPanel').addEventListener('click', focusScan);
  // Refocus on blur
  scanInput.addEventListener('blur', () => setTimeout(focusScan, 10));
  // On Enter, emit scan_received
  scanInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      const raw = scanInput.value.trim();
      if (raw) {
        const assignment = state.assignment || {};
        const order_id = assignment.assignment_id || assignment.order_id;
        await emitEvent('scan_received', {
          raw,
          assignment_id: assignment.assignment_id,
          order_id,
          at: new Date().toISOString()
        }, getSession());
        scanInput.value = '';
        if (navigator.onLine) {
          syncEventQueue(getSession());
          await new Promise(r => setTimeout(r, 150));
          const newState = await getScannerState(getSession().token);
          renderTrackerPanel(newState);
        }
      }
    }
  });
}

// Tracker button event wiring
function setupTrackerButtons(state) {
  const assignment = state.assignment || {};
  const order_id = assignment.assignment_id || assignment.order_id;
  [
    ['btnLogWrap', 'log_wrap_requested', { assignment_id: assignment.assignment_id, order_id }],
    ['btnLogDelay', 'log_delay_requested', { assignment_id: assignment.assignment_id }],
    ['btnUndo', 'undo_requested', { assignment_id: assignment.assignment_id }],
    ['btnSharedPick', 'shared_pick_requested', { assignment_id: assignment.assignment_id }],
    ['btnBreak', 'break_toggle_requested', { assignment_id: assignment.assignment_id }],
  ].forEach(([btnId, eventType, payload]) => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.onclick = async () => {
        await emitEvent(eventType, payload, getSession());
        if (navigator.onLine) {
          syncEventQueue(getSession());
          await new Promise(r => setTimeout(r, 150));
          const newState = await getScannerState(getSession().token);
          renderTrackerPanel(newState);
        }
      };
    }
  });
}

// Tab switching logic (QuickCalc/Tracker)
function setupTabSwitching() {
  const quickCalcPanel = document.getElementById('assignment-panel');
  const trackerPanel = document.getElementById('trackerPanel');
  const pills = document.querySelectorAll('.pill-tab');
  pills.forEach(btn => {
    btn.addEventListener('click', () => {
      const isTracker = btn.dataset.tab === 'tracker';
      trackerPanel.style.display = isTracker ? '' : 'none';
      quickCalcPanel.style.display = isTracker ? 'none' : '';
      pills.forEach(b => b.classList.toggle('active', b === btn));
      if (isTracker) {
        focusScanInput();
      }
    });
  });
}

function focusScanInput() {
  const scanInput = document.getElementById('scanInput');
  if (scanInput) setTimeout(() => scanInput.focus(), 50);
}

// Patch bootstrap to call Tracker render/setup if present
const origBootstrap = bootstrap;
bootstrap = async function() {
  await origBootstrap();
  const state = await getScannerState(getSession().token);
  if (document.getElementById('trackerPanel')) {
    renderTrackerPanel(state);
    setupTrackerScanInput(state);
    setupTrackerButtons(state);
    setupTabSwitching();
  }
};

document.addEventListener('DOMContentLoaded', bootstrap);
