# vLLM Deployment on AWS EC2

This is a standalone vLLM deployment for serving large language models (like openai/gpt-oss-120b) on AWS EC2 with GPU support.

## Architecture

- **Single EC2 instance** with 8x A100 GPUs (p4d.24xlarge)
- **vLLM server** with tensor parallelism across all GPUs
- **OpenAI-compatible API** endpoint
- **Auto-shutdown** to save costs when idle
- **CloudWatch monitoring** for GPU/CPU metrics

## Prerequisites

1. **AWS Account** with GPU instance quota
2. **AWS CLI** configured with credentials
3. **Terraform** installed (v1.0+)
4. **SSH Key Pair** created in AWS EC2

## Quick Start

### 1. Configure Terraform

```bash
cd vllm-deployment
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your settings
```

Key settings to update:
- `key_pair_name`: Your AWS SSH key pair name
- `allowed_ips`: Restrict to your IP address for security
- `hf_token`: If using a private HuggingFace model

### 2. Deploy Infrastructure

```bash
terraform init
terraform plan
terraform apply
```

This will create:
- EC2 instance with GPUs
- Security groups
- Elastic IP for stable endpoint
- CloudWatch logging
- Auto-start vLLM service

### 3. Wait for Setup

The instance takes ~10-15 minutes to:
- Download and install vLLM
- Download the model (can take longer for 120B models)
- Start the service

Monitor progress:
```bash
# Get SSH command from Terraform output
terraform output ssh_command

# SSH into instance and check logs
ssh -i your-key.pem ubuntu@<PUBLIC_IP>
sudo journalctl -u vllm -f
```

### 4. Test the API

Once running, test with:
```bash
# Get test command from Terraform output
terraform output test_curl_command

# Or manually:
curl -X POST "http://<PUBLIC_IP>:8000/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-oss-120b",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

## Integration with Your App

In your main application's `.env`:
```env
LLM_API_TYPE=openai-compatible
LLM_API_BASE_URL=http://<PUBLIC_IP>:8000/v1
LLM_API_KEY=dummy-key
LLM_MODEL=openai/gpt-oss-120b
```

## Cost Management

### Auto-Shutdown
The instance automatically shuts down after 2 hours of inactivity (configurable).

### Manual Stop/Start
```bash
# Stop instance (save costs when not using)
terraform output stop_instance_command | bash

# Start instance when needed
terraform output start_instance_command | bash
```

### Instance Costs
- **p4d.24xlarge**: ~$32/hour (8x A100 40GB)
- **p4de.24xlarge**: ~$40/hour (8x A100 80GB) - for larger models
- **g5.48xlarge**: ~$16/hour (8x A10G) - cheaper but less powerful

## Monitoring

### CloudWatch Metrics
- GPU utilization
- GPU memory usage
- CPU and RAM usage
- vLLM logs

### View Logs
```bash
# Via SSH
terraform output logs_command | bash

# Via AWS Console
# Go to CloudWatch > Log Groups > /aws/ec2/vllm-server
```

## Troubleshooting

### Model Not Found
If you get "model not found" errors:
1. Check if the model exists on HuggingFace
2. Verify HF_TOKEN if it's a private model
3. Check available disk space (120B models need ~250GB)

### Out of Memory
For 120B models, you may need:
- Use `p4de.24xlarge` (80GB GPUs) instead of `p4d.24xlarge`
- Reduce `max_model_len` in terraform.tfvars
- Adjust `gpu-memory-utilization` in user_data.sh

### Connection Refused
1. Check security group allows your IP
2. Verify vLLM service is running: `sudo systemctl status vllm`
3. Check instance is running: `aws ec2 describe-instances`

## Customization

### Different Models
Edit `terraform.tfvars`:
```hcl
model_name = "meta-llama/Llama-2-70b-chat-hf"
tensor_parallel_size = 4  # Adjust based on model size
```

### Performance Tuning
Edit `terraform/user_data.sh` vLLM parameters:
- `--max-num-seqs`: Concurrent requests
- `--gpu-memory-utilization`: GPU memory usage (0.95 = 95%)
- `--enable-prefix-caching`: Cache common prefixes

## Cleanup

To destroy all resources:
```bash
terraform destroy
```

## Security Notes

1. **Restrict IP access**: Update `allowed_ips` in terraform.tfvars
2. **Use API keys**: Set `api_key` in terraform.tfvars
3. **Enable HTTPS**: Add an Application Load Balancer with SSL
4. **Private subnet**: Deploy in private subnet with NAT gateway

## Support

For issues:
1. Check vLLM logs: `sudo journalctl -u vllm -f`
2. Check user-data logs: `sudo cat /var/log/user-data.log`
3. Verify GPU availability: `nvidia-smi`
4. Test vLLM locally: `vllm serve --help`
