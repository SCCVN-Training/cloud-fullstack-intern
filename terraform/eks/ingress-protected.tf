# =======================================================
# File: ingress-protected.tf (For Profile & Anime Services)
# =======================================================
resource "kubernetes_ingress_v1" "protected_ingress" {
  metadata {
    name      = "protected-ingress"
    namespace = "default"
    annotations = {
      "kubernetes.io/ingress.class"                        = "nginx"

      # CORS configuration[cite: 2]
      "nginx.ingress.kubernetes.io/enable-cors"            = "true"
      "nginx.ingress.kubernetes.io/cors-allow-origin"      = "https://d1vg0upw51xgyk.cloudfront.net"
      "nginx.ingress.kubernetes.io/cors-allow-methods"     = "GET, POST, OPTIONS, PUT, DELETE, PATCH"
      "nginx.ingress.kubernetes.io/cors-allow-headers"     = "Authorization, Content-Type, X-Requested-With, X-User-Id"
      "nginx.ingress.kubernetes.io/cors-allow-credentials" = "true"

      # Rate limit: 10 requests per second matching old user_limit
      "nginx.ingress.kubernetes.io/limit-rps"              = "10"
      "nginx.ingress.kubernetes.io/limit-burst-multiplier" = "2" # 10 * 2 = 20 burst

      # Auth middleware: Forward to auth-service verify endpoint
      # Using internal cluster DNS for auth-service
      "nginx.ingress.kubernetes.io/auth-url"               = "http://auth-service.default.svc.cluster.local:8001/auth/verify"
      "nginx.ingress.kubernetes.io/auth-response-headers"  = "X-User-Id"

      "nginx.ingress.kubernetes.io/auth-send-cookie"       = "true"

      "nginx.ingress.kubernetes.io/use-regex"               = "true"
      "nginx.ingress.kubernetes.io/rewrite-target"         = "/$1/$3"
    }
  }

  spec {
    ingress_class_name = "nginx"

    rule {
      http {
        path {
          path       = "/api/v1/(profile)(/|$)(.*)"
          path_type  = "ImplementationSpecific"
          # path       = "/api/v1/profile"
          # path_type  = "Prefix"
          backend {
            service {
              name = "profile-service"
              port { number = 8002 }
            }
          }
        }
        path {
          path       = "/api/v1/(anime)(/|$)(.*)"
          path_type  = "ImplementationSpecific"
          # path       = "/api/v1/anime"
          # path_type  = "Prefix"
          backend {
            service {
              name = "anime-service"
              port { number = 8003 }
            }
          }
        }
      }
    }
  }
}
