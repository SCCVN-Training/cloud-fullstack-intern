# Monitoring & Logging Setup

## 1. API Gateway

Both services now sit behind a single nginx entry point
(`gateway/nginx.conf`), so the frontend and any external client have one
origin instead of two.

| Prefix | Routes to |
|---|---|
| `http://localhost:8080/identity/*` | `identity-service:8001` |
| `http://localhost:8080/marketplace/*` | `marketplace-service:8002` |

`environment.ts`'s `identityApiUrl`/`marketplaceApiUrl` point through the
gateway. The video-call signaling WebSocket also goes through it —
`/marketplace/` carries the `Upgrade`/`Connection` headers nginx needs
for that to work.

## 2. CORS

Handled centrally by the gateway, not by each service. Both services'
`CORSMiddleware` was removed from `main.py` — having it in two places
would risk a duplicated `Access-Control-Allow-Origin` header, which
browsers reject outright. Allowed origin: `http://localhost:4200`.

## 3. Correlation IDs

```
Angular
  |
  v  (no X-Request-ID yet)
nginx            -- mints X-Request-ID (nginx $request_id)
  |
  v  X-Request-ID: <uuid>
marketplace-service   -- reads it into request_id_ctx, logs with it
  |
  v  X-Request-ID: <uuid>   (forwarded explicitly by IdentityClient)
identity-service      -- reads the same id, logs with it
```

The id is never regenerated mid-chain — each service checks for an
existing `X-Request-ID` header first and only mints a new one if none
was sent (e.g. a direct `curl localhost:8001/...` bypassing the
gateway in local dev). This means one browser action produces one
correlation id visible in both services' logs.

## 4. Structured logging

`app/core/logging.py` (identical in both services) emits one JSON
object per log line:

```json
{
  "timestamp": "2026-08-24T10:15:30",
  "level": "INFO",
  "service": "marketplace-service",
  "request_id": "5f2c1a3e-...",
  "message": "..."
}
```

`configure_logging()` is idempotent — safe to re-import under
`uvicorn --reload` without stacking duplicate handlers or double-
printing every line.

## 5. Metrics

`prometheus_fastapi_instrumentator` exposes request count, latency
histograms, and status codes per route on both services, no
dashboard required to verify:

- `http://localhost:8001/metrics` (identity-service)
- `http://localhost:8002/metrics` (marketplace-service)

## 6. Tracing scope

SkillVerse uses correlation-ID-based request tracing (sections 3-4)
rather than a full distributed tracing stack (OpenTelemetry +
collector + Jaeger). For two services with one synchronous
cross-service call, grepping both services' logs for one
`request_id` gives the full call chain in order — a deliberate scope
decision for this project size, not an oversight. A production system
handling many more services/hops would graduate to real span-based
tracing.

## 7. Viewing logs

```bash
docker compose logs -f identity-service
docker compose logs -f marketplace-service
# or everything interleaved:
docker compose logs -f
```

## 8. Verification (proof this actually works)

The strongest single test hits the gateway, marketplace-service, *and*
identity-service in one request — it's the cross-service call, not a
standalone `/health` check, that proves correlation actually
propagates end to end:

```bash
curl http://localhost:8080/marketplace/skills
```

Expected: the response's own `X-Request-ID` header, plus that same id
appearing in `docker compose logs -f` output from **both**
`marketplace-service` (handling the request) and `identity-service`
(resolving instructor display names via `IdentityClient`).

```
marketplace-service | {"...", "service": "marketplace-service", "request_id": "abc123", "message": "..."}
identity-service    | {"...", "service": "identity-service",    "request_id": "abc123", "message": "..."}
```
