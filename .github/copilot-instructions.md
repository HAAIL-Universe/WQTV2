# Copilot & AI Agent Instructions — WQT v2 (Trinity-Locked)

These rules are binding for all AI-assisted changes in this repository. If a request conflicts with this file or the Trinity docs, you must stop.

## Trinity authority order

1) Manifesto (intent + non-negotiables)
2) Blueprint (architecture + responsibility boundaries)
3) Directive (execution rules + stop conditions)

The Trinity docs must exist in this repo (committed). If they cannot be located, stop and report what paths you searched.

## System shape (hard boundary)

WQT v2 has three components. No exceptions.

1) Scanner Client (Edge App)
- Touch-first, event capture + display only
- Offline-first queueing and reliable sync
- Renders server-provided read models
- Never talks to the database

2) Core API (Single source of truth)
- Auth, roles, sessions, event ingestion, validation
- Event ledger (idempotent, immutable)
- Derives all metrics/read models server-side
- Only component allowed to talk to the database

3) Management System (Supervisor/Admin Web)
- Config + audit + dashboards + exports
- Consumes the same API as the scanner
- Never re-implements business logic locally

Hard rule: clients do not speak to each other. All integration is via the API boundary.

## Prime directive

The scanner must stay “boring” forever: fast, low-tap, resilient under poor connectivity.
If a change increases scanner complexity or pushes truth logic into the client, reject it.

## Non-negotiables (enforced)

- Single source of truth is the server-side event ledger. UI caches are never authoritative.
- Event-driven: warehouse actions are events; sessions/metrics/summaries are derived server-side.
- No UI talks directly to the database (including Neon Data API). Backend only.
- No duplicated metric calculations in different places.
- No cross-page coupling via global mutable state.
- No relative fetch paths that assume same-origin. All API calls go through a configured base URL module.
- Company isolation is first-class: company context is mandatory in auth and every API request.

## Identity + sessions

- One primary session per device at a time.
- Overlay session is a separate authenticated context used for “helping on someone else’s device”.
- Overlay must not mutate primary session state and must not be the same user as the primary.

If any change allows overlay == primary user or allows overlay to close/mutate primary shift/order, stop.

## Scanner client rules

Scanner pages are thin views:
- Render state returned by the API read model
- Wire UI interactions to emit events
- Queue and sync events
- Display connectivity/queue health

Scanner must NOT:
- compute perf score / live rate formulas
- implement break timing rules, late-break detection, trend baselines
- derive shift/session truth from local timers
- invent “truth state” from UI actions

If a feature requires these, it belongs in the API.

## Event ledger requirements (backend-owned)

- Events must have client-generated UUID `client_event_id`
- API ingestion must be idempotent per (company_id, client_event_id)
- Batch ingestion endpoint must return per-event status (accepted / duplicate / rejected + reason)
- Derived models (shift/order summaries, metrics) are produced server-side

## Offline-first requirements (scanner critical path)

- Durable queue that survives refresh/crash/power loss (prefer IndexedDB; localStorage acceptable as interim)
- Never drop events silently
- UI must show LIVE / QUEUED / SYNCING / ERROR states
- Rejected events must remain visible with an actionable path (typically via management system)

## Repo structure expectations

Keep components separated:
- /scanner/ for scanner client
- /management/ for management UI (if/when added)
- /api/ (or /backend/) for the Core API (if/when added)
- /build_docs/ for specs, Trinity docs, API contract, UI specs

Do not put backend logic into /scanner or /management.

## Build sequencing (do not freestyle)

- Define API contract before implementing complex UI logic
- Implement event model + ledger before metrics correctness work
- Implement offline queue before UI polish
- Build UI to render read models, not to derive truth

If a task tries to jump ahead, re-scope it.

## Required output for non-trivial changes (PR / commit notes)

For each meaningful change, include:
1) What changed and why (boundary-aware)
2) Explicit confirmation: no scanner business logic added
3) Deferred decisions/features

## Stop conditions

Stop immediately if any change introduces:
- business logic in scanner UI
- metrics computed differently in multiple places
- any UI direct DB access
- relative/same-origin API assumptions
- cross-page global coupling
- overlay session violating primary session integrity
- company isolation bypassed “temporarily”
