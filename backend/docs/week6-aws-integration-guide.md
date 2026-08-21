# Week 6 — AWS Cloud Services Integration Guide

Companion to the code already implemented in this repo: `app/core/aws_secrets.py`,
`app/core/storage.py` (identity-service), and `lambda/avatar-validator/`. That
code is written, tested against `moto` (mocked AWS — see each test file's
docstring for why), and ready to point at your real AWS account. This guide
covers everything that has to happen in the real AWS Console, which no one
can do for you from outside your account.

**Cost posture for this whole week**: everything below fits comfortably in
the AWS Free Tier (S3, Lambda, Secrets Manager all have generous free
allowances) — set the budget alert in Step 1.4 before doing anything else,
and you'll have a hard warning long before the $100 credit is at any real risk.

## 1. AWS Account Structure, IAM, Regions, AZs, Cost Awareness

### 1.1 Never use the root account day-to-day
The root account (the email you signed up with) can do *anything*, including
close the account or change billing. Create an IAM user for actual work and
stop using root except for the handful of things only root can do (like
initially setting up billing alerts).

**Console → IAM → Users → Create user**
- Name: `skillverse-dev` (or your name)
- Do NOT check "Provide user access to the AWS Management Console" unless you
  also want to log in via browser — for this project, programmatic access
  (API keys) is what you actually need.
- Attach a policy — for now, use `IAMUserChangePassword` plus the specific
  scoped policies you'll create in Steps 2 and 3 below. Avoid
  `AdministratorAccess` even though it's tempting — the whole point of this
  exercise is practicing least privilege.
- After creating the user: **Security credentials tab → Create access key →
  "Command Line Interface (CLI)"**. Download the `.csv` — this is the only
  time AWS shows you the secret key. Store it somewhere safe, never in git.

### 1.2 Regions and Availability Zones
- A **region** is a geographic area (e.g. `ap-southeast-1` = Singapore,
  `us-east-1` = N. Virginia). Pick ONE region for this whole project and stay
  consistent — resources in different regions can't easily talk to each
  other, and cross-region data transfer costs money.
- Recommended for this project: **`ap-southeast-1` (Singapore)** — closest
  major region to Vietnam, lowest latency for local testing.
- An **Availability Zone (AZ)** is an isolated data center within a region
  (e.g. `ap-southeast-1a`, `ap-southeast-1b`). Services like S3 and Lambda
  are automatically multi-AZ — you don't pick one. Elastic Beanstalk (Step 5)
  is where AZ choice becomes visible, since it runs EC2 instances.
- Set your default region once so every AWS CLI/console action defaults
  correctly: **top-right region dropdown in the Console**, and later,
  `aws configure` (Step 6) will ask for it too.

### 1.3 Cost awareness — set this up before anything else
**Console → Billing and Cost Management → Budgets → Create budget**
- Budget type: Cost budget
- Amount: `$20` (or whatever feels like a meaningful checkpoint well under
  your $100 credit)
- Alert threshold: 80% of budgeted amount
- Email: your own email
- This does not stop spending — it emails you. For a hard stop, Free Tier
  usage alerts (**Billing → Preferences → Receive Free Tier Usage Alerts**)
  catch you specifically approaching a free-tier limit, which is the more
  relevant guard for this week's actual usage.

### 1.4 What actually costs money this week (and what doesn't)
| Service | Free tier | Real risk this week |
|---|---|---|
| Secrets Manager | 30-day trial per secret, then ~$0.40/secret/month | Low — delete secrets when done experimenting |
| S3 | 5GB storage, 20k GET, 2k PUT/month | Effectively zero for avatar images |
| Lambda | 1M requests + 400,000 GB-seconds/month | Effectively zero for this exercise |
| Elastic Beanstalk itself | Free | The EC2 instance(s) it creates are NOT free after t2/t3.micro's 750 hrs/month — **stop or terminate the environment when not actively demoing** |

The EB environment is the only thing on this list that can meaningfully
drain your credit if left running for days — that's the one to actively
watch.

## 2. AWS Secrets Manager

### 2.1 Create the secrets
**Console → Secrets Manager → Store a new secret**
- Secret type: "Other type of secret"
- Key/value pairs (add each as a row, not one big JSON blob pasted as a
  single value — though either works, since the code parses the whole
  secret as JSON either way):
  ```
  DATABASE_URL   postgresql+psycopg_async://user:pw@host/db
  SECRET_KEY     <same value you generated for .env>
  ```
  (Same connection string for both services' secrets — schema
  separation happens in `app/core/database.py`, not the URL. No
  `?options=-csearch_path=` needed; see identity-service's
  `.env.example` for why.)
