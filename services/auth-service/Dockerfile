# ─── Build stage: generate Prisma client + compile TS ──
FROM node:20-alpine AS builder
WORKDIR /app
# Prisma's query engine needs openssl on Alpine.
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm install
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ─── Runtime stage: prod deps + compiled output only ───
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Prisma's query engine needs openssl on Alpine.
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm install --omit=dev
# Regenerate the Prisma client against the production dependency tree.
COPY prisma ./prisma
RUN npx prisma generate
COPY --from=builder /app/dist ./dist
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 4001
ENTRYPOINT ["./docker-entrypoint.sh"]
