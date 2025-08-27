variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type for vLLM server"
  type        = string
  default     = "p4d.24xlarge" # 8x A100 40GB GPUs for 120B model
  # Alternative options:
  # "p4de.24xlarge" - 8x A100 80GB GPUs (more memory)
  # "p5.48xlarge"   - 8x H100 80GB GPUs (latest, more expensive)
  # "g5.48xlarge"   - 8x A10G GPUs (cheaper, less powerful)
}

variable "model_name" {
  description = "HuggingFace model to serve"
  type        = string
  default     = "openai/gpt-oss-120b"
}

variable "hf_token" {
  description = "HuggingFace token for private models"
  type        = string
  default     = ""
  sensitive   = true
}

variable "api_key" {
  description = "API key for vLLM endpoint (optional)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "tensor_parallel_size" {
  description = "Number of GPUs for tensor parallelism"
  type        = number
  default     = 8 # Use all 8 GPUs for 120B model
}

variable "max_model_len" {
  description = "Maximum sequence length"
  type        = number
  default     = 4096
}

variable "port" {
  description = "Port for vLLM server"
  type        = number
  default     = 8000
}

variable "key_pair_name" {
  description = "AWS key pair name for SSH access"
  type        = string
}

variable "allowed_ips" {
  description = "List of IPs allowed to access the API"
  type        = list(string)
  default     = ["0.0.0.0/0"] # Change this to restrict access
}

variable "enable_auto_shutdown" {
  description = "Enable automatic shutdown after inactivity"
  type        = bool
  default     = true
}

variable "auto_shutdown_hours" {
  description = "Hours of inactivity before auto-shutdown"
  type        = number
  default     = 2
}
