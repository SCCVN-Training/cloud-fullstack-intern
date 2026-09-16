# SNS Topic to dispatch alarm notifications
resource "aws_sns_topic" "alerts" {
  name = "${local.cluster_name}-incident-alerts"
}

# Alarm 1: Critical 5XX Server Error Spike
resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  alarm_name          = "${local.cluster_name}-high-5xx-errors"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Triggers when application backend throws 10 or more 5XX errors within 2 minutes."
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"
}

# Alarm 2: High Latency Degradation (p95)
resource "aws_cloudwatch_metric_alarm" "alb_high_latency" {
  alarm_name          = "${local.cluster_name}-high-latency"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  extended_statistic  = "p95"
  threshold           = 1.5 # 1.5 seconds latency threshold
  alarm_description   = "Triggers when 95th percentile response time exceeds 1.5 seconds."
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"
}

# Alarm 3: Unhealthy Target Hosts (CrashLoopBackOff or Port Failure)
resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_hosts" {
  alarm_name          = "${local.cluster_name}-unhealthy-hosts"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Maximum"
  threshold           = 0
  alarm_description   = "Triggers when one or more pods fail ALB health checks."
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"
}

# Output the SNS Topic ARN for email or Slack integration
output "sns_alerts_topic_arn" {
  description = "ARN of SNS Topic for CloudWatch incident alerting"
  value       = aws_sns_topic.alerts.arn
}
