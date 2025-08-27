output "vllm_endpoint" {
  description = "vLLM API endpoint URL"
  value       = "http://${aws_eip.vllm_eip.public_ip}:${var.port}"
}

output "vllm_openai_base_url" {
  description = "OpenAI-compatible base URL for vLLM"
  value       = "http://${aws_eip.vllm_eip.public_ip}:${var.port}/v1"
}

output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.vllm_server.id
}

output "public_ip" {
  description = "Public IP address"
  value       = aws_eip.vllm_eip.public_ip
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh -i ${var.key_pair_name}.pem ubuntu@${aws_eip.vllm_eip.public_ip}"
}

output "model_name" {
  description = "Model being served"
  value       = var.model_name
}

output "gpu_count" {
  description = "Number of GPUs used"
  value       = var.tensor_parallel_size
}

output "test_curl_command" {
  description = "Example curl command to test the API"
  value       = <<EOF
curl -X POST "${aws_eip.vllm_eip.public_ip}:${var.port}/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "${var.model_name}",
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ]
  }'
EOF
}

output "logs_command" {
  description = "Command to view vLLM logs"
  value       = "ssh -i ${var.key_pair_name}.pem ubuntu@${aws_eip.vllm_eip.public_ip} 'sudo journalctl -u vllm -f'"
}

output "stop_instance_command" {
  description = "AWS CLI command to stop the instance (save costs)"
  value       = "aws ec2 stop-instances --instance-ids ${aws_instance.vllm_server.id} --region ${var.aws_region}"
}

output "start_instance_command" {
  description = "AWS CLI command to start the instance"
  value       = "aws ec2 start-instances --instance-ids ${aws_instance.vllm_server.id} --region ${var.aws_region}"
}
