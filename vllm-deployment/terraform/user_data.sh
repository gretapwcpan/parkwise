#!/bin/bash
set -e

# Log all output
exec > >(tee -a /var/log/user-data.log)
exec 2>&1

echo "Starting vLLM server setup at $(date)"

# Update system
apt-get update
apt-get upgrade -y

# Install required packages
apt-get install -y python3-pip git htop nvtop

# Upgrade pip
pip3 install --upgrade pip

# Install vLLM
pip3 install vllm

# Set environment variables
export HF_TOKEN="${hf_token}"
export CUDA_VISIBLE_DEVICES=0,1,2,3,4,5,6,7

# Create vLLM service directory
mkdir -p /opt/vllm
cd /opt/vllm

# Create vLLM start script
cat > /opt/vllm/start_vllm.sh << 'SCRIPT'
#!/bin/bash
export HF_TOKEN="${hf_token}"
export CUDA_VISIBLE_DEVICES=0,1,2,3,4,5,6,7

# Start vLLM server
vllm serve "${model_name}" \
    --host 0.0.0.0 \
    --port ${port} \
    --tensor-parallel-size ${tensor_parallel_size} \
    --max-model-len ${max_model_len} \
    --gpu-memory-utilization 0.95 \
    --max-num-seqs 256 \
    --enable-prefix-caching \
    %{ if api_key != "" }--api-key "${api_key}" \%{ endif }
    --trust-remote-code \
    2>&1 | tee -a /var/log/vllm.log
SCRIPT

chmod +x /opt/vllm/start_vllm.sh

# Create systemd service
cat > /etc/systemd/system/vllm.service << 'SERVICE'
[Unit]
Description=vLLM Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/vllm
ExecStart=/opt/vllm/start_vllm.sh
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment="PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

[Install]
WantedBy=multi-user.target
SERVICE

# Create health check script
cat > /opt/vllm/health_check.sh << 'HEALTH'
#!/bin/bash
curl -f http://localhost:${port}/health || exit 1
HEALTH
chmod +x /opt/vllm/health_check.sh

# Create auto-shutdown script if enabled
%{ if enable_auto_shutdown }
cat > /opt/vllm/auto_shutdown.sh << 'SHUTDOWN'
#!/bin/bash
# Check if vLLM has been idle for specified hours
IDLE_MINUTES=$((${auto_shutdown_hours} * 60))
LAST_REQUEST_FILE="/tmp/last_vllm_request"

# Update last request time when API is accessed
if ! systemctl is-active --quiet vllm; then
    echo "vLLM service is not running"
    exit 0
fi

# Check if there's recent activity
if [ -f "$LAST_REQUEST_FILE" ]; then
    LAST_REQUEST=$(stat -c %Y "$LAST_REQUEST_FILE")
    CURRENT_TIME=$(date +%s)
    IDLE_TIME=$(( (CURRENT_TIME - LAST_REQUEST) / 60 ))
    
    if [ $IDLE_TIME -gt $IDLE_MINUTES ]; then
        echo "Instance has been idle for $IDLE_TIME minutes. Shutting down..."
        shutdown -h now
    fi
else
    # Create the file if it doesn't exist
    touch "$LAST_REQUEST_FILE"
fi
SHUTDOWN
chmod +x /opt/vllm/auto_shutdown.sh

# Add cron job for auto-shutdown check
echo "*/5 * * * * /opt/vllm/auto_shutdown.sh" | crontab -u ubuntu -
%{ endif }

# Enable and start vLLM service
systemctl daemon-reload
systemctl enable vllm
systemctl start vllm

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
dpkg -i amazon-cloudwatch-agent.deb

# Configure CloudWatch agent for GPU metrics
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'CW_CONFIG'
{
  "metrics": {
    "namespace": "vLLM",
    "metrics_collected": {
      "nvidia_gpu": {
        "measurement": [
          {
            "name": "utilization_gpu",
            "rename": "GPU_Utilization",
            "unit": "Percent"
          },
          {
            "name": "utilization_memory",
            "rename": "GPU_Memory_Utilization",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60
      },
      "cpu": {
        "measurement": [
          {
            "name": "cpu_usage_idle",
            "rename": "CPU_Idle",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60
      },
      "mem": {
        "measurement": [
          {
            "name": "mem_used_percent",
            "rename": "Memory_Used",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60
      }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/vllm.log",
            "log_group_name": "/aws/ec2/vllm-server",
            "log_stream_name": "{instance_id}/vllm"
          }
        ]
      }
    }
  }
}
CW_CONFIG

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -s \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

echo "vLLM server setup completed at $(date)"
echo "Server will be available at http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):${port}"
