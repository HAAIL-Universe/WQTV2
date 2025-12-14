// eventQueue.js - Durable offline event queue for WQT v2 scanner
// No business logic, just mechanical storage

const QUEUE_KEY = 'wqt_event_queue_v2';

function loadQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveQueue(queue) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    // Storage full or unavailable
  }
}

function uuidv4() {
  // RFC4122 version 4 compliant
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

let queue = loadQueue();


export function enqueue(event) {
  // Backward compatibility: upgrade old events
  const upgraded = {
    status: 'queued',
    retries: 0,
    last_error: null,
    last_attempt_at: null,
    ...event
  };
  queue.push(upgraded);
  saveQueue(queue);
}

export function getCount() {
  return queue.length;
}

export function peekBatch(limit = 25) {
  return queue.slice(0, limit);
}


export function markBatchDone(client_event_ids) {
  let changed = false;
  queue = queue.filter(ev => {
    if (client_event_ids.includes(ev.client_event_id)) {
      changed = true;
      return false;
    }
    return true;
  });
  if (changed) saveQueue(queue);
}


export function markBatchRejected(client_event_ids, error) {
  let changed = false;
  queue = queue.map(ev => {
    if (client_event_ids.includes(ev.client_event_id)) {
      changed = true;
      return {
        ...ev,
        status: 'blocked',
        last_error: error,
        retries: (ev.retries || 0) + 1,
        last_attempt_at: new Date().toISOString()
      };
    }
    return ev;
  });
  if (changed) saveQueue(queue);
}
// Helper: get blocked count
export function getBlockedCount() {
  return queue.filter(ev => ev.status === 'blocked').length;
}
// Helper: get syncing count (future use)
export function getSyncingCount() {
  return queue.filter(ev => ev.status === 'syncing').length;
}

export function load() {
  queue = loadQueue();
  return queue;
}

export function save() {
  saveQueue(queue);
}

export function makeEvent({ event_type, payload, device_id, company_id, user_id }) {
  return {
    client_event_id: uuidv4(),
    event_type,
    payload,
    created_at: new Date().toISOString(),
    device_id,
    company_id,
    user_id
  };
}
