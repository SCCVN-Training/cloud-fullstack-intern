# Kubernetes Ingress configuration with CORS support based on legacy Nginx rules
resource "kubernetes_ingress_v1" "main_ingress" {
  metadata {
    name      = "microservices-ingress"
    namespace = "default"
    annotations = {
      "kubernetes.io/ingress.class"                         = "nginx"
      "nginx.ingress.kubernetes.io/enable-cors"             = "true"
      "nginx.ingress.kubernetes.io/cors-allow-origin"       = "http://localhost:4200, https://d1vg0upw51xgyk.cloudfront.net"
      "nginx.ingress.kubernetes.io/cors-allow-methods"      = "GET, POST, OPTIONS, PUT, DELETE, PATCH"
      "nginx.ingress.kubernetes.io/cors-allow-headers"      = "Authorization, Content-Type, X-Requested-With, X-User-Id"
      "nginx.ingress.kubernetes.io/cors-allow-credentials"  = "true"
    }

  }

  depends_on = [aws_eks_node_group.nodes]

  spec {
    rule {
      http {
        path {
          path      = "/api/v1/auth"
          path_type = "Prefix"
          backend {
            service {
              name = "auth-service"
              port {
                number = 8001
              }
            }
          }
        }

        path {
          path      = "/api/v1/profile"
          path_type = "Prefix"
          backend {
            service {
              name = "profile-service"
              port {
                number = 8002
              }
            }
          }
        }

        path {
          path      = "/api/v1/anime"
          path_type = "Prefix"
          backend {
            service {
              name = "anime-service"
              port {
                number = 8003
              }
            }
          }
        }
      }
    }
  }
}
