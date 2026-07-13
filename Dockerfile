# ============================================================================
# Stage 1: Build the client & server bundle
# ============================================================================
FROM node:20-alpine AS builder

# Install build dependencies for better-sqlite3 C++ bindings compilation
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy full application source code
COPY . .

# Build Vite client files and bundle Express server.ts with esbuild
RUN npm run build

# ============================================================================
# Stage 2: Install production-only dependencies
# ============================================================================
FROM node:20-alpine AS prod-deps

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./

# Install only production dependencies (excluding devDependencies)
RUN npm ci --omit=dev

# ============================================================================
# Stage 3: Runner stage
# ============================================================================
FROM node:20-alpine AS runner

# Set Node environment to production
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# Create folder for SQLite local database storage to allow mounting later if DB_TYPE=sqlite
RUN mkdir -p /app/server/data

# Copy built application and required public assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy production node_modules (pre-compiled binary bindings match perfectly because of identical Alpine Node bases)
COPY --from=prod-deps /app/node_modules ./node_modules

# Ensure application port is accessible
EXPOSE 3000

# Start server
CMD ["node", "dist/server.cjs"]
