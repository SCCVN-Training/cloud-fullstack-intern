# Manual Deployment Steps — Automation Candidates

This lists every manual step in the current deploy/redeploy process (see
`deployment-and-rollback.md` for the full procedure), so it's visible which
parts are candidates for CI/CD or Terraform automation versus which are
already automated.

## Already automated

- **Image build and push** — `.github/workflows/build-push.yml` builds and
  pushes both service images to ECR on every push to `nhu/**`/`dev-nhu`,
  tagged `:latest` and with the commit SHA. No manual Docker build/push step.
- **Infrastructure provisioning** — `infra/bootstrap`, `infra/dynamic`,
  `infra/static` are all Terraform, applied via `terraform apply`. Not a
  console click-through.

## Still manual

| Step | Why it's manual today | Automation candidate |
|---|---|---|
| Kubeconfig extraction after a node replacement | k3s's node doesn't allow a reliable live SSH/SSM session on this network, so retrieval goes through the instance boot console log (`extract-kubeconfig.ps1`) instead of a direct copy | Could be scripted as a Terraform `local-exec` provisioner, or replaced entirely by fixing SSM connectivity so `aws ssm start-session` works reliably |
| Re-syncing CloudFront's origin (`terraform apply` on `infra/static`) after a node replacement | CloudFront's origin is a one-time snapshot of the old instance's DNS/IP, taken at apply time — it goes stale the moment the EC2 instance is replaced | Could be automated with a Terraform Elastic IP (stable address across replacements) so `static/` never needs re-applying just because `dynamic/` changed |
| Recreating the ECR image-pull secret (`ecr-secret`) | containerd doesn't pick up the node's IAM role automatically for registry auth, and the token expires after ~12h regardless | A CronJob or a `kubelet` image-credential-provider plugin could refresh this automatically instead of a manual `kubectl create secret` after every redeploy |
| Recreating `identity-secrets`/`marketplace-secrets` | Nothing persists across a full k3s teardown/recreate — the cluster (and everything applied to it) is wiped along with the EC2 instance | Could be automated by having `USE_AWS_SECRETS=true` pull `SECRET_KEY`/`DATABASE_URL` directly from Secrets Manager at pod startup instead of injecting them via `kubectl create secret` — the code path already exists (`app/core/aws_secrets.py`), it's just not turned on for the cluster deploy |
| Applying the ConfigMaps (`identity-config.yaml`/`marketplace-config.yaml`) | Small, low-risk manual step added alongside the Secret creation during a full redeploy | Low priority to automate — unlike the Secrets, ConfigMap values are static and not tied to the instance's IP, so this only needs re-applying if the values themselves change (e.g. `ALLOWED_ORIGINS` if `cloudfront_domain` ever changes), not on every teardown/recreate |
| Re-applying the k8s manifests (`kubectl apply -f infra/k8s/...`) | No CD step watches the cluster and reconciles it against the manifests in git | A GitOps controller (Argo CD / Flux) or a final "deploy" job in the GitHub Actions workflow would close this gap |

## Priority if automating incrementally

1. Turn on `USE_AWS_SECRETS=true` for the cluster deploy — removes the two
   most error-prone manual steps (recreating both Secrets by hand).
2. Attach an Elastic IP to the k3s node — removes the CloudFront re-sync
   step entirely, since the origin address would stop changing.
3. Add a real CD step (`kubectl apply` from the pipeline, or a GitOps
   controller) — removes the last manual step in the loop.
