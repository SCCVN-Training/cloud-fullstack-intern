resource "helm_release" "adot_collector" {
  name             = "adot-collector"
  repository       = "https://open-telemetry.github.io/opentelemetry-helm-charts"
  chart            = "opentelemetry-collector"
  namespace        = var.namespace
  create_namespace = true

  # Inject the IAM Role ARN into the Kubernetes Service Account
  set {
    name  = "serviceAccount.create"
    value = "true"
  }

  set {
    name  = "serviceAccount.name"
    value = var.service_account_name
  }

  set {
    name  = "serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
    value = aws_iam_role.adot_role.arn
  }

  # Load the OpenTelemetry pipeline configuration
  values = [
    file("${path.module}/adot-values.yaml")
  ]
}

resource "aws_cloudwatch_log_group" "application_logs" {
  name              = "/otakutory/eks/application-logs"
  retention_in_days = 3
}

resource "aws_cloudwatch_log_group" "metrics_logs" {
  name              = "/otakutory/eks/metrics"
  retention_in_days = 3
}