- Secret name: `skillverse/identity-service` (matches this repo's
  `.env.example` default for `AWS_SECRET_NAME`)
- Repeat for marketplace-service: name it `skillverse/marketplace-service`,
  with `DATABASE_URL` (marketplace's schema) and the SAME `SECRET_KEY` value
  (both services must share it — see the code comments on why).

### 2.2 Least-privilege IAM policy to read them
**Console → IAM → Policies → Create policy → JSON**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "secretsmanager:GetSecretValue",
      "Resource": [
        "arn:aws:secretsmanager:ap-southeast-1:<your-account-id>:secret:skillverse/identity-service-*",
        "arn:aws:secretsmanager:ap-southeast-1:<your-account-id>:secret:skillverse/marketplace-service-*"
      ]
    }
  ]
}
```
Name it `skillverse-secrets-read`, attach it to your `skillverse-dev` IAM
user. Note the `-*` suffix — Secrets Manager appends a random suffix to the
ARN internally, and the wildcard is required to match it.

### 2.3 Turn it on locally
This repo's `app/core/aws_secrets.py` already does the fetching — you only
need to flip the switch:
```
# in services/identity-service/.env
USE_AWS_SECRETS=true
AWS_SECRET_NAME=skillverse/identity-service
AWS_REGION=ap-southeast-1
```
Run `aws configure` first (Step 6) so boto3 has credentials to use. Start
the service — if `USE_AWS_SECRETS=true` and the secret can't be fetched, it
fails immediately with a clear error naming the secret and region, rather
than limping along with missing config.

**Verification**: temporarily set `SECRET_KEY=wrong-value-on-purpose` in
`.env` alongside `USE_AWS_SECRETS=true`, start the service, and confirm
logins still work — proving the value came from Secrets Manager
overriding the (wrong) local one, not from `.env`.

## 3. Amazon S3

### 3.1 Create the bucket
**Console → S3 → Create bucket**
- Name: globally unique, e.g. `skillverse-avatars-<yourname>-dev`
- Region: same as everything else (`ap-southeast-1`)
- **Block Public Access settings: leave ALL FOUR boxes checked (blocked)** —
  this is deliberate and matches the code: avatars are served through
  presigned URLs (`get_avatar_url()` in `storage.py`), never a public bucket
  URL. A private bucket + presigned URLs is the safer default; only make a
  bucket public if you have a specific reason to (e.g. serving through
  CloudFront later).
- Everything else: defaults are fine for this exercise.

### 3.2 Least-privilege IAM policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::skillverse-avatars-<yourname>-dev/avatars/*"
    }
  ]
}
```
Scoped to the `avatars/` prefix specifically, not the whole bucket — the
Lambda in Step 4 needs its own, separate policy (it also needs
`s3:DeleteObject` for quarantining, and access to `quarantine/*` too).

### 3.3 Turn it on locally
```
# in services/identity-service/.env
STORAGE_BACKEND=s3
S3_BUCKET_NAME=skillverse-avatars-<yourname>-dev
S3_REGION=ap-southeast-1
```
Upload an avatar through the app (`POST /users/{id}/profile/avatar`) and
confirm in the S3 console that an object appears under `avatars/`. Then
`GET /users/{id}/profile` and confirm `avatarUrl` in the response is a long
presigned URL (not a bare key, not a `localhost` URL) — and that it actually
loads the image when pasted into a browser.

### 3.4 What "connect the app to S3" actually means here
This repo already did the code side of this integration (that's
`app/core/storage.py` + the schema changes wiring `get_avatar_url()` into
every response). Your job this week is Steps 3.1–3.3 above — creating the
real bucket and pointing the already-written code at it.

## 4. AWS Lambda — Serverless Concepts

### 4.1 The concept, briefly
- **Serverless** doesn't mean no servers — it means you don't manage them.
  You upload code; AWS runs it on-demand, scales it automatically, and you
  pay per invocation + execution time, not for idle capacity.
- **Triggers** are what invoke a Lambda: an S3 event, an API Gateway HTTP
  request, a schedule (EventBridge), a queue message (SQS), etc. This
  project's Lambda uses an **S3 event trigger** — invoked automatically
  whenever a new object appears in the bucket.
