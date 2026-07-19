# Stage 1: Build & Install Dependencies
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy application source code
COPY . .

# Stage 2: Production Release
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source from builder
COPY --from=builder /app/src ./src
COPY --from=builder /app/migrations ./migrations

# Use non-root node user for container runtime security
USER node

EXPOSE 4000

CMD ["node", "src/server.js"]
