# Imagen Docker opcional para el API (Railway, Fly.io, VPS, etc.).
# Build desde la raíz del monorepo:
#   docker build -f services/api/Dockerfile -t drewrest-demo-api .
# Run:
#   docker run -p 3000:3000 -e DATABASE_URL=... -e JWT_SECRET=... -e LICENSE_SKIP=true drewrest-demo-api

FROM node:22-bookworm-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY packages/shared-domain/package*.json packages/shared-domain/
COPY services/api/package*.json services/api/

WORKDIR /app/packages/shared-domain
RUN npm ci
COPY packages/shared-domain/ ./
RUN npm run build

WORKDIR /app/services/api
RUN npm ci
COPY services/api/ ./
RUN npx prisma generate && npm run build

FROM node:22-bookworm-slim AS runner

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app/services/api

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV PRINTER_ENABLED=false
ENV LICENSE_SKIP=true

COPY --from=builder /app/packages/shared-domain /app/packages/shared-domain
COPY --from=builder /app/services/api /app/services/api

WORKDIR /app/services/api

EXPOSE 3000

CMD ["node", "scripts/start-cloud-demo.js"]
