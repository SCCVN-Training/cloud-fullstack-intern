terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
  backend "s3" {
    bucket         = "skillverse-tfstate-nhu"
    key            = "dynamic/terraform.tfstate"
    region         = "ap-southeast-1"
    dynamodb_table = "skillverse-tf-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default = "ap-southeast-1"
}

variable "my_ip_cidr" {
  description = "Your IP in CIDR form, e.g. 1.2.3.4/32 — restricts SSH/kubectl access"
  type        = string
}

variable "key_pair_name" {
  description = "An existing EC2 key pair name for SSH access"
  type        = string
}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_security_group" "k3s_node" {
  name   = "skillverse-k3s-node"
  vpc_id = data.aws_vpc.default.id

  ingress {
    description = "SSH - restricted to your IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_ip_cidr]
  }
  ingress {
    description = "kubectl - restricted to your IP"
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = [var.my_ip_cidr]
  }
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# --- Node-level IAM: scoped to exactly what the pods on this node need ---

resource "aws_iam_role" "k3s_node" {
  name = "skillverse-k3s-node-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "k3s_node" {
  name = "skillverse-k3s-node-permissions"
  role = aws_iam_role.k3s_node.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue"]
        Resource = "arn:aws:secretsmanager:${var.aws_region}:*:secret:skillverse/shared-*"
      },
      {
        Effect   = "Allow"
        Action   = ["ecr:GetAuthorizationToken"]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = ["ecr:BatchGetImage", "ecr:GetDownloadUrlForLayer"]
        Resource = "arn:aws:ecr:${var.aws_region}:*:repository/skillverse-*"
      },
      {
        Effect = "Allow"
        Action = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"]
        Resource = "arn:aws:s3:::skillverse-avatars-nhu-dev/*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "k3s_node" {
  name = "skillverse-k3s-node-profile"
  role = aws_iam_role.k3s_node.name
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.k3s_node.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_instance" "k3s_node" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.small"
  subnet_id              = data.aws_subnets.default.ids[0]
  key_name               = var.key_pair_name
  vpc_security_group_ids = [aws_security_group.k3s_node.id]
  iam_instance_profile   = aws_iam_instance_profile.k3s_node.name

  credit_specification {
    cpu_credits = "standard"
  }

  user_data = <<-EOF
    #!/bin/bash
    PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
    curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--tls-san $${PUBLIC_IP}" sh -
    cp /etc/rancher/k3s/k3s.yaml /home/ubuntu/k3s.yaml
    sed -i "s/127.0.0.1/$${PUBLIC_IP}/" /home/ubuntu/k3s.yaml
    chown ubuntu:ubuntu /home/ubuntu/k3s.yaml

    echo "-----BEGIN KUBECONFIG-----"
    gzip -c /home/ubuntu/k3s.yaml | base64 -w 60
    echo "-----END KUBECONFIG-----"

    sleep 90
    echo "-----BEGIN SSM AGENT LOG-----"
    tail -n 150 /var/log/amazon/ssm/amazon-ssm-agent.log
    echo "-----END SSM AGENT LOG-----"

  EOF

  tags = { Name = "skillverse-k3s-node" }
}

output "instance_public_ip" {
  value = aws_instance.k3s_node.public_ip
}
output "instance_public_dns" {
  value = aws_instance.k3s_node.public_dns
}
output "instance_id" {
  value = aws_instance.k3s_node.id
}