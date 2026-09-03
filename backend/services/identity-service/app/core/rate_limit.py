"""
Shared rate limiter (slowapi, built on the `limits` library).

Storage note: default in-memory storage is fine for a single local
`uvicorn` process (this app today). It does NOT share state across
multiple worker processes or multiple machines — if this is ever run
with `--workers > 1` or behind a load balancer, switch the storage_uri
below to a Redis backend (e.g. "redis://localhost:6379") so all
processes share the same counters. Worth a line in your architecture
doc as a known trade-off.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])
