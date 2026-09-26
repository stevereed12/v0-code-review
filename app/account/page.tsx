import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getSubscriberForUser, type Subscriber } from "@/lib/newsletter-subscribers"
import { MembershipActions } from "@/components/account/membership-actions"
import { SignOutButton } from "@/components/account/sign-out-button"

export const metadata: Metadata = {
  title: "My account — White 80",
  robots: { index: false, follow: false },
}

const formatDate = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "America/New_York" }).format(new Date(iso))
    : null

function describeStatus(s: Subscriber): { label: string; tone: "good" | "warn" | "muted" } {
  if (s.status === "canceled") return { label: "Ended", tone: "muted" }
  if (s.cancel_at_period_end) return { label: "Cancels at period end", tone: "warn" }
  if (s.status === "trialing") return { label: "Free trial", tone: "good" }
  if (s.status === "active") return { label: "Active", tone: "good" }
  if (s.status === "past_due" || s.status === "unpaid") return { label: "Payment past due", tone: "warn" }
  return { label: s.status.replace(/_/g, " "), tone: "muted" }
}

const toneClass = {
  good: "bg-primary/10 text-primary",
  warn: "bg-accent/15 text-accent-foreground",
  muted: "bg-muted text-muted-foreground",
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  )
}

export default async function AccountPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login?next=/account")

  const subscriber = await getSubscriberForUser(user)

  return (
    <main className="min-h-screen bg-background px-4 py-10 md:py-16">
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-foreground" aria-label="White 80 home">
            <span className="h-3 w-3 rounded-sm bg-primary" aria-hidden="true" />
            <span className="text-lg font-semibold tracking-tight">White 80</span>
          </Link>
          <SignOutButton />
        </header>

        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">My account</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>

        {subscriber ? (
          <MembershipCard subscriber={subscriber} />
        ) : (
          <section className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="text-lg font-semibold text-foreground">No membership on this account</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We couldn&apos;t find a White 80 membership for {user.email}. If you subscribed with a different email,
              sign in with that one.
            </p>
            <Link
              href="/#signup"
              className="self-start rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Start 7-day free trial
            </Link>
          </section>
        )}
      </div>
    </main>
  )
}

function MembershipCard({ subscriber }: { subscriber: Subscriber }) {
  const status = describeStatus(subscriber)
  const price = `$${(subscriber.price_cents / 100).toFixed(0)}/${subscriber.billing_interval}`
  const periodEnd = formatDate(subscriber.current_period_end)
  const trialEnd = formatDate(subscriber.trial_end)
  const ended = subscriber.status === "canceled"

  let billingLabel = "Next billing date"
  let billingValue = periodEnd
  if (ended) {
    billingLabel = "Ended on"
    billingValue = formatDate(subscriber.canceled_at) ?? periodEnd
  } else if (subscriber.cancel_at_period_end) {
    billingLabel = "Access ends"
  } else if (subscriber.status === "trialing") {
    billingLabel = "Trial ends / first charge"
    billingValue = trialEnd ?? periodEnd
  }

  return (
    <section aria-labelledby="membership-heading" className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="membership-heading" className="text-lg font-semibold text-foreground">
          Membership
        </h2>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClass[status.tone]}`}>{status.label}</span>
      </div>

      <dl className="flex flex-col divide-y divide-border">
        <Row label="Plan" value={subscriber.plan} />
        <Row label="Tier" value={subscriber.tier} />
        <Row label="Price" value={price} />
        <Row label="Enrolled" value={formatDate(subscriber.enrolled_at) ?? "—"} />
        <Row label={billingLabel} value={billingValue ?? "—"} />
      </dl>

      {ended ? (
        <Link
          href="/#signup"
          className="self-start rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Rejoin White 80
        </Link>
      ) : (
        <MembershipActions cancelScheduled={subscriber.cancel_at_period_end} accessEnds={periodEnd} />
      )}
    </section>
  )
}
