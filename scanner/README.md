# Scanner Client

## Running Locally
To run the scanner UI locally, use a simple static server (such as `npx serve`, `python -m http.server`, or similar) from the `scanner/` directory. Do **not** open HTML files directly with `file://` as ES modules and fetch requests may not work correctly.

Example (from repo root):

```
cd scanner
npx serve
```

## Important
- No business logic or calculations are permitted in the scanner HTML or scripts. The UI is strictly render-only and must not derive or calculate truth.
- All state and validation must come from the backend API.
