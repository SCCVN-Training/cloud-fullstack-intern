data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "eks_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "du-eks-vpc"
  }
}

resource "aws_subnet" "eks_subnet" {
  count                   = 2
  vpc_id                  = aws_vpc.eks_vpc.id
  cidr_block              = "10.0.${count.index}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "du-eks-subnet-${count.index}"
  }
}

resource "aws_internet_gateway" "eks_igw" {
  vpc_id = aws_vpc.eks_vpc.id

  tags = {
    Name = "du-eks-igw"
  }
}

resource "aws_route_table" "eks_rt" {
  vpc_id = aws_vpc.eks_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.eks_igw.id
  }

  tags = {
    Name = "du-eks-route-table"
  }
}

resource "aws_route_table_association" "eks_rta" {
  count          = 2
  subnet_id      = aws_subnet.eks_subnet[count.index].id
  route_table_id = aws_route_table.eks_rt.id
}

resource "aws_iam_role" "eks_cluster_role" {
  name = "du_eks_cluster_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  role       = aws_iam_role.eks_cluster_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

resource "aws_eks_cluster" "main" {
  name     = "du-microservices-cluster"
  role_arn = aws_iam_role.eks_cluster_role.arn

  vpc_config {
    subnet_ids = aws_subnet.eks_subnet[*].id
  }

  access_config {
    authentication_mode                         = "API_AND_CONFIG_MAP"
    bootstrap_cluster_creator_admin_permissions = true
  }

  depends_on = [aws_iam_role_policy_attachment.eks_cluster_policy]
}

resource "aws_iam_role" "eks_node_role" {
  name = "du_eks_node_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  role       = aws_iam_role.eks_node_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  role       = aws_iam_role.eks_node_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}

resource "aws_iam_role_policy_attachment" "eks_container_registry" {
  role       = aws_iam_role.eks_node_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_eks_node_group" "nodes" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "du-node-group"
  node_role_arn   = aws_iam_role.eks_node_role.arn
  subnet_ids      = aws_subnet.eks_subnet[*].id

  scaling_config {
    desired_size = 1
    max_size     = 2
    min_size     = 1
  }

  instance_types = ["t3.small"]

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry,
    aws_iam_role_policy_attachment.eks_secrets_attachment,
  ]
}

resource "aws_iam_policy" "eks_secrets_policy" {
  name        = "du_eks_secrets_policy"
  description = "Allow EKS nodes to read secrets from AWS Secrets Manager"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = [
          "secretsmanager:GetSecretValue"
        ]
        # It is recommended to restrict this to the specific secret ARN in production
        Resource = "*"
      }
    ]
  })
}

# Attach the secrets policy to the worker node role
resource "aws_iam_role_policy_attachment" "eks_secrets_attachment" {
  role       = aws_iam_role.eks_node_role.name
  policy_arn = aws_iam_policy.eks_secrets_policy.arn
}

# ==========================================
# IRSA: IAM Roles for Service Accounts
# ==========================================

# Fetch the EKS cluster OIDC issuer certificate
data "tls_certificate" "eks" {
  url = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

# Create OIDC Provider for the cluster
resource "aws_iam_openid_connect_provider" "eks" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

# Create a specific IAM Role for the Kubernetes Pods
resource "aws_iam_role" "eks_pod_role" {
  name = "du_eks_pod_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRoleWithWebIdentity"
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.eks.arn
      }
      Condition = {
        "StringEquals" = {
          # Bind this role strictly to the "app-service-account" in the "default" namespace
          "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:sub" : "system:serviceaccount:default:app-service-account",
          "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:aud" : "sts.amazonaws.com"
        }
      }
    }]
  })
}

# Attach the secrets policy to the POD role (Not the Node role!)
resource "aws_iam_role_policy_attachment" "eks_pod_secrets_attachment" {
  role       = aws_iam_role.eks_pod_role.name
  policy_arn = aws_iam_policy.eks_secrets_policy.arn
}

# Output the Pod Role ARN so senpai can copy it easily
output "pod_role_arn" {
  value = aws_iam_role.eks_pod_role.arn
}

# Fetch current AWS account ID automatically
data "aws_caller_identity" "current" {}

# Create an access entry for the GitHub Actions IAM Role
resource "aws_eks_access_entry" "github_actions" {
  cluster_name  = aws_eks_cluster.main.name
  principal_arn = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/GitHubActions_BackendDeployRole"
  type          = "STANDARD"
}

# Grant Cluster Admin permissions so GitHub Actions can deploy manifests
resource "aws_eks_access_policy_association" "github_actions_admin" {
  cluster_name  = aws_eks_cluster.main.name
  policy_arn    = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
  principal_arn = aws_eks_access_entry.github_actions.principal_arn

  access_scope {
    type = "cluster"
  }
}

# ==========================================
# ADOT Collector (OpenTelemetry) Module
# ==========================================
module "adot_collector" {
  source = "./modules/adot-collector"

  # Pass cluster identifiers
  cluster_name         = aws_eks_cluster.main.name

  # Pass OIDC details for IRSA (IAM Roles for Service Accounts)
  oidc_provider_arn    = aws_iam_openid_connect_provider.eks.arn
  oidc_provider_url    = aws_iam_openid_connect_provider.eks.url

  # Define deployment namespace
  namespace            = "amazon-cloudwatch"
  service_account_name = "adot-collector-sa"

  # MUST wait for worker nodes to be ready before deploying the Helm chart
  depends_on = [
    aws_eks_node_group.nodes
  ]
}
