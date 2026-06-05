FROM mcr.microsoft.com/playwright:v1.44.0-jammy

WORKDIR /app

# ── Step 1: Build the engine standalone with npm ─────────────────────────────
COPY packages/engine/package.json ./packages/engine/package.json
COPY packages/engine/src ./packages/engine/src
COPY packages/engine/tsconfig.json ./packages/engine/tsconfig.json

WORKDIR /app/packages/engine
RUN npm install --no-package-lock
RUN npm run build

# ── Step 2: Install & build the routine with npm ─────────────────────────────
WORKDIR /app/apps/routine
COPY apps/routine/package.json ./package.json

# Rewrite @white80/engine to a file: reference before npm install
RUN sed -i 's|"@white80/engine": "\*"|"@white80/engine": "file:../../packages/engine"|' package.json

COPY apps/routine/src ./src
COPY apps/routine/tsconfig.json ./tsconfig.json

RUN npm install --no-package-lock
RUN npm run build

# ── Step 3: Runtime ──────────────────────────────────────────────────────────
WORKDIR /app
COPY watchlist.json ./watchlist.json

ENV NODE_ENV=production
ENV OUTPUT_DIR=/tmp
EXPOSE 8080

CMD ["node", "apps/routine/dist/server.js"]
