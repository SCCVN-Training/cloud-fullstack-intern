# marketplace-service API Contract

Base URL (local): `http://localhost:8002`

Owns: `skills`, `bookings`, `reviews`. Depends on identity-service (over
REST) for user display data — never queries identity-service's database
directly.

## Auth

Same JWTs as identity-service (shared `SECRET_KEY`), verified
statelessly — this service has no `users` table and does not call
identity-service to check who's logged in on every request. See
`app/core/dependencies.py`.

## Error format

Same as identity-service: `{ "detail": "..." }`. `429` on rate limit.

## Endpoints

| Method | Path | Auth | Rate limit | Description |
|---|---|---|---|---|
| GET | `/skills` | none | 60/minute | Paginated, filterable, sortable list |
| GET | `/skills/categories` | none | 60/minute | Distinct category values |
| GET | `/skills/{skill_id}` | none | 60/minute | Skill detail |
| POST | `/skills` | required (self or admin) | — | Create a skill |
| DELETE | `/skills/{skill_id}` | required (owner or admin) | — | Delete a skill |
| GET | `/bookings/me` | required | — | Current user's bookings (learner or mentor) |
| GET | `/bookings/{booking_id}` | required (learner, mentor, or admin) | — | Booking detail |
| POST | `/bookings` | required | — | Create a booking |
| PATCH | `/bookings/{booking_id}/status` | required (role-dependent) | — | Confirm/complete/cancel |
| GET | `/users/{reviewee_id}/reviews` | required | — | Reviews received by a user |
| POST | `/bookings/{booking_id}/reviews` | required (learner on that booking) | — | Leave a review |
| GET | `/health` | none | — | `{ service, status }` |

### `GET /skills` query params
| Param | Type | Default | Notes |
|---|---|---|---|
| `skip` | int | 0 | Offset |
| `limit` | int | 20 | Max 100 |
| `search` | string | — | Matches title/description |
| `category` | string | — | Exact match |
| `min_rating` | float | — | 0–5 |
| `min_price` | int | — | Inclusive |
| `max_price` | int | — | Inclusive; `422` if `min_price > max_price` |
| `sort` | enum | `newest` | `newest \| oldest \| price_asc \| price_desc \| rating \| popular \| title_asc` |

Response `200`:
```json
{ "total": 42, "skills": [ { "id": "...", "instructorName": "...", "instructorAvatar": "...", "...": "..." } ] }
```
`instructorName`/`instructorTitle`/`instructorBio`/`instructorAvatar`
are resolved via a live call to identity-service
(`GET /internal/users/{id}/public`) at request time — not stored in
this service's database. If identity-service is unreachable, these
fields fall back to `"Unknown User"` / a placeholder avatar rather than
the request failing. See `app/clients/identity_client.py`.

### `POST /bookings/{booking_id}/reviews`
Request:
```json
{ "rating": 5, "knowledgeRating": 5, "communicationRating": 4, "videoAudioRating": 5, "feedback": "..." }
```
Rules: only the learner on that specific booking may post; only once the
booking is `COMPLETED`; only once per booking (`409`/`400`-style on
duplicate — see `ReviewAlreadyExistsException`).

## Cross-service dependency
This service calls **one** identity-service endpoint synchronously:
`GET /internal/users/{user_id}/public` — see
`identity-service.md`'s section on that endpoint for its contract.
That single call is used to decorate skills, bookings, and reviews with
instructor/learner/reviewer display names — see
`app/clients/identity_client.py` for the timeout (3s) and fallback
behavior.

## DTOs (Pydantic schemas)
See `app/modules/{skills,bookings,reviews}/schema.py`. Same
`camelCase`-over-the-wire convention as identity-service.
