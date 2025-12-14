## Tracker Event Types (Scanner → API)

- scan_received: { raw, assignment_id, order_id, at }
- log_wrap_requested: { assignment_id, order_id }
- log_delay_requested: { assignment_id }
- undo_requested: { assignment_id }
- shared_pick_requested: { assignment_id }
- break_toggle_requested: { assignment_id }

All event payloads are minimal and must not include client-side computed metrics, timestamps (except 'at' for scan_received), or derived state. The server is responsible for all business logic and truth derivation.

## POST /assignments/next
**Request:**
```json
{
  "device_id": "string",
  "company_id": "string",
  "role": "string"
}
```
**Response:**
```json
{
  "assignment_id": "string",
  "customer": "string",
  "order_label": "string",
  "zone": "string",
  "route": "string",
  "started_at": "ISO string"
}
```
# WQTV2 Minimal API Contract (Scanner v2)

This document defines the minimal, stable API contract for the scanner UI. It is intentionally thin to enforce a render-only client and prevent business logic drift.

## Base URL Configuration
- The scanner expects a base API URL to be provided at runtime (e.g., via config.js or environment variable).

## POST /auth/login
**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```
**Response:**
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "expires_in": 3600
}
```

## GET /health
**Response:**
```json
{
  "status": "ok",
  "version": "string"
}
```

## GET /scanner/state
**Response:**
```json
{
  "user": {
    "id": "string",
    "role": "string"
  },
  "view": "role|picker|operative",
  "data": {}
}
```


## POST /events/batch
**Request:**
```json
{
  "events": [
    {
      "client_event_id": "string", // required, UUID v4, client-generated
      "event_type": "string",      // required, e.g. "assignment_received"
      "payload": {},                // required, event-specific
      "created_at": "ISO string",  // required, client timestamp
      "device_id": "string",      // optional, if available
      "company_id": "string",     // optional, if available
      "user_id": "string"         // optional, if available
    }
  ]
}
```
**Response:**
```json
{
  "status": [
    {
      "client_event_id": "string",
      "result": "accepted" | "duplicate" | "rejected",
      "reason": "string (optional)"
    }
  ]
}
```

**Idempotency:**
- The server must treat (company_id, client_event_id) as idempotency key.
- Duplicate events (already ingested) must return result: "duplicate".
- Rejected events must include a reason and are not removed from the queue.

**Notes:**
- The scanner client must not drop rejected events silently; they remain visible in the queue for user action.

---
No business logic, calculations, or truth derivation is permitted in the scanner UI. All state and validation must be provided by the backend.
