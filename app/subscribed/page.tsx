import type { Metadata } from "next"
import Link from "next/link"
import { DELIVERY } from "@/lib/newsletter"
import { getPaidNewsletterCheckout, upsertSubscriberFromStripe, type Subscriber } from "@/lib/newsletter-subscribers"
import { CreateAccountForm } from "@/components/account/create-account-form"

export const metadata: Metadata = {
  title: "You're in — White 80",
  robots: { index: false, follow: false },
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-3xl border border-border bg-card p-8 shadow-sm md:p-10">
        <Link href="/" className="flex items-center gap-2 text-foreground" aria-label="White 80 home">
          <span className="h-3 w-3 rounded-sm bg-primary" aria-hidden="true" />
          <span className="text-lg font-semibold tracking-tight">White 80</span>
        </Link>
        {children}
      </div>
    </main>
  )
}

export default async function SubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await searchParams
  const checkout = await getPaidNewsletterCheckout(session_id)

  if (!checkout || !session_id) {
    return (
      <Shell>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground text-balance">
          We couldn&apos;t find that checkout.
        </h1>
        <p className="leading-relaxed text-muted-foreground text-pretty">
          If you just paid, give it a moment and refresh. Already have an account? Sign in to see your membership.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/auth/login?next=/account"
            className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Sign in
          </Link>
          <Link href="/" className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted">
            Back home
          </Link>
        </div>
      </Shell>
    )
  }

  // Record the subscriber immediately so the flow doesn't depend on webhook timing.
  let subscriber: Subscriber | null = null
  try {
    subscriber = await upsertSubscriberFromStripe(checkout.subscription, checkout.email)
  } catch (error) {
    console.error("Failed to record subscriber:", error)
  }

  if (subscriber?.user_id) {
    return (
      <Shell>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground text-balance">
          You&apos;re in. Your account is ready.
        </h1>
        <p className="leading-relaxed text-muted-foreground text-pretty">
          Briefs go to <span className="font-medium text-foreground">{checkout.email}</span>. Sign in to manage your
          membership.
        </p>
        <Link
          href="/auth/login?next=/account"
          className="rounded-full bg-primary px-5 py-3 text-center text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Go to my account
        </Link>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-primary">Payment confirmed</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground text-balance">
          One last step: set your password.
        </h1>
        <p className="leading-relaxed text-muted-foreground text-pretty">
          Your 7-day trial has started. The next premarket brief lands by {DELIVERY.premarket} on the next trading
          day. Create a password so you can manage your membership anytime.
        </p>
      </div>
      <CreateAccountForm sessionId={session_id} email={checkout.email} />
    </Shell>
  )
}
