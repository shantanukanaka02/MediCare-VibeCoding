# Step 1: Base image
FROM node:25-slim AS base
WORKDIR /app
RUN apt-get update -y \
  && apt-get install -y openssl \
  && rm -rf /var/lib/apt/lists/*

# Step 2: Install dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci

# Step 3: Build TypeScript and Prisma client
FROM deps AS build
COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
# COPY .env ./env
RUN npx prisma generate
RUN npm run build
# RUN npm run prisma:generate && npm run build

# Step 4: Runtime image (for production)
FROM base AS runtime
ENV NODE_ENV=production

# ✅ COPY FROM BUILD (not deps)
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package*.json ./
# RUN npx prisma db seed
EXPOSE 4000
CMD ["node", "dist/src/app/server.js"]