# ─── Build stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ─── Production stage ─────────────────────────────────────────────────────────
FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=builder /usr/src/app/dist ./dist

# Run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3005

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3005/health || exit 1

CMD ["node", "dist/main"]
