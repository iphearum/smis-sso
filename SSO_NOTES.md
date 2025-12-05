# SMIS SSO Gateway – Integration & Test Notes

## Quick integration steps for client apps
- Instantiate client: `const client = new SmisSsoClient({ appKey: '<app-key>', authBaseUrl: '<gateway-host>' });`
- Ensure session: `const session = await client.ensureSession();` (opens `/sso/probe`, handles login/refresh).
- Fetch authorizations (flat): `await client.loadAuthorizations(session);` → `{ roles, permissions }`.
- Fetch contextual auth (branch/department): `GET /api/sso/authorizations/context` with `Authorization: Bearer <accessToken>` → `{ employeeId, branches: [ { branch, departments: [ { department, roles, permissions, degrees } ] } ] }`.
- Call your APIs with headers: `Authorization: Bearer <accessToken>` and `X-SMIS-APP-KEY: <appKey>`.
- Refresh on 401: call `client.refresh()` and retry.
- Logout: POST `/auth/logout` with refresh token and clear local storage.

## Key endpoints
- `POST /auth/login` → access+refresh tokens (sets refresh cookie).
- `POST /auth/refresh` → new access token.
- `GET /api/sso/authorizations` → flat roles/permissions (token + `x-smis-app-key`).
- `GET /api/sso/authorizations/context` → branch/department scoped roles/permissions.
- `GET /api/users/me` → profile.
- `GET /sso/probe?appKey=...` → popup flow for browser SSO.

## Test checklist (API-level)
- Login success: valid email/password/appKey → 200, tokens returned, refresh cookie set.
- Login failure: bad password → 401; bad appKey → 400.
- Refresh: valid refresh → 200 new access; invalid/expired → 401.
- Authorizations: valid token + matching appKey → 200; mismatched appKey → 400.
- Context auth: user with employee → branches[].departments[].roles/permissions present; user without employee → `branches: []`.
- Profile: `GET /api/users/me` returns id/username/displayName/email/employeeId.
- Probe flow: with refresh cookie returns session to opener; without cookie shows login form.

## Seed data expectations
- `users`: bcrypt-hashed `password`, `email` used as login.
- `employees`: `user_id` links user; `active = true`; optional `branch_id`, `department_id`.
- `assigning_roles`: `entity_type` in {branch, department, degree, role, permission}; `assignable_type='employee'`; `parent_id` builds tree; role→permission links live in `permission_role`.
- `permission_role`: maps roles to permissions.

## Run commands
- Dev: `cd auth-gateway && bun run start:dev`
- Build: `cd auth-gateway && bun run build`

