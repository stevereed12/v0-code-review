# White80 routine — Playwright base image ships Chromium + system deps.
FROM mcr.microsoft.com/playwright:v1.44.0-jammy

RUN npm install -g pnpm@9

WORKDIR /app

# ── Step 1: Install & build the engine as a standalone package ──────────────
COPY packages/engine/package.json ./packages/engine/
WORKDIR /app/packages/engine
RUN pnpm install --no-frozen-lockfile
COPY packages/engine/ ./
RUN pnpm run build

# ── Step 2: Install the routine, pointing @white80/engine at the local build ─
WORKDIR /app/apps/routine
COPY apps/routine/package.json ./

# Replace the workspace reference with a direct file path so pnpm
# doesn't try to fetch @white80/engine from the npm registry.
RUN node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  pkg.dependencies['@white80/engine'] = 'file:../../packages/engine';
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

RUN pnpm install --no-frozen-lockfile

COPY apps/routine/ ./

# ── Step 3: Build the routine ───────────────────────────────────────────────
RUN pnpm run build

# ── Step 4: Copy runtime assets ─────────────────────────────────────────────
WORKDIR /app
COPY watchlist.json ./

ENV NODE_ENV=production
ENV OUTPUT_DIR=/tmp
EXPOSE 8080

CMD ["node", "apps/routine/dist/server.js"]
