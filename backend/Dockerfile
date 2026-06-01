FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies first (cache layer)
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source
COPY src/ ./src/
COPY .env.example ./.env.example

# Create log directory
RUN mkdir -p logs

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S visionhire -u 1001
RUN chown -R visionhire:nodejs /app
USER visionhire

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "src/server.js"]
