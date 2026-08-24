# =======================================================
# ECR REPOSITORIES FOR MICROSERVICES (D.R.Y Approach)
# =======================================================

locals {
  # Define the list of microservices to create repositories for
  microservices = ["auth", "profile", "anime"]
}

resource "aws_ecr_repository" "microservice_repos" {
  for_each             = toset(local.microservices)

  name                 = "otakutory-${each.key}-service"
  image_tag_mutability = "MUTABLE"
  force_delete         = true # Allows deleting the repo even if it contains images

  # Enable automatic vulnerability scanning when an image is pushed
  image_scanning_configuration {
    scan_on_push = true
  }
}

# =======================================================
# ECR LIFECYCLE POLICY (Cost Optimization)
# =======================================================

resource "aws_ecr_lifecycle_policy" "cleanup_policy" {
  for_each   = aws_ecr_repository.microservice_repos
  repository = each.value.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep only the last 30 images to save storage costs"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 30
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# =======================================================
# OUTPUTS FOR GITHUB ACTIONS
# =======================================================

output "ecr_repository_urls" {
  description = "The URLs of the ECR repositories to be used in CI/CD pipelines"
  value = {
    for k, v in aws_ecr_repository.microservice_repos : k => v.repository_url
  }
}
