# Multi-stage build for Node.js backend
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY packages/backend/package*.json ./
RUN npm ci --only=production

# Production stage
FROM node:18-alpine

# Create app user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001

WORKDIR /app

# Copy dependencies from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY packages/backend/package*.json ./

# Copy source code
COPY packages/backend/src ./src

# Change ownership to app user
RUN chown -R backend:nodejs /app
USER backend

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["npm", "start"]