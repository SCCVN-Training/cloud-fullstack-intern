# =======================================================
# 1. S3 BUCKET FOR HOSTING FRONTEND ANGULAR APP
# =======================================================
resource "aws_s3_bucket" "frontend_bucket" {
  # Bucket name must be globally unique
  bucket_prefix = "otakutory-frontend-6969"
  force_destroy = true # Allows clean destruction of bucket even if non-empty
}

# Block all public access directly to S3
resource "aws_s3_bucket_public_access_block" "frontend_pab" {
  bucket = aws_s3_bucket.frontend_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# =======================================================
# 2. CLOUDFRONT ORIGIN ACCESS CONTROL (OAC)
# =======================================================
resource "aws_cloudfront_origin_access_control" "frontend_oac" {
  name                              = "frontend-s3-oac"
  description                       = "OAC for granting CloudFront access to private S3 frontend bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# =======================================================
# 3. CLOUDFRONT DISTRIBUTION
# =======================================================
resource "aws_cloudfront_distribution" "frontend_cdn" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  comment             = "CDN Distribution for Otakutory Angular SPA"
  price_class         = "PriceClass_100" # Uses lowest cost edge locations (US, Europe, Asia)

  origin {
    domain_name              = aws_s3_bucket.frontend_bucket.bucket_regional_domain_name
    origin_id                = "S3-Frontend-Origin"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend_oac.id
  }

  origin {
    domain_name = "ad29def6db30343e38b560a032cb4469-1693351966.ap-southeast-1.elb.amazonaws.com"
    origin_id   = "EKS-Backend-ALB"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only" # Assuming SSL is offloaded at CloudFront
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  ordered_cache_behavior {
    path_pattern     = "/api/v1/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "EKS-Backend-ALB"

    viewer_protocol_policy = "redirect-to-https"

    # Disable caching for APIs
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Content-Type", "X-Requested-With", "X-User-Id", "Origin"]
      cookies {
        forward = "all"
      }
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-Frontend-Origin"

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  # -----------------------------------------------------
  # SPA ROUTING FIX: Handle Angular routes on Page Refresh
  # -----------------------------------------------------
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  # Default AWS CloudFront SSL Certificate (Free domain *.cloudfront.net)
  viewer_certificate {
    cloudfront_default_certificate = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}

# =======================================================
# 4. S3 BUCKET POLICY (Allow ONLY CloudFront via OAC)
# =======================================================
resource "aws_s3_bucket_policy" "frontend_bucket_policy" {
  bucket = aws_s3_bucket.frontend_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontServicePrincipalReadOnly"
        Effect    = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.frontend_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.frontend_cdn.arn
          }
        }
      }
    ]
  })
}

# =======================================================
# 5. OUTPUTS FOR CI/CD PIPELINE
# =======================================================
output "frontend_s3_bucket_name" {
  description = "S3 Bucket Name where Angular build artifacts should be synced"
  value       = aws_s3_bucket.frontend_bucket.id
}

output "cloudfront_distribution_id" {
  description = "CloudFront Distribution ID for cache invalidation"
  value       = aws_cloudfront_distribution.frontend_cdn.id
}

output "frontend_domain_url" {
  description = "Public URL for Angular Application"
  value       = "https://${aws_cloudfront_distribution.frontend_cdn.domain_name}"
}
