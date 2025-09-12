# Multi-stage build for MCP server
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY packages/mcp-server/package*.json ./
RUN npm ci --only=production

# Production stage
FROM node:18-alpine

# Create app user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S mcpuser -u 1001

WORKDIR /app

# Copy dependencies from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY packages/mcp-server/package*.json ./

# Copy source code
COPY packages/mcp-server/tools ./tools
COPY packages/mcp-server/resources ./resources
COPY packages/mcp-server/*.js ./

# Change ownership to app user
RUN chown -R mcpuser:nodejs /app
USER mcpuser

# Expose port (if needed)
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "process.exit(0)"

CMD ["npm", "start"]