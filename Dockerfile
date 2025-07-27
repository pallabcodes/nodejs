# ===================================
# 🏗️ Multi-stage Dockerfile for Production
# ===================================

# Stage 1: Dependencies
FROM node:18-alpine AS dependencies

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# ===================================
# Stage 2: Build
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Run linting and tests
RUN npm run lint
RUN npm run test

# ===================================
# Stage 3: Production Runtime
FROM node:18-alpine AS runtime

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001

# Set working directory
WORKDIR /app

# Copy dependencies from dependencies stage
COPY --from=dependencies --chown=appuser:nodejs /app/node_modules ./node_modules

# Copy source code and set ownership
COPY --chown=appuser:nodejs . .

# Create necessary directories
RUN mkdir -p logs uploads && \
    chown -R appuser:nodejs logs uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Security: Remove package manager
RUN rm -rf /usr/local/bin/npm /usr/local/bin/npx

# Use non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:$PORT/health || exit 1

# Expose port
EXPOSE $PORT

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]