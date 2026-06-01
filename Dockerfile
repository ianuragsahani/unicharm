# Stage 1: install all workspace deps
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY database/package.json database/
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci

# Stage 2: generate Prisma client + compile TypeScript
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.base.json ./
COPY database/ database/
COPY backend/ backend/
RUN npm run build -w database && npm run build -w backend

# Stage 3: lean production image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# node_modules from builder has the generated Prisma client
COPY --from=builder /app/node_modules ./node_modules

# database workspace (symlink target for @unicharm/database)
COPY --from=builder /app/database/dist ./database/dist
COPY --from=builder /app/database/prisma ./database/prisma
COPY --from=builder /app/database/package.json ./database/package.json

# backend compiled output
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package.json ./backend/package.json

COPY --from=builder /app/package.json ./

EXPOSE 4000

# Push schema to Neon then start API server
CMD ["sh", "-c", "node_modules/.bin/prisma db push --schema=database/prisma/schema.prisma && node backend/dist/index.js"]
