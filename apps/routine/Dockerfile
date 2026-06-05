# White80 routine — Playwright base image ships Chromium + system deps.
FROM mcr.microsoft.com/playwright:v1.44.0-jammy

# Install pnpm
RUN npm install -g pnpm@9

WORKDIR /app

# Copy workspace config + ALL package.json files first (for layer caching)
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY packages/engine/package.json ./packages/engine/package.json
COPY apps/routine/package.json ./apps/routine/package.json

# Install all workspace deps — resolves @white80/engine from local workspace
RUN pnpm install --no-frozen-lockfile

# Copy all source AFTER install so code changes don't bust the dep cache
COPY packages/engine ./packages/engine
COPY apps/routine ./apps/routine
COPY watchlist.json ./watchlist.json

# Build engine first (routine imports from it), then routine
RUN pnpm --filter @white80/engine run build \
  && pnpm --filter @white80/routine run build

ENV NODE_ENV=production
ENV OUTPUT_DIR=/tmp
EXPOSE 8080

CMD ["node", "apps/routine/dist/server.js"]
