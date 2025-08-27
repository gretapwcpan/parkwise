terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Get the latest Deep Learning AMI
data "aws_ami" "deep_learning" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["Deep Learning AMI GPU PyTorch * (Ubuntu 20.04)*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Security group for vLLM server
resource "aws_security_group" "vllm_sg" {
  name        = "vllm-server-sg"
  description = "Security group for vLLM server"

  # SSH access
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ips
  }

  # vLLM API access
  ingress {
    from_port   = var.port
    to_port     = var.port
    protocol    = "tcp"
    cidr_blocks = var.allowed_ips
  }

  # Outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "vllm-server-sg"
  }
}

# Elastic IP for stable endpoint
resource "aws_eip" "vllm_eip" {
  domain = "vpc"
  tags = {
    Name = "vllm-server-eip"
  }
}

# IAM role for EC2 instance
resource "aws_iam_role" "vllm_role" {
  name = "vllm-server-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

# IAM policy for CloudWatch logs
resource "aws_iam_role_policy" "vllm_policy" {
  name = "vllm-server-policy"
  role = aws_iam_role.vllm_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

# Instance profile
resource "aws_iam_instance_profile" "vllm_profile" {
  name = "vllm-server-profile"
  role = aws_iam_role.vllm_role.name
}

# User data script for instance initialization
locals {
  user_data = templatefile("${path.module}/user_data.sh", {
    model_name           = var.model_name
    hf_token            = var.hf_token
    api_key             = var.api_key
    tensor_parallel_size = var.tensor_parallel_size
    max_model_len       = var.max_model_len
    port                = var.port
    enable_auto_shutdown = var.enable_auto_shutdown
    auto_shutdown_hours  = var.auto_shutdown_hours
  })
}

# EC2 instance for vLLM server
resource "aws_instance" "vllm_server" {
  ami                    = data.aws_ami.deep_learning.id
  instance_type          = var.instance_type
  key_name              = var.key_pair_name
  vpc_security_group_ids = [aws_security_group.vllm_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.vllm_profile.name

  # Root volume configuration
  root_block_device {
    volume_size = 500  # GB - needed for model storage
    volume_type = "gp3"
    iops        = 16000
    throughput  = 1000
    encrypted   = true
  }

  user_data = base64encode(local.user_data)

  tags = {
    Name = "vllm-server"
    Model = var.model_name
  }

  # Ensure proper shutdown
  instance_initiated_shutdown_behavior = "stop"
}

# Associate Elastic IP with instance
resource "aws_eip_association" "vllm_eip_assoc" {
  instance_id   = aws_instance.vllm_server.id
  allocation_id = aws_eip.vllm_eip.id
}

# CloudWatch Log Group for vLLM logs
resource "aws_cloudwatch_log_group" "vllm_logs" {
  name              = "/aws/ec2/vllm-server"
  retention_in_days = 7

  tags = {
    Name = "vllm-server-logs"
  }
}

# CloudWatch alarm for high GPU utilization
resource "aws_cloudwatch_metric_alarm" "gpu_utilization" {
  alarm_name          = "vllm-high-gpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "GPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "90"
  alarm_description   = "This metric monitors GPU utilization"
  alarm_actions       = []

  dimensions = {
    InstanceId = aws_instance.vllm_server.id
  }
}
