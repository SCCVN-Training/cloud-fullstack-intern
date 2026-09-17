# Cloud Environment Plan

This document describes the actual AWS environment SkillVerse runs on — networking,
compute, database, object storage, and secret management — as provisioned by the
Terraform in `infra/` (`bootstrap/`, `dynamic/`, `static/`). It reflects what's
really deployed, not an aspirational target.

## Networking

There is no custom VPC. `infra/dynamic/main.tf` reads the account's **default VPC**
(`data "aws_vpc" "default"`) and picks the first of its **default public subnets**
(`data "aws_subnets" "default"`, `.ids[0]`) to launch the k3s node into. There are no
private subnets and no NAT gateway — the node has a public IP directly, which is what
makes the console-log kubeconfig-extraction workflow and CloudFront's custom origin
possible without a bastion or VPN.

Access is controlled entirely at the security-group level. `aws_security_group.k3s_node`
("skillverse-k3s-node") allows:

- **22 (SSH)** and **6443 (kubectl API)** — restricted to `var.my_ip_cidr`, i.e. one
  developer's IP, not the world.
- **80 and 443 (HTTP/HTTPS)** — open to `0.0.0.0/0`, since this is what CloudFront's
  custom origin and any real end-user traffic need to reach.
- **All egress** — unrestricted, so the node can reach ECR, Secrets Manager, the Neon
  database, and package repos.

