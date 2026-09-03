# SkillVerse — Smoke Test Plan

A smoke test isn't full regression testing — it's the smallest set of checks
that would catch "something is fundamentally broken" before you invest more
time (a demo, a deploy, a coach review) on top of it. This plan is layered:
each level assumes the previous one passed, and catches a different *class*
of failure the levels below it can't see.

| Level | What it proves | What it CAN'T catch |
|---|---|---|
| 1. Automated unit tests | Business logic is correct in isolation | Two real processes actually talking to each other |
| 2. API-level smoke (script) | Both services boot, connect to real Postgres, and the cross-service call genuinely works | Anything about the UI |
| 3. Manual UI walkthrough | The whole stack works the way a real user experiences it | Behavior under failure/edge conditions |
| 4. Resilience checks | The system degrades the way it's designed to, not catastrophically | — |

Run all four before anything that matters (a demo, a deploy, marking a week
"done"). Levels 1–2 take under a minute and should become a habit before
every work session, not just before big moments.

## Level 1 — Automated tests

```
cd services/identity-service
pytest app/tests/ -q        # expect 58 passed
cd ../marketplace-service
pytest app/tests/ -q        # expect 62 passed
cd ../../lambda/avatar-validator
PYTHONPATH=. pytest tests/ -q   # expect 5 passed (only if you've reached Week 6's Lambda work)
```
**Pass criteria**: every suite green, count matches. A dropped count from a
prior run (e.g. 40 instead of 44) means a file didn't make it into your
local copy — don't proceed until you know why.

## Level 2 — API-level smoke script

`scripts/smoke-test.sh` (and `.bat`) automates exactly the checks that are
tedious to do by hand every time, but matter most: both services actually
booting against your real Neon database, auth actually working, and the
cross-service call actually resolving live. Run it after starting both
`uvicorn` processes (Terminal 2 and 3), before touching the frontend at all
— if this fails, the UI walkthrough in Level 3 will fail for confusing
reasons that are actually rooted here.

```
scripts\smoke-test.bat
```
See the script itself for exactly what it checks — summarized in the table
below.

| Check | Proves |
|---|---|
| `GET /health` on both ports | Both processes are up and reachable |
| Register + login on identity-service | Auth flow works against real Postgres, JWT is issued |
| Create a skill on marketplace-service using that JWT | Stateless auth works — marketplace-service trusts a token it never issued, with no call back to identity-service to check it |
| `GET /skills` shows the real instructor name, not "Unknown User" | The cross-service call (`IdentityClient` → `GET /internal/users/{id}/public`) is genuinely resolving live, not silently falling back |
| Repeated request past the rate limit returns 429 | Rate limiting is actually wired in, not just present in code |

**Pass criteria**: script exits 0, every check printed `OK`. Any `FAIL` line
names the exact check that broke — start there, not by guessing.

## Level 3 — Manual UI walkthrough

With all three terminals running (`ng serve`, identity-service, marketplace-
service — see the earlier 3-terminal setup), open the app and do this exact
sequence. This isn't "click around" — it's the one path that touches every
major seam in the system:

1. **Register** a new account → **log in**
2. **Edit profile** — set "Full Name" to something distinctive (e.g. "Smoke
   Test User") → confirms `PATCH /users/{id}/profile` on :8001, and that
   the override actually persists (reload the page, check it stuck)
3. **Browse skills** — type in the search box, change the sort dropdown,
   set a price range, page to page 2 if there are enough results →
   confirms :8002's filter/sort/pagination all actually work, not just one
4. **Open a skill's detail page** — check the instructor name shown is a
   real name, not "Unknown User" → this is your **UI-level proof of the
   cross-service call**, same thing Level 2 checked via curl, now visibly
   working through the actual product
5. **Book that skill**
6. **As the instructor account** (log out, log into the account that owns
   that skill), mark the booking completed
7. **As the learner account again**, leave a review on the completed
   booking → confirms the full booking lifecycle and the review's
   authorization rules (only the learner, only once completed)
8. **Check your reviews appear** on the instructor's profile/reviews list
9. **Log out**, confirm you're redirected to login and protected pages
   reject you

**While doing this**, keep browser DevTools → Network tab open. Confirm:
auth/profile calls go to `:8001`, everything skill/booking/review-related
goes to `:8002` — if anything goes to the wrong port, `environment.ts` or a
service file has a stale reference.

**Pass criteria**: every step completes with no unexpected error, and the
instructor name in step 4 is correct — that single detail is doing double
duty as your microservices-integration proof.

## Level 4 — Resilience checks

These prove the system fails the way it's *designed* to, not just that it
works when everything's healthy — the difference between "it works" and "I
understand why it works."

1. **Stop identity-service** (Ctrl+C in Terminal 2), leave marketplace-
   service and the frontend running.
   - Browse skills again → instructor names should degrade to "Unknown
     User" (or the frontend's fallback UI), **not** a 500 error or a blank
     page. This proves the graceful-degradation design in `IdentityClient`.
   - Try to log in → should fail cleanly (identity-service owns auth, no
     fallback for that) — confirms you understand *which* failures are
     tolerated and which aren't, rather than being surprised either way.
   - Restart identity-service, confirm marketplace-service recovers
     without needing its own restart (it makes a fresh HTTP call every
     time, no stale cached connection to worry about).

2. **Trigger the rate limit deliberately** — hit `POST /auth/login` with
   wrong credentials ~11 times in under a minute (the smoke script's login
   check counts toward this if you re-run it in a loop). Confirm the 11th
   attempt returns `429`, not a 6th silent retry — proves brute-force
   protection is real, not just documented.

**Pass criteria**: nothing crashes outright; failures are the *specific*
ones the design intends (auth genuinely requires identity-service; display
names don't).

## When something fails

Work top-down, not bottom-up — a Level 3 failure is very often actually a
Level 1 or 2 problem wearing a UI costume:

1. Is Level 1 green? If not, the bug is in application logic — fix it
   there before anything else; a red unit test means every level above it
   is testing on top of a known-broken foundation.
2. Is Level 2 green? If not, check `.env` in both services first (wrong
   host, mismatched `SECRET_KEY`, missing `psycopg` driver) — the vast
   majority of Level 2 failures are configuration, not code.
3. Only debug Level 3 UI behavior once 1 and 2 are both clean — otherwise
   you're chasing a symptom instead of the cause.
