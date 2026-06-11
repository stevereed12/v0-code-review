# Handoff: Trading-engine project is sharing a GitHub repo with an unrelated project

## The problem

The trading project (automated morning routine, `@white80/engine` package, trading
agents, `apps/routine`, `railway.toml`, signal-generation logic) is committing to the
GitHub repo **`stevereed12/v0-code-review`**. That same repo is also the source of a
completely separate web project (a marketing/site rebrand). Both projects are pointed at
the same repo and the same `main` branch.

## Why it's breaking things

Because both projects share one `main`, every commit from the trading project lands on the
branch the *other* project deploys from. When the web project syncs, it pulls in the
trading code (`packages/engine`, etc.), which breaks its build — the web app's API routes
try to import `@white80/engine`, which isn't compiled (`dist/` doesn't exist), so
`next build` fails with module-not-found errors. This has required manual cleanup multiple
times and will keep recurring as long as the repos are shared.

**Confirmed still active:** A recent commit `08a1745c` ("enforce minimum 14-day DTE on all
signals") landed on `main` — that's a legitimate trading-logic fix and should be
**preserved**, but it illustrates that the trading project is actively committing to the
shared repo right now.

## What needs to happen

1. Move the trading-engine project into its **own dedicated GitHub repo**
   (e.g. `v0-trading-engine`), including all `packages/engine`, `apps/routine`, the
   morning-routine automation, Docker/Railway config, and recent signal-logic commits like
   `08a1745c`.
2. Disconnect the trading project from `v0-code-review` so it no longer pushes there.
3. Confirm the trading project's own deployment target (Railway/Vercel/etc.) points at the
   new repo.

## Important — please preserve, don't discard

The trading code is real, wanted work (just landed in the wrong repo). Migrate it intact to
the new repo rather than deleting it. The cleanup on the *web* side will remove these files
from `v0-code-review`, so make sure the trading project has its own copy first.
