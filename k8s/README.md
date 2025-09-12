# ParkWise Kubernetes Deployment

This directory contains all the necessary files to deploy ParkWise to any Kubernetes cluster.

## Quick Start

### Prerequisites

- Kubernetes cluster (1.25+)
- kubectl configured
- Helm 3.x installed
- Container registry access (GitHub Container Registry recommended)

### 1. Build and Push Images

```bash
# Build all images
docker build -f k8s/dockerfiles/frontend.Dockerfile -t parkwise/frontend:latest .
docker build -f k8s/dockerfiles/backend.Dockerfile -t parkwise/backend:latest .
docker build -f k8s/dockerfiles/llm-service.Dockerfile -t parkwise/llm-service:latest .
docker build -f k8s/dockerfiles/mcp-server.Dockerfile -t parkwise/mcp-server:latest .

# Push to your registry
docker tag parkwise/frontend:latest your-registry/parkwise-frontend:latest
docker push your-registry/parkwise-frontend:latest
# Repeat for other services...
```

### 2. Deploy with Helm (Recommended)

```bash
# Create namespace
kubectl create namespace parkwise

# Create secrets (replace with your actual values)
kubectl create secret generic parkwise-secrets \
  --from-literal=OPENAI_API_KEY="your-openai-key" \
  --from-literal=ANTHROPIC_API_KEY="your-anthropic-key" \
  --from-literal=FIREBASE_PROJECT_ID="your-firebase-project" \
  -n parkwise

# Deploy with Helm
helm install parkwise ./k8s/helm/parkwise \
  --namespace parkwise \
  --set frontend.image.repository=your-registry/parkwise-frontend \
  --set backend.image.repository=your-registry/parkwise-backend \
  --set llmService.image.repository=your-registry/parkwise-llm-service \
  --set mcpServer.image.repository=your-registry/parkwise-mcp-server \
  --set ingress.hosts[0].host=your-domain.com
```

### 3. Deploy with kubectl (Alternative)

```bash
# Deploy namespace
kubectl apply -f k8s/manifests/namespace.yaml

# Deploy ConfigMap and Secrets
kubectl apply -f k8s/manifests/configmap.yaml
# Edit and apply secrets (don't commit actual secrets!)
kubectl apply -f k8s/manifests/secrets-template.yaml

# Deploy services
kubectl apply -f k8s/manifests/deployments/
kubectl apply -f k8s/manifests/ingress.yaml
```

## Cloud-Specific Setup

### AWS EKS

```bash
# Install AWS Load Balancer Controller
helm repo add eks https://aws.github.io/eks-charts
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=your-cluster-name

# Use ALB ingress class
# Update ingress.yaml: kubernetes.io/ingress.class: "alb"
```

### Google GKE

```bash
# Enable ingress addon
gcloud container clusters update your-cluster --update-addons=HttpLoadBalancing=ENABLED

# Use gce ingress class
# Update ingress.yaml: kubernetes.io/ingress.class: "gce"
```

### Azure AKS

```bash
# Install nginx ingress controller
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx
```

### DigitalOcean DOKS

```bash
# Install nginx ingress controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/do/deploy.yaml
```

## Monitoring Setup

### Install Prometheus & Grafana

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace
```

## Scaling

### Manual Scaling

```bash
kubectl scale deployment parkwise-backend --replicas=5 -n parkwise
```

### Auto-scaling

```bash
# Enable HPA in values.yaml
helm upgrade parkwise ./k8s/helm/parkwise \
  --set autoscaling.enabled=true \
  --set autoscaling.minReplicas=2 \
  --set autoscaling.maxReplicas=10
```

## Troubleshooting

### Check Pod Status

```bash
kubectl get pods -n parkwise
kubectl describe pod <pod-name> -n parkwise
kubectl logs <pod-name> -n parkwise
```

### Check Services

```bash
kubectl get svc -n parkwise
kubectl describe ingress parkwise-ingress -n parkwise
```

### Common Issues

1. **Image Pull Errors**: Check image names and registry credentials
2. **Pod Crashes**: Check resource limits and environment variables
3. **503 Errors**: Verify service selectors and pod readiness probes
4. **SSL Issues**: Ensure cert-manager is installed and configured

## Security

- All containers run as non-root users
- Resource limits are enforced
- Secrets are managed via Kubernetes secrets
- Network policies can be added for additional isolation

## Cost Optimization

- Use node selectors for GPU workloads (LLM service)
- Enable cluster autoscaling
- Use spot instances where appropriate
- Monitor resource usage with metrics