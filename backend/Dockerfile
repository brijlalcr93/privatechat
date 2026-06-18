FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies and build
COPY package*.json ./
RUN npm ci
COPY . ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/config ./src/config

EXPOSE 5000

CMD ["node", "dist/server.js"]
