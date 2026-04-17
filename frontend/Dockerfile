# ─── Build stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# NEXT_PUBLIC_* vars are baked into the JS bundle at build time.
# Pass KONG_URL (or individual overrides) as build args so the browser
# receives the correct public-facing URL without a rebuild per environment.
ARG NEXT_PUBLIC_DOCTOR_API=http://localhost:8000/api/v1
ARG NEXT_PUBLIC_PATIENT_API=http://localhost:8000/api/v1
ARG NEXT_PUBLIC_APPOINTMENT_API=http://localhost:8000/api/v1
ARG NEXT_PUBLIC_TELEMEDICINE_API=http://localhost:8000/api/v1

ENV NEXT_PUBLIC_DOCTOR_API=$NEXT_PUBLIC_DOCTOR_API
ENV NEXT_PUBLIC_PATIENT_API=$NEXT_PUBLIC_PATIENT_API
ENV NEXT_PUBLIC_APPOINTMENT_API=$NEXT_PUBLIC_APPOINTMENT_API
ENV NEXT_PUBLIC_TELEMEDICINE_API=$NEXT_PUBLIC_TELEMEDICINE_API

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─── Production stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -S appgroup && adduser -S nextjs -G appgroup

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:appgroup /app/.next/standalone ./
COPY --from=builder --chown=nextjs:appgroup /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000 || exit 1

CMD ["node", "server.js"]
