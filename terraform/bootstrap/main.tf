provider "aws" {
  region = "ap-southeast-1" # Đổi lại nếu bạn dùng region khác
}

# =======================================================
# 1. TẠO OIDC PROVIDER CHO GITHUB
# =======================================================
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]

  # Thumbprint của GitHub Actions (Được AWS công nhận)
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1", "1c58a3a8518e8759bf075b76b750d4f2df264fcd"]
}

# =======================================================
# 2. TẠO IAM ROLE CHO GITHUB ACTIONS (BACKEND)
# =======================================================
resource "aws_iam_role" "github_actions_backend_role" {
  name = "GitHubActions_BackendDeployRole"

  # Trust Policy: Chỉ cho phép Repo của BẠN được gọi Role này
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            # THAY THẾ BẰNG TÊN GITHUB CỦA BẠN: "TênUser/TênRepo:*"
            "token.actions.githubusercontent.com:sub" = "repo:SCCVN-Training/cloud-fullstack-intern:*"
          }
        }
      }
    ]
  })
}

# Cấp quyền AdministratorAccess cho Role này (Vì nó cần quyền tạo EKS, ECR, IAM, VPC...)
resource "aws_iam_role_policy_attachment" "github_actions_admin" {
  role       = aws_iam_role.github_actions_backend_role.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

# =======================================================
# OUTPUT: In ra ARN của Role để copy vào GitHub Actions
# =======================================================
output "backend_deploy_role_arn" {
  value       = aws_iam_role.github_actions_backend_role.arn
  description = "Copy ARN này và dán vào file backend-cd.yml trên GitHub Actions"
}

# =======================================================
# 3. S3 BUCKET ĐỂ LƯU TERRAFORM STATE (DÀNH CHO THƯ MỤC MAIN)
# =======================================================
resource "aws_s3_bucket" "terraform_state" {
  # Tên bucket phải là DUY NHẤT trên toàn cầu (hãy đổi hậu tố xyz123 thành số bất kỳ của bạn)
  bucket = "du-microservices-terraform-state-6969"
}

# Bật versioning để lỡ có xóa nhầm hạ tầng thì còn khôi phục được file state cũ
resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

# =======================================================
# 4. DYNAMODB TABLE ĐỂ KHÓA STATE (STATE LOCKING)
# =======================================================
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "du-microservices-terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}

# =======================================================
# 5. CREATE IAM ROLE FOR GITHUB ACTIONS (FRONTEND)
# =======================================================
resource "aws_iam_role" "github_actions_frontend_role" {
  name = "GitHubActions_FrontendDeployRole"

  # Trust Policy: Allow only your specific GitHub repository to assume this role
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            # REPLACE WITH YOUR ACTUAL GITHUB USERNAME
            "token.actions.githubusercontent.com:sub" = "repo:SCCVN-Training/cloud-fullstack-intern:*"
          }
        }
      }
    ]
  })
}

# Grant AdministratorAccess for deploying S3 and CloudFront resources
resource "aws_iam_role_policy_attachment" "github_actions_frontend_admin" {
  role       = aws_iam_role.github_actions_frontend_role.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

# =======================================================
# OUTPUT: Print the Frontend Role ARN for GitHub Actions
# =======================================================
output "frontend_deploy_role_arn" {
  value       = aws_iam_role.github_actions_frontend_role.arn
  description = "Copy this ARN and paste it into frontend-cd.yml on GitHub Actions"
}