There is no dedicated load balancer resource in front of the node (see the EKS
comparison below for why that's a meaningful difference, not just a naming detail).
CloudFront (`infra/static/main.tf`) sits in front of both the static frontend (S3
origin) and the API (`/api/*` routed to a custom HTTP origin pointed at the k3s node's
public DNS), so it's the closest thing this environment has to an edge load balancer —
but it proxies to a single fixed origin, it doesn't do the health-check-based routing
or scaling a real ALB/NLB would.

## Compute

A single `t3.small` EC2 instance (`aws_instance.k3s_node`, Ubuntu 22.04) runs
[k3s](https://k3s.io/), a lightweight single-binary Kubernetes distribution, installed
via `user_data` at boot. This one instance is simultaneously the k3s **control plane**
(API server, scheduler, etcd-equivalent) and the only **worker node** — both
`identity-service` and `marketplace-service` pods run on it, scheduled by k3s the same
way they would be on any Kubernetes cluster, just with exactly one place for the
scheduler to put them.

Compute is deliberately destroyed between work sessions rather than left running: the
node costs roughly $0.02–0.03/hr on-demand for a `t3.small` in `ap-southeast-1`, so
tearing it down (`terraform destroy` on `infra/dynamic/`) between sessions is worth the
one-time cost of a redeploy (see `deployment-and-rollback.md`'s "Full redeploy" steps).
The instance carries a scoped IAM instance profile (`skillverse-k3s-node-role`) granting
exactly what the pods on it need: `secretsmanager:GetSecretValue` on the
`skillverse/shared-*` path, ECR pull access on `skillverse-*` repositories, and
S3 read/write/delete on the `skillverse-avatars-nhu-dev` bucket — nothing broader.

This was a deliberate choice over Amazon EKS. An EKS control plane alone costs a flat
**~$0.10/hr (~$73/month)** regardless of how small or idle the cluster is — that fee
exists whether or not any workload is running, and it isn't something you can pause
between sessions. For a project this size, running for a training environment rather
than production, a single destroyable `t3.small` running k3s gets the same
"pods, Services, Ingress, Secrets" development experience for a small fraction of the
cost, with the tradeoffs documented in the next section.

## What would change on EKS

This project's choice of a single-node k3s cluster over managed EKS is a cost decision
for a training environment, not a claim that the two are equivalent — the following are
the concrete differences that would matter if this were a production system.

**Multi-node scheduling.** This project's single k3s node runs both `identity-service`
and `marketplace-service` pods on the same physical machine — there's no scheduling
*decision* to make, because there's only one place for a pod to go, and no resilience if
that one node fails: losing it takes down both services at once. On EKS, a cluster
typically spans multiple worker nodes (often across multiple Availability Zones), and
the Kubernetes scheduler actively decides which node runs which pod based on resource
requests/limits, node affinity, and current load. That buys two things this setup can't:
better resource utilization across the fleet, and the ability to survive a single node's
failure — the scheduler just reschedules the affected pods onto a surviving node.

**Managed, highly-available control plane.** k3s's control plane (API server, scheduler,
the embedded datastore) runs on the *exact same* EC2 instance as the workload pods here
— if that instance goes down, the application and the ability to manage the cluster
(`kubectl` itself) go down together, at the same time, for the same reason. There's no
separating "my app is down" from "I can't even see what's wrong." EKS's control plane is
managed by AWS and runs across multiple Availability Zones, entirely decoupled from
worker node health — a worker node failing (or even every worker node failing) never
takes down the API server, so you can still run `kubectl get nodes` and see exactly
what's broken.

**IRSA vs. node-level IAM — the concrete security gap.** This project's pods reach AWS
services (Secrets Manager, ECR, S3) through the *node's* IAM instance profile
(`skillverse-k3s-node-role`, above) — every pod scheduled onto that node inherits the
same set of AWS permissions, because standard Kubernetes has no mechanism to further
restrict which specific pod gets which specific AWS permission at the node-credential
level. Concretely: `marketplace-service`'s pods *could* call
`secretsmanager:GetSecretValue` or write to the avatars S3 bucket, the same permissions
granted for `identity-service`'s use, simply because they happen to run on the same
node — nothing in this setup prevents it. EKS supports **IRSA** (IAM Roles for Service
Accounts), which uses OIDC federation between the cluster and IAM to bind AWS
permissions to individual Kubernetes ServiceAccounts rather than to the node. With IRSA,
`identity-service`'s ServiceAccount could be scoped to *only* the Secrets Manager/S3
permissions it actually needs, and `marketplace-service`'s pods — running on that same
node — would have no way to assume those credentials at all. This is a real gap worth
naming plainly: this project's current node-level-IAM setup would not be appropriate for
a genuinely multi-tenant system where different services need hard isolation from each
other's AWS permissions, and IRSA is the piece that would need to be added first if this
ever grew in that direction.

**Ingress: Traefik vs. AWS Load Balancer Controller.** This project's `Ingress`
resources (`infra/k8s/ingress.yaml`) are served by k3s's bundled Traefik, which runs as
a pod on the node itself and binds directly to the host's ports 80/443 — there is no
separate load-balancer resource in AWS at all; CloudFront's custom origin points
straight at the node's public IP. On EKS, the equivalent path is typically installing
the **AWS Load Balancer Controller**, which watches `Ingress` resources in the cluster
and provisions a real, separate, managed **Application Load Balancer** to route traffic
to pods — a distinct AWS resource with its own health checks, target groups, and
scaling, not a pod sharing the node it's routing to. Migrating would require a concrete,
non-trivial change: the `Middleware`/`stripPrefix` objects this project relies on
(`strip-api-identity`, `strip-api-marketplace` in `ingress.yaml`) are Traefik-specific
custom resources (`traefik.io/v1alpha1`) — the AWS Load Balancer Controller has no
concept of a Traefik `Middleware` and doesn't watch for it at all. That path-stripping
behavior would need to be re-expressed either as ALB Ingress annotations (e.g. a
rewrite-target annotation, if the controller supports the needed rule) or moved into the
application itself (each service stripping its own path prefix), since it can no longer
be delegated to an ingress-level Traefik plugin.

## Database

The database is [Neon](https://neon.tech) serverless Postgres — an external managed
Postgres provider, not Amazon RDS. Both `identity-service` and `marketplace-service`
connect to the same Neon project via separate schemas (`identity`, `marketplace`) rather
than separate database instances, keeping this a single connection string to manage per
service while still giving each service its own tables. This was chosen over RDS for the
same reason as the k3s-over-EKS tradeoff above: Neon's free/low tier avoids paying for
an always-on RDS instance for a training environment with intermittent usage, and Neon's
serverless scale-to-zero behavior means idle time between sessions doesn't cost anything
extra, unlike an RDS instance which bills per hour regardless of query volume.

## Object Storage

Three S3 buckets, each with a distinct purpose and access policy:

- **`skillverse-tfstate-nhu`** — Terraform remote state for `dynamic/` and `static/`
  (versioned, all public access blocked). `bootstrap/` itself uses local state, since it
  creates this very bucket and has nowhere remote to store its own state yet.
- **`skillverse-frontend-nhu`** — the built Angular app's static files. All public
  access is blocked at the bucket level; the only reader is CloudFront, via Origin
  Access Control (`aws_cloudfront_origin_access_control`) plus a bucket policy scoped to
  that specific CloudFront distribution's ARN — the bucket itself is never
  publicly reachable.
- **`skillverse-avatars-nhu-dev`** — user-uploaded avatar images, written and read
  directly by the backend (via the node's IAM role) and served to end users via
  presigned URLs generated by the application, not a public bucket policy.

## Secret Management

AWS Secrets Manager is designed into the application (`app/core/aws_secrets.py` in both
services), gated by a `USE_AWS_SECRETS` environment variable — when enabled, secrets are
fetched from the `skillverse/shared-*` path at startup and injected into the process
environment before `Settings()` loads, and the node's IAM role is scoped to allow
exactly that (`secretsmanager:GetSecretValue` on `skillverse/shared-*`, nothing wider).

The current cluster deploy runs with `USE_AWS_SECRETS=false`, however: `SECRET_KEY` and
`DATABASE_URL` are injected directly as Kubernetes `Secret` objects
(`identity-secrets`/`marketplace-secrets`, recreated by hand on every full redeploy per
`deployment-and-rollback.md`) rather than fetched from Secrets Manager at pod startup.
Non-sensitive configuration (`ALLOWED_ORIGINS`, `ALGORITHM`,
`ACCESS_TOKEN_EXPIRE_MINUTES`) lives in Kubernetes `ConfigMap` objects instead, kept
separate from the `Secret` objects specifically so which values are genuinely sensitive
is visible from the object list itself. Turning `USE_AWS_SECRETS` on for the cluster
deploy — so pods pull secrets from Secrets Manager directly instead of via manually
recreated Kubernetes Secrets — is called out in `docs/manual-deploy-steps.md` as the
highest-priority remaining piece of manual-step automation.
