variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
}

variable "oidc_provider_arn" {
  description = "ARN of the cluster OIDC provider"
  type        = string
}

variable "oidc_provider_url" {
  description = "URL of the cluster OIDC provider"
  type        = string
}

variable "namespace" {
  description = "Namespace for ADOT Collector"
  type        = string
  default     = "amazon-cloudwatch"
}

variable "service_account_name" {
  description = "Service account name for ADOT Collector"
  type        = string
  default     = "adot-collector-sa"
}
