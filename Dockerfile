# ─── Этап 1: Shared ───────────────────────────────────────────────────────────
FROM node:20-alpine AS shared-builder
WORKDIR /app/shared
COPY shared/package*.json ./
RUN npm ci
COPY shared/ ./
RUN npm run build

# ─── Этап 2: Frontend ─────────────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
COPY shared/ ../shared/
RUN npm run build

# ─── Этап 3: Backend ──────────────────────────────────────────────────────────
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
COPY shared/ ../shared/
COPY --from=shared-builder /app/shared/dist ../shared/dist
RUN npm run build
RUN npx prisma generate
# Runtime: shared пакет + импортторду package атына алып келүү
RUN mkdir -p node_modules/@magazin/shared \
  && cp ../shared/package.json node_modules/@magazin/shared/ \
  && cp -r ../shared/dist node_modules/@magazin/shared/dist \
  && find dist -type f -name '*.js' -print0 \
    | xargs -0 sed -i -E 's|require\("(\.\./)+shared/src(/index)?"\)|require("@magazin/shared")|g' \
  && find dist -type f -name '*.js' -print0 \
    | xargs -0 sed -i -E 's|require\("(\.\./)+shared/dist(/index)?"\)|require("@magazin/shared")|g'

# ─── Этап 4: Production ─────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

RUN apk add --no-cache postgresql-client tini wget

COPY --from=backend-builder /app/backend/package*.json ./backend/
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/prisma ./backend/prisma
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

RUN mkdir -p backend/uploads backend/backups

ENV NODE_ENV=production
ENV PORT=3001
ENV SERVE_FRONTEND=true
ENV FRONTEND_DIST=/app/frontend/dist
ENV TRUST_PROXY=true

WORKDIR /app/backend

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/v1/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/backend/src/server.js"]
