// connectivity.js - browser online/offline status helper
// Exposes subscribe/unsubscribe and current state

const listeners = new Set();

function notifyAll() {
  const online = navigator.onLine;
  listeners.forEach(fn => fn(online));
}

export function subscribeConnectivity(fn) {
  listeners.add(fn);
  fn(navigator.onLine);
  if (listeners.size === 1) {
    window.addEventListener('online', notifyAll);
    window.addEventListener('offline', notifyAll);
  }
}

export function unsubscribeConnectivity(fn) {
  listeners.delete(fn);
  if (listeners.size === 0) {
    window.removeEventListener('online', notifyAll);
    window.removeEventListener('offline', notifyAll);
  }
}

export function isOnline() {
  return navigator.onLine;
}
