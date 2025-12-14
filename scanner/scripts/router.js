// router.js - minimal role-based navigation
import { getRole } from './auth.js';

export function routeAfterLogin(role) {
  if (role === 'picker') {
    window.location.href = 'picker.html';
  } else if (role === 'operative') {
    window.location.href = 'operative.html';
  } else {
    alert('Unknown role: ' + role);
  }
}
