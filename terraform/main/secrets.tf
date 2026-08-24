# terraform/secrets.tf

# 1. Create a Secret in AWS Secrets Manager
resource "aws_secretsmanager_secret" "app_secrets" {
  name        = "du-otakutory-microservices-secrets"
  description = "Secrets for Auth, Profile, and Anime services of Otakutory App (managed by Du)"
}

# Note: We do NOT put the actual passwords in this Terraform file.
# You will go to the AWS Console website later to manually paste the JSON
# containing your Database URL and JWT Secret into this vault.
