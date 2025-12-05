# test-webauth

Minimal Next.js sandbox to exercise the SMIS SSO popup flow against `auth-gateway`.

## Setup
```bash
cd test-webauth
bun install   # or npm install / pnpm install
cp .env.example .env # adjust auth base URL and app key
```

## Run
```bash
bun dev  # or npm run dev
```

## What it does
- Opens `/sso/probe?appKey=...` in a popup via `SmisSsoClient.ensureSession()`.
- Shows the returned session JSON.
- Fetches flat authorizations (`/api/sso/authorizations`).
- Fetches contextual authorizations (`/api/sso/authorizations/context`) showing branch/department-scoped roles/permissions.
