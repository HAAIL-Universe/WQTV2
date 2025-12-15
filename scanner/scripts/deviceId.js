// deviceId.js - stable device identifier utility
// Generates and persists a UUID in localStorage, exposes full and short forms

const DEVICE_ID_KEY = 'wqt_device_id';

function generateUUID() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: RFC4122 v4 compliant
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = generateUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function getDeviceShortId() {
  const id = getDeviceId();
  return id.slice(-8);
}
