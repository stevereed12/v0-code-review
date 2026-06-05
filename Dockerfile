# White80 routine — Playwright base image ships Chromium + system deps.
FROM mcr.microsoft.com/playwright:v1.44.0-jammy

RUN npm install -g pnpm@9

WORKDIR /app

# ── Step 1: Copy everything ──────────────────────────────────────────────────
COPY . .

# ── Step 2: Install & build the engine ───────────────────────────────────────
WORKDIR /app/packages/engine
RUN pnpm install --no-frozen-lockfile
RUN pnpm run build

# ── Step 3: Patch routine package.json to use file: ref, then install ────────
WORKDIR /app/apps/routine
RUN sed -i 's|"@white80/engine": "\*"|"@white80/engine": "file:../../packages/engine"|g' package.json
RUN pnpm install --no-frozen-lockfile

# ── Step 4: Build the routine ─────────────────────────────────────────────────
RUN pnpm run build

WORKDIR /app
ENV NODE_ENV=production
ENV OUTPUT_DIR=/tmp
EXPOSE 8080

CMD ["node", "apps/routine/dist/server.js"]
