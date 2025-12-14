// auth.js - session/token management
let token = null;
let role = null;

export function setSession(newToken, newRole) {
  token = newToken;
  role = newRole;
  sessionStorage.setItem('wqt_token', token);
  sessionStorage.setItem('wqt_role', role);
}

export function getToken() {
  return token || sessionStorage.getItem('wqt_token');
}

export function getRole() {
  return role || sessionStorage.getItem('wqt_role');
}

export function isAuthenticated() {
  return !!getToken();
}

export function clearSession() {
  token = null;
  role = null;
  sessionStorage.removeItem('wqt_token');
  sessionStorage.removeItem('wqt_role');
}
