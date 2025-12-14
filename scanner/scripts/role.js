// role.js - shared shell for role pages
document.addEventListener('DOMContentLoaded', () => {
import { getSession, isAuthenticated, getRole } from './auth.js';
import { getScannerState, getNextAssignment } from './apiClient.js';
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
      btn.onclick = () => {
        // No-op: just a UI toggle, no business logic
      };
      panel.appendChild(btn);
    }
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

document.addEventListener('DOMContentLoaded', bootstrap);
