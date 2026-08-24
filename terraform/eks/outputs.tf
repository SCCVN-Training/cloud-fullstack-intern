# Output endpoint of the EKS cluster for kubectl configuration
output "cluster_endpoint" {
  value = aws_eks_cluster.main.endpoint
}

# Output cluster name
output "cluster_name" {
  value = aws_eks_cluster.main.name
}
