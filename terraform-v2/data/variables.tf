variable "aws_region" {
  type    = string
  default = "ap-southeast-1"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "project_name" {
  type    = string
  default = "nephos"
}

variable "data_vpc_cidr" {
  type    = string
  default = "10.1.0.0/16"
}

variable "compute_vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "db_username" {
  type    = string
  default = "postgres"
}
