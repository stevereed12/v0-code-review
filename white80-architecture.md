# White80 Architecture — Agent Pipeline Map

This document maps the existing seven-agent pipeline as it lived in the Next.js web app,
captured during the extraction into the shared `@white80/engine` package. It is the source
of truth for what each agent does, its exact call signature, the JSON it produces, and the
environment variables it needs.

> **Important reality check vs. the build brief.** The build brief's completeness-check field
> names (`vibe.score`, `vibe.hotSectors`, `signals`, `topPlays`, `brief.narrative`, etc.) are
> *aspirational shorthand*. The real, validated schema uses different names (`vibe_score`,
> `hot_sectors`, `top_plays`, etc.) and there is **no `brief.narrative` field** — the brief's
> prose lives in `verdict.summary` and `catalysts[].body`. The engine and routine preserve the
> **real** schema verbatim (six issues of validated output depend on it) and the completeness
> check is written against the real field names. See [Completeness mapping](#completeness-check-mapping).

---

## 1. Where the seven agents live (original locations)

| Agent | Original location | Model | Mechanism |
|-------|-------------------|-------|-----------|
| **Tier 1 Scanner** | `app/api/tier1-scan/route.ts` | — (no LLM) | Pure Polygon technical scan (no LLM). `POST` scans a universe, `GET` scans one ticker. |
| **Signals Engine** | prompt in `lib/prompts.ts` (`buildSignalPrompt`), invoked from `components/white80/dashboard.tsx` → `/api/claude` | `xai/grok-4.3` | Structured JSON. Returns `Signal[]` (one per watchlist ticker). |
| **Curator** | prompt in `lib/prompts.ts` (`buildCuratorPrompt`), invoked from dashboard → `/api/claude` | `perplexity/sonar-pro` | Built-in web search for macro context. Returns `CuratorState`. |
| **Watchlist (News monitor)** | prompt in `lib/prompts.ts` (`buildNewsPrompt`), invoked from dashboard → `/api/claude` | `perplexity/sonar` | Built-in web search (cheapest grounded tier) for per-ticker news. Returns `TickerNews[]`. This is the "Watchlist" agent — it monitors the active watchlist for material news. |
| **Daily Brief** | `app/api/brief/route.ts` (+ `buildBriefPrompt`) | `google/gemini-3.1-pro-preview` | Polygon market data → injected into prompt → model call. Post-processes strike prices against live Polygon prices. Returns `Brief`. |
| **Vibe Engine** | `app/api/vibe/route.ts` (+ `buildVibePrompt`) | `perplexity/sonar-pro` | Polygon market data → injected → built-in web search for social/sentiment. Returns `VibeCheck`. |
| **Scout** | prompt in `lib/prompts.ts` (`buildScoutPrompt`), invoked from dashboard → `/api/claude` | `xai/grok-4.20-reasoning` | Reasoning over patterns, structured JSON. Returns `ScoutResult[]`. |

Supporting (not part of the daily seven, but extracted for completeness): **Catalyst detector**
(`app/api/catalysts/route.ts`), **Quick Thesis** and **Buy & Hold** prompts in `lib/prompts.ts`.

**Model routing.** Every LLM agent now calls the Perplexity Agent API (OpenAI-SDK compatible,
base URL `https://api.perplexity.ai`) through a single unified caller, `askModel(model, system,
user)` in `packages/engine/src/model.ts`. Per-agent model ids live in
`packages/engine/src/models.ts` (`MODELS`). One key, `PERPLEXITY_API_KEY`, bills all calls.
Sonar models (`perplexity/sonar*`) have web search built in; the xai/google models get their
context from the prompt + injected Polygon data. The shared JSON-extraction + retry logic (the
old `extractJSON`/`askClaude` from `app/api/claude/route.ts`) is preserved verbatim as
`extractJSON()`, now additionally stripping the `[n]` citation markers sonar injects.

---

## 2. Exact call signatures & return shapes

### Tier 1 Scanner
```ts
// Original: POST /api/tier1-scan  body: { tickers?, clientPolygonKey?, config? }
// Returns: { data: { timestamp, totalScanned, matches: Tier1Signal[], errors: string[] } }
scanTicker(ticker: string, spyBars: Array<{ c: number }>, config: ScanConfig): Promise<Tier1Signal | null>
```
Engine export: `runTier1Scan(opts: { polygonKey: string; tickers?: string[]; config?: Partial<ScanConfig> }): Promise<ScanResult>`

### Signals Engine
```ts
buildSignalPrompt(tickers, newsContext?, livePrices?, optionsData?): string  // → Signal[]
```
Engine export: `runSignals(opts: { tickers; newsContext?; livePrices?; optionsData? }): Promise<Signal[]>`

### Curator
```ts
buildCuratorPrompt(currentList: string[]): string  // → CuratorState
```
Engine export: `runCurator(opts: { watchlist }): Promise<CuratorState>`

### Watchlist (News)
```ts
buildNewsPrompt(tickers: string[]): string  // → TickerNews[]
```
Engine export: `runWatchlist(opts: { tickers }): Promise<TickerNews[]>`

### Daily Brief
```ts
// Original: POST /api/brief  body: { tickers, apiKey, polygonKey? }  → Brief
buildBriefPrompt(tickers: string[]): string
```
Engine export: `runDailyBrief(opts: { tickers; polygonKey? }): Promise<Brief>`
(reproduces Polygon fetch + market-context injection + strike-price correction verbatim)

### Vibe Engine
```ts
// Original: POST /api/vibe  body: { tickers, apiKey, polygonKey? }  → VibeCheck
buildVibePrompt(tickers: string[]): string
```
Engine export: `runVibe(opts: { tickers; polygonKey? }): Promise<VibeCheck>`

### Scout
```ts
buildScoutPrompt(themes, capTier, horizon, excludeTickers?): string  // → ScoutResult[]
```
Engine export: `runScout(opts: { themes; capTier; horizon; excludeTickers? }): Promise<ScoutResult[]>`

### Pipeline
```ts
runPipeline(options?: PipelineOptions): Promise<BriefOutput>
```
Runs all seven in sequence. `PipelineOptions` carries `polygonKey`, optional
`watchlist`, `scoutThemes`, `scoutCapTier`, `scoutHorizon`. See `packages/engine/src/types.ts`.

---

## 3. Complete JSON schema the pipeline produces (`BriefOutput`)

The pipeline assembles every agent's output into a single object:

```ts
interface BriefOutput {
  generated_at: string          // ISO timestamp
  session_date: string          // human weekday string (from brief)
  curator: CuratorState
  watchlist: string[]           // curator.active_watchlist (the resolved watchlist used downstream)
  tier1: Tier1Signal[]          // Tier-1 scanner matches
  news: TickerNews[]            // Watchlist agent output
  signals: Signal[]             // Signals engine, one per watchlist ticker
  scout: ScoutResult[]          // Scout discoveries (may be empty)
  brief: Brief                  // Daily Brief (macro_pulse, catalysts, sector_rotation, verdict, top_plays)
  vibe: VibeCheck               // Vibe engine
}
```

Each member type (`Signal`, `TickerNews`, `Brief`, `VibeCheck`, `CuratorState`, `ScoutResult`,
`Tier1Signal`) is the verbatim type from `lib/types.ts` / `lib/tier1-types.ts`, re-exported from
`@white80/engine`.

`Brief` (the daily brief) contains: `session_date`, `session_label`, `macro_pulse` (spy/qqq/vix/
dxy/ten_year/wti/gold), `catalysts[]` (`{title, body}`), `sector_rotation` (`leading[]`/`lagging[]`),
`verdict` (`{tone, summary}`), `top_plays[]` (`{ticker, action, play, conviction, catalyst, thesis}`).

`VibeCheck` contains: `vibe_score`, `mood`, `temperature`, `headline`, `read`, `drivers[]`,
`hot_sectors[]`, `cold_sectors[]`, `buzzing_tickers[]`, `social_pulse`, `contrarian_note`, `play_it`.

---

## 4. HTML template

**There was no HTML/PDF template in the original repo** — exports were CSV-only
(`lib/export.ts`). The brief assumes a "locked HTML template already in the repo"; it does not
exist. The routine therefore ships a **new** template at
`apps/routine/templates/brief-template.html` (A4 portrait, four logical pages: cover/vibe,
macro+sectors, top plays + signals, scout + watchlist). JSON is injected by replacing a single
`__BRIEF_DATA__` placeholder with the `BriefOutput` JSON, rendered client-side by inline script
into the page. This is documented as a new addition, not a modification of existing validated output.

---

## 5. Environment variables referenced by agents

Names only (discovered via `process.env` grep across the repo):

- `PERPLEXITY_API_KEY` — single key for all model calls via the Perplexity Agent API (replaced `ANTHROPIC_API_KEY`; resolved from the env var inside `askModel`)
- `POLYGON_API_KEY`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `NODE_ENV`, `VERCEL_URL`

Only `PERPLEXITY_API_KEY`, `POLYGON_API_KEY`, and `RESEND_API_KEY` are relevant to the routine.
Supabase/Stripe/Vercel vars belong to the web app and are not used by the engine or routine.

---

## 6. Current package.json structure

Originally **flat** (single `package.json`, Next.js 16, React 19, `pnpm-lock.yaml`). The
extraction introduces **npm workspaces**:

```
/ (root, private, workspaces: ["packages/*", "apps/*"])
  packages/engine    → @white80/engine
  apps/routine       → @white80/routine
  app/ components/ lib/ ...  → the Next.js web app (unchanged location, now imports @white80/engine)
```

npm workspaces (not pnpm) is used for the monorepo because the deploy Dockerfile in the brief
uses `npm ci`, and pnpm was unavailable in the build environment. The web app's own dev tooling
continues to work with either.

---

## Completeness-check mapping

Brief's wording → actual field checked by `apps/routine/src/completeness.ts`:

| Brief says | Actual field |
|------------|--------------|
| `tier1` has ≥ 1 entry | `output.tier1.length >= 1` |
| `signals.length === tier1.length` | `output.signals.length === output.tier1.length` |
| `vibe` has score, mood, drivers, hotSectors, coldSectors, buzzingTickers, socialPulse, contrarianNote, howToPlay | `vibe.vibe_score`, `vibe.mood`, `vibe.drivers`, `vibe.hot_sectors`, `vibe.cold_sectors`, `vibe.buzzing_tickers`, `vibe.social_pulse`, `vibe.contrarian_note`, `vibe.play_it` |
| `topPlays` count > 0 | `output.brief.top_plays.length > 0` |
| `scout` non-empty OR `empty: true` | `output.scout.length > 0` (empty scout is allowed and logged) |
| `brief.catalysts` non-empty array | `output.brief.catalysts.length >= 1` |
| `brief.narrative` non-empty string | `output.brief.verdict.summary` non-empty (no `narrative` field exists) |
