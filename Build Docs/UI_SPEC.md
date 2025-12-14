# WQT v2 Login Screen UI Spec

## Components
- **Full-screen gradient background** with subtle pattern overlay (WQT watermark)
- **Centered glass card** with blur, soft border, and drop shadow
- **Title:** "Sign in to WQT"
- **Status pill** (top-right of card): shows "Online" or "Offline" based on `navigator.onLine`
- **5-digit code input**: centered, large, numeric, placeholder text "5-digit code"
- **Buttons:**
  - "Log in" (submits code)
  - "Create user" (not implemented yet)
- **Footer:** Device ID (derived from userAgent hash, for now)

## Interactions
- Entering a valid 5-digit code and pressing "Log in" triggers login flow
- If code is valid (mock: 12345=picker, 54321=operative), routes to role page
- If code is invalid, shows error
- "Create user" button shows alert (not implemented)
- Status pill updates live with online/offline status

## Future API Fields Needed
- POST `/auth/login` with `{ code }` (returns `{ token, role }`)
- Device ID (to be provided by API or device management in future)
- Role-based routing after login

## Visual Reference
- All styling is in shared CSS under `scanner/styles/`
- No inline or page-specific styles
- No business logic, metrics, or session derivations in UI
