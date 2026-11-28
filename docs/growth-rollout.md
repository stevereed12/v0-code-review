# White 80 growth rollout

## Before promoting the Vercel preview

1. Prove a new trial receives the next brief. Verify that the brief worker can read trialing and active subscribers from Stripe and that an owner-controlled trial address gets both the welcome message and the next scheduled brief.
2. Keep the free list separate from paid members. Create a dedicated White 80 Research segment in Resend. Set `RESEND_RESEARCH_SEGMENT_ID` and `RESEND_RESEARCH_API_KEY` in the target Vercel environment, then redeploy. The key must have Contacts and Segments access. Use an isolated segment in preview. Omit either variable to hide the form. Verify opt-in, duplicate submission, global unsubscribe preservation, provider errors, and the configured sender, footer and unsubscribe link before sending an approved Broadcast. The form enrolls contacts but does not send a campaign or a welcome email.
3. Verify the Vercel preview using Stripe test mode and an owner-controlled inbox. Check that the original trial still has a 7-day trial, requires a card and returns to the account-creation screen. Confirm the event names in Vercel Analytics if the plan supports custom events. Verify metadata and sitemap on the production domain after promotion. Submit the production sitemap in the existing Google Search Console property and inspect the homepage and one research URL.

## One brief, several distribution channels

1. Choose a public-ready takeaway from an existing brief. Record its publication date, source, what changed and what would invalidate the thesis. Keep member-only details out. Verify any rights needed to republish data, charts or audio.
2. Post an excerpt to the research hub with a durable URL, a descriptive title, an archived label if relevant, and a single trial CTA. Add it to the sitemap and to the approved campaign paths in `lib/growth.ts`. Use the existing research pages as examples.
3. Draft The Tape & The Thesis notes from the same takeaway. Include a summary, evidence and risk, then link to the public page. Add a listening link when the corresponding public episode URL is confirmed. Do not substitute local files or guess a feed URL.
4. Run `node scripts/distribution-links.mjs /research/sample-premarket-brief` with Node 22.18 or later. Use the channel-specific URL in the LinkedIn and X drafts, YouTube description, podcast notes or opted-in email draft. Approve the content separately before posting or sending. The command only prints URLs.

## Measure weekly

Track public page visits, **Research Email Signup**, **Trial CTA Clicked**, **Trial Checkout Created** and **Trial Checkout Completed**. Use Resend segment membership for the unique free email count. Checkout completion is a browser-side signal shown only after the Stripe session is verified. It is not a billing event and can be missed when a visitor does not return. Each browser event carries a placement and a channel. The Stripe session and subscription store the supported campaign fields directly, so Stripe remains the source of truth for trial starts and the first successfully paid, nonzero invoice per subscription. Do not count a free trial or a renewal as a new paid conversion.

## Local validation

Run `node --test scripts/growth.test.mjs` and the usual production build. Start the local production server and run `node scripts/growth-smoke.mjs http://localhost:3000`. Append `--expect-signup` when the preview has a research list configured. Confirm on a Vercel preview that the homepage form passes campaign metadata into sandbox Stripe and that no email address or Stripe session ID appears in analytics events.
