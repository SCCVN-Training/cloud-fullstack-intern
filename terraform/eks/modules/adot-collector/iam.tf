resource "aws_iam_role" "adot_role" {
  name = "${var.cluster_name}-adot-role"

  # Grant Web Identity OIDC permissions to the Kubernetes Service Account
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRoleWithWebIdentity"
      Effect = "Allow"
      Principal = {
        Federated = var.oidc_provider_arn
      }
      Condition = {
        "StringEquals" = {
          "${replace(var.oidc_provider_url, "https://", "")}:sub" : "system:serviceaccount:${var.namespace}:${var.service_account_name}",
          "${replace(var.oidc_provider_url, "https://", "")}:aud" : "sts.amazonaws.com"
        }
      }
    }]
  })
}

# Attach policy to allow pushing traces to AWS X-Ray
resource "aws_iam_role_policy_attachment" "adot_xray" {
  role       = aws_iam_role.adot_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}

# Attach policy to allow pushing metrics and logs to CloudWatch
resource "aws_iam_role_policy_attachment" "adot_cloudwatch" {
  role       = aws_iam_role.adot_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# Output the IAM Role ARN to be injected into the Helm Chart
output "iam_role_arn" {
  value = aws_iam_role.adot_role.arn
}