- **Execution role**: every Lambda has an IAM role attached, defining what
  AWS resources IT (not you) can access when it runs.

### 4.2 Deploy `lambda/avatar-validator/`
The function is already written and tested (`lambda_function.py`,
5/5 tests passing against moto — see `lambda/avatar-validator/tests/`).
Zero third-party dependencies, so deployment is just pasting code — no zip
upload, no layers.

**Console → Lambda → Create function**
- Author from scratch
- Name: `skillverse-avatar-validator`
- Runtime: Python 3.12
- Architecture: x86_64 (default is fine)
- Execution role: "Create a new role with basic Lambda permissions" for now
  — you'll attach the S3 policy next

**Paste the code**: open `lambda/avatar-validator/lambda_function.py` in this
repo, copy its full contents, paste into the Lambda console's code editor
(replacing the default `lambda_function.py` template), click **Deploy**.

**Attach S3 permissions to the execution role**:
**Lambda function page → Configuration → Permissions → click the role name**
(opens IAM) **→ Add permissions → Create inline policy**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::skillverse-avatars-<yourname>-dev/*"
    }
  ]
}
```

**Wire up the S3 trigger**:
**S3 bucket → Properties → Event notifications → Create event notification**
- Name: `avatar-upload-validation`
- Prefix: `avatars/`
- Event types: "All object create events"
- Destination: Lambda function → `skillverse-avatar-validator`

### 4.3 Test it
Upload a valid avatar through the app (as in Step 3.3) — check
**Lambda → Monitor → CloudWatch logs** for a line like
`OK: s3://.../avatars/xyz.png (12345 bytes, image/png)`.

Then upload something that violates policy directly via the S3 console (a
`.txt` file, or an image over 3MB) to `avatars/` — confirm in CloudWatch logs
it gets flagged, and check the bucket: the object should have moved from
`avatars/` to `quarantine/`.

This is your practical proof of "serverless, event-driven processing" for
the presentation — a real trigger firing on a real object, doing real work,
with logs to show it.

## 5. Elastic Beanstalk (concept + light hands-on)

### 5.1 What it actually is
Elastic Beanstalk is a **PaaS layer over EC2** — you give it your
application code (or a Docker image), and it provisions and manages the
EC2 instance(s), load balancer, auto-scaling group, and security group for
you. You still pay for the underlying EC2/ELB resources; EB's management
layer itself is free.

Compare to what you already know:
- **Docker Compose** (Week 5): you manage the container runtime yourself,
  locally.
- **Elastic Beanstalk**: AWS manages the runtime, scaling, and health
  monitoring — you just deploy application code/a container image.
- **Raw EC2**: you manage everything, including the OS.

### 5.2 Environment tiers
- **Web server environment**: handles HTTP requests directly (what you want
  for `marketplace-service` or `identity-service`).
- **Worker environment**: pulls jobs from an SQS queue, no direct HTTP —
  not relevant to this project yet.

### 5.3 Deploy one service (recommended: marketplace-service, since it has
no file-upload/media dependency to configure)
**Console → Elastic Beanstalk → Create application**
- Application name: `skillverse-marketplace`
- Platform: Docker (since you already have `services/marketplace-service/Dockerfile`
  from Week 5) — or "Python 3.12" platform if you'd rather skip Docker here
  and let EB run `uvicorn` directly via a `Procfile`.
- Application code: zip `services/marketplace-service/` (excluding
  `.venv`/`__pycache__`) and upload, or connect via the EB CLI
  (`pip install awsebcli`, then `eb init` / `eb create` from that directory).

**Configure environment variables** (this is where Week 6's config-from-env
principle shows up at the infrastructure level, not just in `.env`):
**Configuration → Software → Environment properties** — add `DATABASE_URL`,
`SECRET_KEY`, `IDENTITY_SERVICE_URL`, etc. directly here (EB injects them as
real environment variables into the running instance — same mechanism
`pydantic-settings` already reads locally, so **no code changes needed** to
run in EB).

### 5.4 Cost discipline
**When you're done demoing**: **Actions → Terminate environment**. An EB
environment left running is an EC2 instance + load balancer left running,
billed continuously. Re-creating it later takes a few minutes — there's no
reason to leave it up between demo sessions.

## 6. Reading Secrets & S3 Config from Environment Variables

This is already fully implemented — this section is about confirming *how*,
so you can explain it:

- `app/core/config.py` (both services): a `pydantic-settings` `Settings`
  class. Every field is either read from `.env` locally, or from real
  environment variables when deployed (e.g. on Elastic Beanstalk) — the
  class itself has no idea which.
- `app/core/aws_secrets.py`: runs BEFORE `Settings()` is ever instantiated,
  and — only if `USE_AWS_SECRETS=true` — fetches a secret from Secrets
  Manager and injects its keys into `os.environ`. From `Settings()`'s
  perspective, those values just... were already environment variables.
  Same mechanism, one extra optional step.
- `app/core/storage.py`: reads `STORAGE_BACKEND`/`S3_BUCKET_NAME`/
  `S3_REGION` from `settings`, same as any other config value.

The point to be able to explain: **the application code never branches on
"am I local or on AWS"** — it always just reads `settings.X`. Everything
AWS-specific is confined to two files (`aws_secrets.py`, `storage.py`) and
one env var each (`USE_AWS_SECRETS`, `STORAGE_BACKEND`).

## 7. Running Locally Against Real AWS Services, Securely

### 7.1 Get credentials onto your machine — the right way
```
pip install awscli
aws configure
```
This prompts for Access Key ID, Secret Access Key (from Step 1.1's `.csv`),
default region (`ap-southeast-1`), and output format (`json`). It writes to
`~/.aws/credentials` — **outside your project directory**, so it can never
accidentally get committed to git, unlike a key pasted into `.env`.

boto3 (used throughout this repo's AWS code) automatically finds credentials
here with zero extra config — that's why `app/core/aws_secrets.py` and
`app/core/storage.py` never construct a `boto3.client(...)` with explicit
keys anywhere.

### 7.2 What "secure access practices" means concretely, for this project
- Never use root account keys — always the scoped `skillverse-dev` IAM user
  (Step 1.1).
- Never put access keys in `.env`, `.env.example`, or anywhere in the git
  repo. `aws configure` avoids this by construction.
- Every IAM policy above is scoped to exactly one bucket/secret, not `*` —
  if the `skillverse-dev` key ever leaked, the blast radius is one dev
  bucket and two secrets, not your whole AWS account.
- Rotate the access key periodically: **IAM → Users → skillverse-dev →
  Security credentials → create a new key, delete the old one** once the new
  one's confirmed working.
- `.gitignore` already covers `.env` (from Week 5) — confirm
  `~/.aws/credentials` was never inside the repo directory in the first
  place (it isn't, by `aws configure`'s default).

### 7.3 Run it
```
cd services/identity-service
# .env: USE_AWS_SECRETS=true, STORAGE_BACKEND=s3, real bucket/secret names
uvicorn app.main:app --reload --port 8001
```
Same command as every prior week — the only difference is what's in `.env`.

## 8. Presentation to the Coach

Reuse the Week 5 deck's visual style (same palette, same theory→practice
pairing, same "proof, not just claims" section) for consistency — the coach
already knows that format. Suggested structure:

1. **Title** — Week 6: AWS Cloud Services Integration
2. **Theory**: IAM least-privilege, regions/AZs (briefly)
3. **Proof**: screenshot of the `skillverse-dev` IAM user's attached
   policies (scoped, not `AdministratorAccess`) + the budget alert configured
4. **Theory**: why Secrets Manager over `.env` in production
5. **Proof**: screenshot of both secrets in Secrets Manager (values hidden/
   redacted) + a terminal showing the app booting with
   `USE_AWS_SECRETS=true` and successfully authenticating
6. **Theory**: why a private bucket + presigned URLs over a public bucket
7. **Proof**: S3 console showing an uploaded avatar under `avatars/`, and
   the actual presigned URL from a real `GET /profile` response, opened in a
   browser to show it loads
8. **Theory**: serverless / event-driven triggers
9. **Proof**: CloudWatch logs showing the Lambda firing on both a valid
   upload (`OK`) and an invalid one (`QUARANTINE`), plus the bucket showing
   the object actually moved to `quarantine/`
10. **Theory**: Elastic Beanstalk vs. raw EC2 vs. Week 5's local scripts
11. **Proof**: EB environment health dashboard (green), and the running
    app's `/health` endpoint hit through the EB-provided URL
12. **Reflection**: cost discipline — what you terminated/cleaned up after
    demoing, and what stayed within Free Tier
13. **Closing**

Every "Proof" slide above should be a real screenshot from your own AWS
account — that's the difference between a deck the coach can nod along to
and one that's actually verifiable.
