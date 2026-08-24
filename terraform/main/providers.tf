terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # =======================================================
  # CONFIGURE CLOUD STATE STORAGE (S3 WITH NATIVE LOCKING)
  # =======================================================
  backend "s3" {
    # Replace with the exact S3 bucket name you created in the bootstrap step
    bucket       = "du-microservices-terraform-state-6969"

    key          = "main/terraform.tfstate"
    region       = "ap-southeast-1"
    encrypt      = true

    # Use the modern S3 native lockfile feature (Replaces DynamoDB)
    use_lockfile = true
  }
}

provider "aws" {
  region = "ap-southeast-1"

  # Assign default tags for all created resources
  default_tags {
    tags = {
      Project     = "Otakutory"
      Environment = "Production"
      ManagedBy   = "Terraform"
    }
  }
}
