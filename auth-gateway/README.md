# SMIS SSO Platform

This folder describes the shared SSO platform that backs the `@smis/sso-client` package. The platform uses a NestJS API gateway and a small web UI hosted at `auth.smis.itc.edu.kh` to manage sessions and authorize downstream applications.


# Auth Gateway (NestJS)

A NestJS service that fronts SMIS and powers `auth.smis.itc.edu.kh`. The gateway now includes runnable scaffolding with in-memory
users, application definitions, and refresh-token storage so the SSO client can probe sessions, log in, and fetch authorizations.

## Features

- Accepts SSO probes from client applications and returns session state
- Performs SMIS-style authentication (username/password) and issues JWT access tokens scoped to the requesting application key
- Exposes role/permission APIs for applications
- Manages logout and refresh flows using HTTP-only cookies
- Serves a minimal login UI for the popup/probe window

## Modules

- **ApplicationsModule**: validates provided SMIS application keys and provides default permissions.
- **AuthModule**: login, refresh, logout, and token issuance plus refresh-token storage.
- **SessionsModule**: `/sso/probe` popup endpoint that posts an active session back to `window.opener` or renders the login form.
- **AuthorizationsModule**: `/api/sso/authorizations` endpoint guarded by JWT, scoped by `X-SMIS-APP-KEY`.
- **UsersModule**: `/api/users/me` profile endpoint plus simple credential validation and per-application grants.

## Endpoints

- `GET /sso/probe?appKey=<key>`: If a refresh cookie exists, issues a new access token and posts it back to the opener; otherwise
  renders the login UI.
- `POST /auth/login`: Accepts `{ username, password, appKey }`, issues access+refresh tokens, and stores the refresh token in an
  HTTP-only cookie.
- `POST /auth/refresh`: Exchanges a refresh token (from body or cookie) for a new access token.
- `POST /auth/logout`: Revokes a refresh token and clears the cookie.
- `GET /api/sso/authorizations`: Returns `{ roles, permissions }` for the provided `X-SMIS-APP-KEY` using the JWT payload.
- `GET /api/users/me`: Returns basic user profile info from the access token subject.

## Local Development

```
cd platform/auth-gateway
npm install
npm run start:dev
```

Copy `.env.example` to `.env` (or export the variables directly) before starting the server:

```
cp .env.example .env
```

Environment variables:

- `PORT` (default 3000)
- `JWT_SECRET` (JWT signing secret; default `smis-jwt-secret`)
- `COOKIE_SECRET` (Fastify cookie signing secret; default `smis-cookie-secret`)

## Example flows

### 1) SSO probe -> login -> session delivery

1. Browser opens `/sso/probe?appKey=pp-123456789` in a popup.
2. If a refresh cookie exists, the gateway posts `{ accessToken, refreshToken, expiresAt }` to `window.opener` and closes.
3. If no cookie exists, the login form is rendered and submits to `/auth/login` with `{ username, password, appKey }`.
4. On success, the server sets the refresh cookie, returns tokens, and the popup posts them back to the opener.

The popup page can deliver the session with a small script (already included in `SessionsController` HTML):

```html
<script>
  window.opener?.postMessage({ type: 'smis-session', payload: {{sessionJson}} }, '*');
  window.close();
</script>
```

### 2) Fetch authorizations for an application

```bash
curl -H "Authorization: Bearer <accessToken>" \
     -H "X-SMIS-APP-KEY: pp-123456789" \
     http://localhost:3000/api/sso/authorizations
```

Example response:

```json
{
  "roles": ["admin"],
  "permissions": ["read", "write", "approve"]
}
```

### 3) Refresh an access token and logout

```bash
# refresh
curl -X POST http://localhost:3000/auth/refresh \
     -H "Content-Type: application/json" \
     -d '{"refreshToken":"<refresh-from-cookie-or-storage>"}'

# logout
curl -X POST http://localhost:3000/auth/logout \
     -H "Content-Type: application/json" \
     -d '{"refreshToken":"<same-refresh-token>"}'
```

## Project Layout

```
platform/auth-gateway/
├── src/
│   ├── main.ts               # Nest bootstrap (Fastify + cookies)
│   ├── app.module.ts         # module wiring
│   ├── applications/         # application key definitions
│   ├── auth/                 # login/refresh/logout, JWT, refresh storage
│   ├── sessions/             # popup probe endpoint + login UI
│   ├── authorizations/       # JWT-guarded roles/permissions endpoint
│   └── users/                # user profiles and credentials
├── package.json
└── tsconfig.json
```
