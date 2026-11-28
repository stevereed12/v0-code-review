# Rocket Board

- `/rocket-board` is the public entry point, with five ranked rows, expanders,
  methodology and the existing White80 signup link. Board copy and factor points
  come from the same saved edition as the newsletter. The public projection omits
  quote values, share counts, evidence identifiers, source URLs and ranks beyond five.
- `/dashboard/rocket-board` uses the same membership check as The Daily.
  The full saved shortlist adds quote timestamps, source links, direction filters
  and the five most recent compatible saved editions. Missing historical ranks
  display as unranked, never as zero. Archived editions use `?date=YYYY-MM-DD`.
- With no live distribution configured, both modes display clearly labeled
  fictional examples. No OpenAI key is required to build or preview the site.
  An edition without narration still shows observed score inputs.
- When the daily publisher is verified, set `WHITE80_ROCKET_BOARD_LIVE=1`
  only for environments whose data use is covered by the project's Massive
  agreement, including derived public scores and member quote displays.
  The default is sample mode. See Massive's
  [market data redistribution guidance](https://massive.com/knowledge-base/article/how-can-i-redistribute-massives-market-data).
- Tape Activity v0 is the current morning ranking. It uses the magnitude of
  relative movement versus SPY and the observed premarket share count, weighted
  equally. It is not a calibrated Rocket Score, return forecast, or an options signal.
  Additional inputs for the full methodology belong in the shared worker, not in
  a second data pull or model call from the site.
- When moving from preview to launch, link the public route from the marketing
  homepage and sitemap in the SEO rollout, and verify member authorization,
  provider coverage and archive dates against at least two real editions.
