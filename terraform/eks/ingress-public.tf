# =======================================================
# File: ingress-public.tf (For Auth Service)
# =======================================================
resource "kubernetes_ingress_v1" "public_ingress" {
  metadata {
    name      = "public-ingress"
    namespace = "default"
    annotations = {
      "kubernetes.io/ingress.class"                        = "nginx"

      # CORS configuration matching legacy setup[cite: 2]
      "nginx.ingress.kubernetes.io/enable-cors"            = "true"
      "nginx.ingress.kubernetes.io/cors-allow-origin"      = "https://d1vg0upw51xgyk.cloudfront.net"
      "nginx.ingress.kubernetes.io/cors-allow-methods"     = "GET, POST, OPTIONS, PUT, DELETE, PATCH"
      "nginx.ingress.kubernetes.io/cors-allow-headers"     = "Authorization, Content-Type, X-Requested-With, X-User-Id"
      "nginx.ingress.kubernetes.io/cors-allow-credentials" = "true"

      # Rate limit: 1 request per second matching old ip_limit
      "nginx.ingress.kubernetes.io/limit-rps"              = "1"
      "nginx.ingress.kubernetes.io/limit-burst-multiplier" = "3"

      "nginx.ingress.kubernetes.io/use-regex"               = "true"
      "nginx.ingress.kubernetes.io/rewrite-target"         = "/$1/$3"


    }
  }

  spec {
    ingress_class_name = "nginx"

    rule {
      http {
        path {
          path       = "/api/v1/(auth)(/|$)(.*)"
          path_type  = "ImplementationSpecific"
          backend {
            service {
              name = "auth-service"
              port { number = 8001 }
            }
          }
        }
      }
    }
  }
}
