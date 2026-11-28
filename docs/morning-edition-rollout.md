# Morning edition website handoff

The newsletter worker writes a single validated daily payload to
`POST /api/internal/morning-edition`. The site stores it privately in Supabase
and reads it at `/dashboard/morning-edition` for signed-in active or trialing
White80 members. Links from email can include `?date=YYYY-MM-DD` to open that
specific edition. The page makes no model or market-data calls.

## Configure before enabling the worker publisher

1. Apply `supabase/migrations/202611280001_white80_morning_editions.sql` to the
   website Supabase database. Keep the table inaccessible to anon and
   authenticated roles. The server uses the existing service-role integration.
2. Set the same dedicated high-entropy `WHITE80_MORNING_PUBLISH_SECRET` on the
   Railway publisher and Vercel project. Never put the secret in browser code.
3. Confirm posting the identical edition reports `already_published`, and that
   a different edition with that session ID is rejected. Confirm paid member
   access and logged-out/non-member denial on a private preview.
4. Run the worker's shadow mode with a White80 OpenAI key before turning on
   subscription delivery. Confirm the existing paid audience is covered and
   the same edition ID reaches the website and a controlled email.

All draft endpoints are inert until configured. The site's existing SEO
changes, interactive terminal, newsletter checkout and subscriber settings are
unchanged. A public Rocket Board projection, ticker page routes, and live
Asymmetry scenarios remain separate from the initial member view.
