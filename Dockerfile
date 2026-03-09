# ============================================================
# Stage 1: Install dependencies
# ============================================================
FROM node:20-alpine AS deps

# Install compatibility libraries needed by some npm packages
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files and install production + dev deps
# (dev deps needed for the build step)
COPY package.json package-lock.json ./
RUN npm ci


# ============================================================
# Stage 2: Build the Next.js app
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Next.js collects anonymous telemetry — disable it
ENV NEXT_TELEMETRY_DISABLED=1

# Build the production bundle
RUN npm run build


# ============================================================
# Stage 3: Production runner
# ============================================================
FROM node:20-alpine AS runner

WORKDIR /app

# ── Install Ghostscript (the key system dependency) ──────────
RUN apk add --no-cache ghostscript

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy only what's needed to run the app
COPY --from=builder /app/public         ./public
COPY --from=builder /app/package.json   ./package.json

# Copy the standalone Next.js output and static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static

# Switch to non-root user
USER nextjs

# Koyeb expects the app to listen on PORT (default 3000)
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the Next.js production server
CMD ["node", "server.js"]
