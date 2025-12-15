// auth.js - session/token management

const SESSION_KEY = 'wqt_session';
let session = null;

export function setSession(newSession) {
  session = newSession;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession() {
  if (session) return session;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    session = JSON.parse(raw);
    return session;
  } catch {
    return null;
  }
}

export function clearSession() {
  session = null;
  localStorage.removeItem(SESSION_KEY);
}

export function isAuthenticated() {
  const s = getSession();
  return !!(s && s.token);
}

export function getRole() {
  const s = getSession();
  return s && s.role;
}
