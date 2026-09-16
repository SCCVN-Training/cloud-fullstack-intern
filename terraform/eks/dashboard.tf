resource "aws_cloudwatch_dashboard" "otakutory_dashboard" {
  dashboard_name = "${local.cluster_name}-observability"

  dashboard_body = jsonencode({
    widgets = [
      # Widget 1: Raw Log Stream - Always captures every single hit
      {
        type   = "log"
        x      = 0
        y      = 0
        width  = 24
        height = 8
        properties = {
          query   = "SOURCE '/otakutory/eks/application-logs' | fields @timestamp, @message | sort @timestamp desc | limit 50"
          region  = local.region
          title   = "Realtime Application Ingestion Stream (All Logs)"
          view    = "table"
        }
      },

      # Widget 2: HTTP Activity & Keyword Counter
      {
        type   = "log"
        x      = 0
        y      = 8
        width  = 12
        height = 6
        properties = {
          query   = "SOURCE '/otakutory/eks/application-logs' | stats count(*) as RequestCount by bin(1m)"
          region  = local.region
          title   = "Traffic Rate: Ingested Log Events / Min"
          view    = "timeSeries"
        }
      },

      # Widget 3: Authentication Failures & Status Codes
      {
        type   = "log"
        x      = 12
        y      = 8
        width  = 12
        height = 6
        properties = {
          query   = "SOURCE '/otakutory/eks/application-logs' | filter @message like /401/ or @message like /login/ or @message like /error/ | fields @timestamp, @message | limit 20"
          region  = local.region
          title   = "Security & Auth Events (Login / 401 Failures)"
          view    = "table"
        }
      }
    ]
     })
}
