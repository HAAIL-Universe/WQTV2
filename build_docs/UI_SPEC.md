# Tracker v0

## Components & Bind Targets
- Panel root: #trackerPanel (hidden unless Tracker tab active)
- Order label: #trkOrderLabel
- Log Wrap button: #btnLogWrap
- Qty: #trkQty
- Locations: #trkLocations
- Pallets: #trkPallets
- Rate: #trkRate
- ETA: #trkETA
- Progress bar fill: #trkProgressFill
- Progress percent: #trkProgressPct
- Order log list: #trkLogList
- Scan input: #scanInput (keyboard wedge, always focused)
- Action buttons: #btnLogDelay, #btnUndo, #btnSharedPick, #btnBreak

## Required Read-Model Fields
- assignment (object): order_label, assignment_id, customer, etc.
- order_summary (object): qty, locations, pallets, rate, eta, progress_pct
- order_progress (object): percent (string, e.g. "42%")
- order_log (array): [{ message, at, level/status }]

**Note:** Scanner does not compute rate, ETA, or progress. All values are rendered directly from the server read-model. Placeholders (—, 0, empty log) are shown if fields are missing.

# Picker Home v0 (Assignment-first)

## Components
- Pill tabs: QuickCalc, Tracker (UI toggle only)
- User pill (shows state.user.display_name if present)
- Metrics bar: Live Rate, Total Units, Perf Score (display only)
- Assignment panel:
  - If no active assignment: big Start next order button
  - If active: show assignment details (customer/order, zone/route, id, started time), Resume button
- Bottom actions: Log/Delay, Shared Pick, Resume/Start

## Event Emission & Offline Queue
- All bottom action buttons (Start/Resume, Log/Delay, Shared Pick, Tracker open) emit events via apiClient.emitEvent().
- Events are sent immediately if online, or queued if offline (durable queue in localStorage).
- UI must show current queue count: `Queue: N` in the status strip.
- No business logic or metric derivation in the client; all state is server-provided.
- metrics.live_rate_display (string)
- metrics.total_units (number)
- metrics.perf_score_display (string)
- assignment.active (bool)
- assignment.customer (string)
- assignment.order_label (string)
- assignment.zone (string, optional)
- assignment.route (string, optional)
- assignment.assignment_id (string)
- assignment.started_at (ISO string)

## Required endpoints added
- POST /assignments/next
## Role Page Shell v0

- Status strip: Connectivity (Online/Offline), Queue count (Queue: N)
  - Status strip: Connectivity (Online/Offline), Queue count (Queue: N, live from eventQueue)
- Header title (e.g. “Picker” / “Operative”)
- Status strip: Connectivity (Online/Offline), Queue count (Queue: N)
- Last updated timestamp (Last updated: ...)
- Tab panels (internal, placeholder only)

### Required Read-Model Fields
- header (string)
- queueCount (number)
- lastUpdated (ISO string)
- [Optional: live_rate, perf_score, etc. — display only if present]
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

## Visual Tokens Used (2025-12)

- **Background gradient:** `linear-gradient(135deg, #7b2ff2 0%, #40e0d0 100%)`
- **Pattern overlay:** SVG text 'WQT' at 4.5% opacity, centered, font-size 120
- **Glass card:**
  - Background: `rgba(255,255,255,0.13)`
  - Border: `1.5px solid rgba(255,255,255,0.22)`
  - Border-radius: `18px`
  - Blur: `12px` (backdrop-filter)
  - Shadow: `0 8px 32px 0 rgba(31,38,135,0.18)`
- **Input:**
  - Background: `rgba(255,255,255,0.18)`
  - Border: `1.5px solid #bfc9d1`
  - Focus border: `#2ecc40`
  - Border-radius: `8px`
- **Primary button:**
  - Background: `#232b3b`
  - Glow: `0 0 0 2px #2ecc40, 0 1px 8px #2ecc4033`
  - Border-radius: `8px`
  - Font-weight: 600
- **Secondary button:**
  - Background: `#2d3a5e`
  - Hover: `#1e2233`
  - Border-radius: `8px`
- **Status pill:**
  - Online: `#2ecc40` bg, `#fff` text, border `#2ecc40cc`
  - Offline: `#e67e22` bg, `#fff` text, border `#e67e22cc`
  - Border-radius: `999px`
  - Shadow: `0 1px 4px rgba(44,204,64,0.08)`
- **Footer:**
  - Color: `#e0e0e0`, opacity 0.85
- **Device ID:**
  - Displayed as `Device xxxxxxxx` (last 8 chars of UUID)

All tokens are defined as CSS variables in `scanner/styles/theme.css`.
