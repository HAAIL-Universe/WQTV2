
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
      "client_event_id": "string",
      "type": "string",
      "payload": {}
    }
  ]
}
```
**Response:**
```json
{
  "accepted": ["client_event_id", ...],
  "rejected": ["client_event_id", ...]
}
```

---
No business logic, calculations, or truth derivation is permitted in the scanner UI. All state and validation must be provided by the backend.
