# Multi-stage build for React frontend
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY packages/frontend/package*.json ./
RUN npm ci --only=production

# Copy source code
COPY packages/frontend/ ./

# Build the app
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Copy built app to nginx
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY k8s/configs/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]