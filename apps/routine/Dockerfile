# White80 routine — Playwright base image ships Chromium + system deps.
FROM mcr.microsoft.com/playwright:v1.44.0-jammy

# Install pnpm
RUN npm install -g pnpm@9

WORKDIR /app

# Copy workspace config first for cached layer
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/engine/package.json ./packages/engine/package.json
COPY apps/routine/package.json ./apps/routine/package.json

# Install all workspace deps — no-frozen-lockfile in case lockfile drifts
RUN pnpm install --no-frozen-lockfile

# Copy the rest of the source
COPY . .

# Build engine first (routine depends on its compiled output), then routine
RUN pnpm --filter @white80/engine run build \
  && pnpm --filter @white80/routine run build

ENV NODE_ENV=production
ENV OUTPUT_DIR=/tmp
EXPOSE 8080

CMD ["node", "apps/routine/dist/server.js"]
