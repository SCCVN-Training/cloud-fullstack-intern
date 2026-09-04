terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
  backend "s3" {
    bucket         = "skillverse-tfstate-nhu"
    key            = "static/terraform.tfstate"
    region         = "ap-southeast-1"
    dynamodb_table = "skillverse-tf-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default = "ap-southeast-1"
}

variable "frontend_bucket_name" {
  description = "Must be globally unique"
  type        = string
}

variable "dynamic_state_bucket" {
  description = "Same bucket as this stage's backend — used to read dynamic/'s outputs"
  type        = string
}

# --- Container registries — explicit, not looped, since you have 2 services ---

resource "aws_ecr_repository" "identity" {
  name                 = "skillverse-identity"
  image_tag_mutability = "MUTABLE"
}

resource "aws_ecr_repository" "marketplace" {
  name                 = "skillverse-marketplace"
  image_tag_mutability = "MUTABLE"
}

# --- Frontend static hosting ---

resource "aws_s3_bucket" "frontend" {
  bucket = var.frontend_bucket_name
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "skillverse-frontend-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.frontend.arn}/*"
      Condition = {
        StringEquals = { "AWS:SourceArn" = aws_cloudfront_distribution.frontend.arn }
      }
    }]
  })
}

# --- Read dynamic/'s state to find the k3s node's public IP for the API origin ---
# NOTE: this will fail on the very first `terraform apply` of this stage, before
# dynamic/ has ever been applied. That's expected — see the run order in chat.
data "terraform_remote_state" "dynamic" {
  backend = "s3"
  config = {
    bucket = var.dynamic_state_bucket
    key    = "dynamic/terraform.tfstate"
    region = var.aws_region
  }
}

resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  default_root_object = "index.html"

  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "frontend-s3"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  # API traffic proxied to the k3s node's Traefik ingress
  origin {
    domain_name = data.terraform_remote_state.dynamic.outputs.instance_public_dns
    origin_id   = "k3s-api"
    custom_origin_config {
      http_port              = 80
      https_port              = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods          = ["GET", "HEAD"]
    target_origin_id       = "frontend-s3"
    viewer_protocol_policy = "redirect-to-https"
    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }
  }

  ordered_cache_behavior {
    path_pattern           = "/api/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods          = ["GET", "HEAD"]
    target_origin_id       = "k3s-api"
    viewer_protocol_policy = "https-only"
    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Content-Type"]
      cookies { forward = "all" }
    }
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

output "ecr_identity_url" {
  value = aws_ecr_repository.identity.repository_url
}
output "ecr_marketplace_url" {
  value = aws_ecr_repository.marketplace.repository_url
}
output "frontend_bucket" {
  value = aws_s3_bucket.frontend.bucket
}
output "cloudfront_domain" {
  value = aws_cloudfront_distribution.frontend.domain_name
}
