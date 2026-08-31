# ---------- Build stage: install production dependencies ----------
FROM node:20-alpine AS build

WORKDIR /app

# Install production dependencies only (skips devDeps). npm install honors NODE_ENV.
ENV NODE_ENV=production

# bcrypt is a native module. alpine uses musl, so install build tools to compile it
# from source if no musl prebuilt binary is available.
RUN apk add --no-cache python3 make g++

# Copy manifest first for better layer caching
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---------- Runtime stage: slim, non-root, light ----------
FROM node:20-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Create non-root user for security
RUN addgroup -S app && adduser -S app -G app

# Copy production node_modules from the build stage (discard build tools)
COPY --from=build --chown=app:app /app/node_modules ./node_modules

# Copy application source (excludes .env, node_modules via .dockerignore)
COPY --chown=app:app . .

# Run as non-root user
USER app

EXPOSE 3000

CMD ["node", "server.js"]
