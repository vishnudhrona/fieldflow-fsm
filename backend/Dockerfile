# Stage 1: Build compile stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

# Stage 2: Clean production runtime container
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY config ./config
COPY migrations ./migrations
COPY seeders ./seeders
EXPOSE 8080
CMD ["node", "dist/index.js"]
