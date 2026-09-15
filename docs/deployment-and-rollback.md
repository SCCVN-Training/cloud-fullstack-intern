# Deployment and Rollback

## Deployment procedure

### Prerequisites (only after an instance replacement — see "Full redeploy" below for when this applies)
- `infra/bootstrap/` already applied (one-time, permanent)
- `infra/dynamic/` applied — a running k3s node
- `infra/static/` applied — ECR repos, frontend S3 bucket, CloudFront distribution

### Normal deployment (code change, same instance still running)
1. Push a change to `backend/services/identity-service/**` or `marketplace-service/**` on any `nhu/**` or `dev-nhu` branch.
2. GitHub Actions (`.github/workflows/build-push.yml`) builds and pushes both images to ECR automatically, tagged with both `:latest` and the commit SHA (`${{ github.sha }}`).
3. Force the running deployment to pick up the new image:
   ```
   kubectl rollout restart deployment/identity-service
   kubectl rollout restart deployment/marketplace-service
   ```
4. Verify: `kubectl get pods` — both should cycle through a new pod and reach `Running`.

### Full redeploy (after `infra/dynamic/` has been destroyed and recreated)
This is the common case, since compute is deliberately destroyed between sessions to save cost. Every instance replacement wipes the entire k3s cluster — nothing persists. Full sequence:

1. **Get the new kubeconfig** — k3s's node doesn't allow reliable live SSH/SSM sessions on this network; retrieval is via the instance's boot console log instead:
   ```
   Powershell: $env:PYTHONUTF8="1"
   CMD: set PYTHONUTF8=1

   aws ec2 get-console-output --instance-id <new-id> --output text > console.txt

   powershell -ExecutionPolicy Bypass -File .\extract-kubeconfig.ps1

   $env:KUBECONFIG = "$PWD\skillverse-config"
   kubectl get nodes
   ```
2. **Re-sync CloudFront's origin** (it's a one-time snapshot of the old instance's DNS, now stale):
   ```
   cd infra\static
   terraform apply -var="frontend_bucket_name=skillverse-frontend-nhu" -var="dynamic_state_bucket=skillverse-tfstate-nhu"
   ```
3. **Recreate the ECR image-pull secret** (containerd doesn't use the node's IAM role automatically, and the token expires after ~12h even if it did survive):
   ```
   $ecrPassword = aws ecr get-login-password --region ap-southeast-1
   kubectl create secret docker-registry ecr-secret --docker-server=455880746025.dkr.ecr.ap-southeast-1.amazonaws.com --docker-username=AWS --docker-password=$ecrPassword --docker-email=none@example.com
   ```
4. **Recreate both application Secrets** (values in `skillverse/shared` plus the fields it's missing — see `cloud-environment-plan.md`):
   ```
   kubectl create secret generic identity-secrets --from-literal=SECRET_KEY=b9_fDV0yDzoZarHbAfXonwOPdtmyUCr3I76gWyQOHc0 --from-literal=ALGORITHM=HS256 --from-literal=ACCESS_TOKEN_EXPIRE_MINUTES=30 "--from-literal=DATABASE_URL=postgresql+psycopg_async://skillverse_user:npg_W5zbDsgC0AnI@ep-jolly-shadow-aztvzw9p-pooler.c-3.ap-southeast-1.aws.neon.tech/skillverse_db?sslmode=require&channel_binding=require&sslnegotiation=direct" --from-literal=ALLOWED_ORIGINS=https://d3is4tc33i20xi.cloudfront.net --from-literal=USE_AWS_SECRETS=false --from-literal=STORAGE_BACKEND=s3 --from-literal=S3_REGION=ap-southeast-1 --from-literal=S3_BUCKET_NAME=skillverse-avatars-nhu-dev

   kubectl create secret generic marketplace-secrets --from-literal=SECRET_KEY=b9_fDV0yDzoZarHbAfXonwOPdtmyUCr3I76gWyQOHc0 --from-literal=ALGORITHM=HS256 --from-literal=ACCESS_TOKEN_EXPIRE_MINUTES=30 "--from-literal=DATABASE_URL=postgresql+psycopg_async://skillverse_user:npg_W5zbDsgC0AnI@ep-jolly-shadow-aztvzw9p-pooler.c-3.ap-southeast-1.aws.neon.tech/skillverse_db?sslmode=require&channel_binding=require&sslnegotiation=direct" --from-literal=ALLOWED_ORIGINS=https://d3is4tc33i20xi.cloudfront.net --from-literal=USE_AWS_SECRETS=false
   ```
5. **Re-apply the k8s manifests**:
   ```
   kubectl apply -f infra\k8s\identity-service.yaml -f infra\k8s\marketplace-service.yaml -f infra\k8s\ingress.yaml
   ```
6. **Verify**:
   ```
   kubectl get pods
   curl http://<new-instance-ip>/api/identity/health
   curl https://d3is4tc33i20xi.cloudfront.net/api/identity/health   (after a few minutes for CloudFront propagation)
   ```

## Rollback procedure

Because the build pipeline tags every image with both `:latest` and the immutable git commit SHA, rollback is precise, not a guess:

```
kubectl set image deployment/identity-service identity-service=455880746025.dkr.ecr.ap-southeast-1.amazonaws.com/skillverse-identity:<previous-known-good-sha>
kubectl set image deployment/marketplace-service marketplace-service=455880746025.dkr.ecr.ap-southeast-1.amazonaws.com/skillverse-marketplace:<previous-known-good-sha>
```

Find a known-good SHA via `aws ecr describe-images --repository-name skillverse-identity --output json` (look at `imageTags` and `imagePushedAt` on older images) or via GitHub's commit history for the branch.

**Database migrations**: no destructive schema migration should ship without a tested rollback script first — this applies regardless of which environment the migration runs against (this rule was already established during local development, e.g. the skill-duration column type change).

## What rollback does NOT cover

- **Infrastructure-level rollback** (e.g., undoing a bad Terraform change to `dynamic/` or `static/`) is handled by Terraform's own state history, not this procedure — `terraform plan` against a previous commit of the `.tf` files shows what would need to change back.
- **CloudFront's origin staleness** (see `cloud-environment-plan.md`) isn't something `kubectl set image` fixes — that needs `static/` re-applied, as in the Full Redeploy steps above.