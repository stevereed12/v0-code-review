# White80 routine — Playwright base image ships Chromium + system deps.
FROM mcr.microsoft.com/playwright:v1.44.0-jammy

WORKDIR /app

# Copy workspace manifests first for cached installs.
COPY package.json package-lock.json* ./
COPY packages/engine/package.json ./packages/engine/package.json
COPY apps/routine/package.json ./apps/routine/package.json

# Install all workspace deps (engine + routine).
RUN npm ci

# Copy the rest of the source.
COPY . .

# Build the engine first (routine depends on its compiled output), then the routine.
RUN npm run build --workspace=packages/engine \
  && npm run build --workspace=apps/routine

ENV NODE_ENV=production
ENV OUTPUT_DIR=/tmp
EXPOSE 8080

CMD ["node", "apps/routine/dist/server.js"]
