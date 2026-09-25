import type { Metadata } from "next"
import Link from "next/link"
import Stripe from "stripe"
import { DELIVERY } from "@/lib/newsletter"

export const metadata: Metadata = {
  title: "You're in — White 80",
  robots: { index: false, follow: false },
}

async function getCheckoutEmail(sessionId: string | undefined): Promise<string | null> {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!sessionId || !sessionId.startsWith("cs_") || !secretKey) return null
  try {
    const session = await new Stripe(secretKey).checkout.sessions.retrieve(sessionId)
    return session.customer_details?.email ?? session.customer_email ?? null
  } catch {
    return null
  }
}

export default async function SubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await searchParams
  const email = await getCheckoutEmail(session_id)

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex max-w-lg flex-col gap-6 border border-border bg-card p-8 md:p-10">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 bg-primary" aria-hidden="true" />
          <span className="font-display text-2xl tracking-wide text-foreground">WHITE 80</span>
        </div>
        <h1 className="font-display text-5xl text-foreground text-balance">
          YOU&apos;RE <span className="text-primary">IN.</span>
        </h1>
        <p className="leading-relaxed text-muted-foreground text-pretty">
          Your 7-day free trial has started
          {email ? (
            <>
              . Briefs will go to <span className="text-foreground">{email}</span>
            </>
          ) : null}
          . The next premarket brief lands by {DELIVERY.premarket} on the next trading day.
        </p>
        <Link href="/" className="font-mono text-xs tracking-wider text-primary hover:underline">
          BACK TO WHITE80.IO
        </Link>
      </div>
    </main>
  )
}
