#!/usr/bin/env bash
# Level 2 smoke test — see docs/smoke-test-plan.md for what each check
# proves and why. Run this AFTER starting both uvicorn processes
# (identity-service :8001, marketplace-service :8002) against your real
# .env, BEFORE touching the frontend.
#
# Requires: curl, python3 (for JSON parsing — no jq dependency).
set -uo pipefail

IDENTITY_URL="http://localhost:8001"
MARKETPLACE_URL="http://localhost:8002"
FAIL=0

pass() { echo "  OK   $1"; }
fail() { echo "  FAIL $1"; FAIL=1; }

json_get() {
  # json_get '<json>' key -> value, or empty string on failure
  python3 -c "import sys,json; d=json.loads(sys.argv[1]); print(d.get(sys.argv[2], ''))" "$1" "$2" 2>/dev/null
}

echo "=== 1. Health checks ==="
IDENTITY_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$IDENTITY_URL/health")
[ "$IDENTITY_HEALTH" = "200" ] && pass "identity-service /health" || fail "identity-service /health (got $IDENTITY_HEALTH — is it running on :8001?)"

MARKETPLACE_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$MARKETPLACE_URL/health")
[ "$MARKETPLACE_HEALTH" = "200" ] && pass "marketplace-service /health" || fail "marketplace-service /health (got $MARKETPLACE_HEALTH — is it running on :8002?)"

if [ "$FAIL" = "1" ]; then
  echo ""
  echo "Both services must be running before continuing — stopping here."
  exit 1
fi

echo ""
echo "=== 2. Auth flow (identity-service, real Postgres) ==="
SUFFIX=$(date +%s)
EMAIL="smoketest_${SUFFIX}@example.com"
USERNAME="smoketest_${SUFFIX}"

REGISTER_RESPONSE=$(curl -s -X POST "$IDENTITY_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"user_name\":\"$USERNAME\",\"email\":\"$EMAIL\",\"password\":\"SmokeTest123\"}")
USER_ID=$(json_get "$REGISTER_RESPONSE" "id")

if [ -n "$USER_ID" ]; then
  pass "register ($EMAIL -> id=$USER_ID)"
else
  fail "register — response: $REGISTER_RESPONSE"
fi

LOGIN_RESPONSE=$(curl -s -X POST "$IDENTITY_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"SmokeTest123\"}")
TOKEN=$(json_get "$LOGIN_RESPONSE" "access_token")

if [ -n "$TOKEN" ]; then
  pass "login (JWT acquired)"
else
  fail "login — response: $LOGIN_RESPONSE"
fi

if [ -z "$TOKEN" ] || [ -z "$USER_ID" ]; then
  echo ""
  echo "Can't continue without a valid token — stopping here."
  exit 1
fi

echo ""
echo "=== 3. Stateless auth across services ==="
SKILL_RESPONSE=$(curl -s -X POST "$MARKETPLACE_URL/skills" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"title\":\"Smoke Test Skill $SUFFIX\",\"category\":\"Testing\",\"description\":\"Created by smoke-test.sh\",\"image\":\"https://example.com/i.jpg\",\"duration\":\"30 min\",\"level\":\"Beginner\",\"requirements\":\"none\",\"instructor_id\":\"$USER_ID\"}")
SKILL_ID=$(json_get "$SKILL_RESPONSE" "id")

if [ -n "$SKILL_ID" ]; then
  pass "create skill on marketplace-service using identity-issued JWT (id=$SKILL_ID)"
else
  fail "create skill — response: $SKILL_RESPONSE"
fi

echo ""
echo "=== 4. Cross-service call (marketplace-service -> identity-service) ==="
LIST_RESPONSE=$(curl -s "$MARKETPLACE_URL/skills?search=Smoke+Test+Skill+$SUFFIX")
INSTRUCTOR_NAME=$(python3 -c "
import sys, json
d = json.loads(sys.argv[1])
skills = d.get('skills', [])
print(skills[0].get('instructorName', '') if skills else '')
" "$LIST_RESPONSE" 2>/dev/null)

if [ -n "$INSTRUCTOR_NAME" ] && [ "$INSTRUCTOR_NAME" != "Unknown User" ]; then
  pass "instructor name resolved live via cross-service call: '$INSTRUCTOR_NAME'"
elif [ "$INSTRUCTOR_NAME" = "Unknown User" ]; then
  fail "instructor name fell back to 'Unknown User' — identity-service unreachable, or /internal/users/{id}/public is broken"
else
  fail "could not find the created skill in the list — response: $LIST_RESPONSE"
fi

echo ""
echo "=== 5. Rate limiting ==="
echo "  (sending 11 rapid login attempts — expect the 11th to return 429)"
LAST_STATUS=""
for i in $(seq 1 11); do
  LAST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$IDENTITY_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"nonexistent@example.com\",\"password\":\"wrong\"}")
done

if [ "$LAST_STATUS" = "429" ]; then
  pass "rate limit triggered after repeated attempts (429)"
else
  fail "expected 429 on the 11th login attempt, got $LAST_STATUS — rate limiting may not be wired in, or the limit is set higher than 10/min"
fi

echo ""
if [ "$FAIL" = "0" ]; then
  echo "=== ALL CHECKS PASSED ==="
  exit 0
else
  echo "=== ONE OR MORE CHECKS FAILED — see FAIL lines above ==="
  exit 1
fi
