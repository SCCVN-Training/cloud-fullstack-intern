"""
Fixed, well-known UUIDs for seed data, shared (by copy, not by import —
see the note in each service's app/scripts/seed.py) between
identity-service and marketplace-service.

Why fixed instead of uuid.uuid4(): identity-service owns the `users`
table and marketplace-service owns `skills`/`bookings`/`reviews`, which
reference user IDs that no longer have a real foreign key (see the
comments in marketplace-service's models.py). Seeding both services
with consistent demo data therefore needs *some* way for marketplace's
seed script to know which user_id is "alice_dev" without querying
identity-service's database directly (a service should never reach
into another service's database) or making a live HTTP call during
seeding (adds a startup-order dependency: marketplace seed script would
fail if identity-service isn't already running).

Fixed UUIDs sidestep both problems for local dev/demo data. This is a
seed-data-only convenience — real user-generated data has no such
shortcut and genuinely does need the IdentityClient REST call
(app/clients/identity_client.py) to resolve cross-service references
at request time. Worth a sentence in your architecture doc as an
explicit scope boundary: "seed data uses fixed IDs; live data uses the
identity-service REST lookup."
"""

ADMIN_USER_ID = "00000000-0000-0000-0000-000000000001"
ALICE_DEV_ID = "00000000-0000-0000-0000-000000000002"
BOB_LEARNER_ID = "00000000-0000-0000-0000-000000000003"
