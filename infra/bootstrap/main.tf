terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
  # Bootstrap has nowhere to store its own state remotely yet (chicken-and-egg),
  # so this one stage uses local state. Keep terraform.tfstate for this folder
  # somewhere safe (commit to a private repo, or back it up) — it's the only
  # state file in this whole plan that isn't in S3.
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default = "ap-southeast-1"
}

variable "github_org" {
  description = "Your GitHub username or org"
  type        = string
}

variable "github_repo" {
  description = "Repo name, e.g. skillverse"
  type        = string
}

variable "state_bucket_name" {
  description = "Must be globally unique across all of AWS"
  type        = string
}

# --- Terraform remote state backend (used by static/ and dynamic/) ---

resource "aws_s3_bucket" "tfstate" {
  bucket = var.state_bucket_name
}

resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket                  = aws_s3_bucket.tfstate.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_dynamodb_table" "tflock" {
  name         = "skillverse-tf-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"
  attribute {
    name = "LockID"
    type = "S"
  }
}

# --- OIDC: let GitHub Actions assume a role without a static access key ---

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

resource "aws_iam_role" "github_actions" {
  name = "skillverse-github-actions"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = aws_iam_openid_connect_provider.github.arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_org}/${var.github_repo}:*"
        }
      }
    }]
  })
}

# Minimum permissions to build/push images and deploy — tighten further once
# you know exactly which actions your workflow needs.
resource "aws_iam_role_policy" "github_actions" {
  name = "skillverse-ci-permissions"
  role = aws_iam_role.github_actions.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["ecr:GetAuthorizationToken"]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability", "ecr:PutImage",
          "ecr:InitiateLayerUpload", "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload", "ecr:BatchGetImage"
        ]
        Resource = "arn:aws:ecr:${var.aws_region}:*:repository/skillverse-*"
      },
      {
        Effect   = "Allow"
        Action   = ["s3:PutObject", "s3:GetObject", "s3:ListBucket", "s3:DeleteObject"]
        Resource = ["arn:aws:s3:::skillverse-frontend*", "arn:aws:s3:::skillverse-frontend*/*"]
      },
      {
        Effect   = "Allow"
        Action   = ["cloudfront:CreateInvalidation"]
        Resource = "*"
      }
    ]
  })
}

output "state_bucket_name" {
  value = aws_s3_bucket.tfstate.bucket
}
output "lock_table_name" {
  value = aws_dynamodb_table.tflock.name
}
output "github_actions_role_arn" {
  value = aws_iam_role.github_actions.arn
}
