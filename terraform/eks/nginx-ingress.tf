resource "helm_release" "nginx_ingress" {
  name             = "ingress-nginx"
  repository       = "https://kubernetes.github.io/ingress-nginx"
  chart            = "ingress-nginx"
  namespace        = "ingress-nginx"
  create_namespace = true

  # MUST wait for the EKS Node Group to be fully provisioned before installing!
  depends_on = [aws_eks_node_group.nodes]
}
