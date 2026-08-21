# identity-service API Contract

Base URL (local): `http://localhost:8001`

Owns: `users`, `profiles`, `wallets`, `transactions`. This service is the
sole writer of these tables and the sole issuer of JWTs.

## Auth

All endpoints except `/auth/register`, `/auth/login`, `/health`, `/`, and
`/internal/*` require `Authorization: Bearer <jwt>`. The JWT payload
contains `sub` (user id) and `role` (`USER` | `ADMIN`).

## Error format

```json
{ "detail": "Human-readable message" }
```
Standard HTTP status codes: `400` validation/business-rule, `401`
unauthenticated, `403` forbidden, `404` not found, `422` schema
validation, `429` rate limited.

## Endpoints

| Method | Path | Auth | Rate limit | Description |
|---|---|---|---|---|
| POST | `/auth/register` | none | 10/hour | Create a user + default profile + default wallet |
| POST | `/auth/login` | none | 10/minute | Returns `{ access_token, token_type }` |
| GET | `/auth/me` | required | — | Current user's basic info |
| GET | `/users/{user_id}/profile` | required (self or admin) | — | Full profile |
| PATCH | `/users/{user_id}/profile` | required (self or admin) | — | Partial update |
| POST | `/users/{user_id}/profile/avatar` | required (self or admin) | — | Multipart avatar upload |
| GET | `/users/{user_id}/wallet` | required (self or admin) | — | Wallet balance |
| GET | `/users/{user_id}/transactions` | required (self or admin) | — | Transaction history |
| GET | `/internal/users/{user_id}/public` | **none** (internal) | 60/minute | Public display data for other services |
| GET | `/health` | none | — | `{ service, status }` |

### `POST /auth/register`
Request:
```json
{ "user_name": "alice", "email": "alice@example.com", "password": "AlicePass123" }
```
Response `201`:
```json
{ "id": "uuid", "user_name": "alice", "email": "alice@example.com" }
```
Errors: `400 EMAIL_ALREADY_EXISTS`-style (see `core/exceptions.py`), `422` on bad input.

### `POST /auth/login`
Request: `{ "email": "...", "password": "..." }`
Response `200`: `{ "access_token": "...", "token_type": "bearer" }`
Errors: `401` invalid credentials.

### `GET /internal/users/{user_id}/public` — the cross-service contract
This is the endpoint marketplace-service calls (see
`marketplace-service/app/clients/identity_client.py`). Deliberately
narrower than the full profile — no email, no wallet, nothing outside
identity's ownership boundary that another service shouldn't see.

Response `200`:
```json
{
  "user_id": "uuid",
  "user_name": "alice_dev",
  "avatar_url": "https://...",
  "bio": "...",
  "title": "Expert in python, sql"
}
```
`404` if the user doesn't exist. No auth header required — this is
meant to be called service-to-service on a private network, not from a
browser. (In a real deployment this would sit behind network-level
restrictions — e.g. a security group only allowing traffic from
marketplace-service's subnet — rather than being reachable from the
public internet at all.)

## DTOs (Pydantic schemas)
See `app/modules/{auth,users,profiles,wallets,transactions}/schema.py`
for the exact field-level contracts (types, validation constraints).
Responses use `camelCase` over the wire (`alias_generator=to_camel`)
even though the Python code is `snake_case`.
