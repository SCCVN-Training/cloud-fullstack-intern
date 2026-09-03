#!/usr/bin/env bash
# Runs both services in the background of this one terminal. For
# interleaved log output that's actually readable, prefer opening two
# terminals and running run-identity.sh / run-marketplace.sh separately
# — that's the recommended way for actual development. This script is
# mainly useful for a quick "does everything boot" smoke check.
set -e
cd "$(dirname "$0")"

./run-identity.sh &
IDENTITY_PID=$!
./run-marketplace.sh &
MARKETPLACE_PID=$!

trap "kill $IDENTITY_PID $MARKETPLACE_PID 2>/dev/null" EXIT

wait
