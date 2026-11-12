import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import { NEWSLETTER } from "@/lib/newsletter"

export type Subscriber = {
  id: string
  email: string
  user_id: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan: string
  tier: string
  price_cents: number
  billing_interval: string
  status: string
  trial_end: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  canceled_at: string | null
  enrolled_at: string
}

const SUBSCRIBER_COLUMNS =
  "id, email, user_id, stripe_customer_id, stripe_subscription_id, plan, tier, price_cents, billing_interval, status, trial_end, current_period_end, cancel_at_period_end, canceled_at, enrolled_at"

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) throw new Error("Stripe is not configured")
  return new Stripe(secretKey)
}

const toIso = (seconds?: number | null) => (seconds ? new Date(seconds * 1000).toISOString() : null)

// Newer Stripe API versions report the billing period on the subscription item, older ones on the subscription.
function getPeriodEnd(subscription: Stripe.Subscription): number | null {
  const item = subscription.items?.data?.[0] as { current_period_end?: number } | undefined
  const legacy = (subscription as unknown as { current_period_end?: number }).current_period_end
  return item?.current_period_end ?? legacy ?? null
}

const customerIdOf = (subscription: Stripe.Subscription) =>
  typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id

export function isNewsletterSubscription(subscription: Stripe.Subscription) {
  return subscription.metadata?.product_id === NEWSLETTER.id
}

export async function upsertSubscriberFromStripe(
  subscription: Stripe.Subscription,
  email: string,
): Promise<Subscriber> {
  const price = subscription.items?.data?.[0]?.price
  const { data, error } = await createAdminClient()
    .from("newsletter_subscribers")
    .upsert(
      {
        email: email.trim().toLowerCase(),
        stripe_customer_id: customerIdOf(subscription),
        stripe_subscription_id: subscription.id,
        plan: NEWSLETTER.name,
        price_cents: price?.unit_amount ?? NEWSLETTER.priceInCents,
        billing_interval: price?.recurring?.interval ?? NEWSLETTER.interval,
        status: subscription.status,
        trial_end: toIso(subscription.trial_end),
        current_period_end: toIso(getPeriodEnd(subscription)),
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: toIso(subscription.canceled_at),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" },
    )
    .select(SUBSCRIBER_COLUMNS)
    .single()

  if (error) throw error
  return data as Subscriber
}

// Used by webhooks, where only the subscription is known: resolve the email from our row, then Stripe.
export async function syncNewsletterSubscription(stripe: Stripe, subscription: Stripe.Subscription) {
  const { data: existing } = await createAdminClient()
    .from("newsletter_subscribers")
    .select("email")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle()

  let email = existing?.email as string | undefined
  if (!email) {
    const customer = await stripe.customers.retrieve(customerIdOf(subscription))
    if (!customer.deleted) email = customer.email ?? undefined
  }
  if (!email) return null
  return upsertSubscriberFromStripe(subscription, email)
}

export type PaidCheckout = { email: string; subscription: Stripe.Subscription }

// A completed Checkout Session is proof of payment; its id is only handed to the payer via the success URL.
export async function getPaidNewsletterCheckout(sessionId: string | undefined | null): Promise<PaidCheckout | null> {
  if (!sessionId || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return null
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId, { expand: ["subscription"] })
    if (session.status !== "complete" || session.metadata?.product_id !== NEWSLETTER.id) return null
    const email = session.customer_details?.email ?? session.customer_email
    const subscription = session.subscription
    if (!email || !subscription || typeof subscription === "string") return null
    return { email: email.toLowerCase(), subscription }
  } catch (error) {
    console.error("Checkout verification failed:", error)
    return null
  }
}

// Pro members live in `profiles` (Stripe customer + subscription id), not `newsletter_subscribers`.
// Build a Subscriber view from the live Stripe subscription so /account can show, cancel and manage it.
async function getProMembershipForUser(user: { id: string; email?: string | null }): Promise<Subscriber | null> {
  const { data: profile } = await createAdminClient()
    .from("profiles")
    .select("stripe_customer_id, subscription_id, subscription_status, created_at")
    .eq("id", user.id)
    .maybeSingle()
  if (!profile?.stripe_customer_id) return null

  let subscription: Stripe.Subscription | null = null
  try {
    const stripe = getStripe()
    if (profile.subscription_id) {
      subscription = await stripe.subscriptions.retrieve(profile.subscription_id)
    } else {
      const list = await stripe.subscriptions.list({ customer: profile.stripe_customer_id, status: "all", limit: 1 })
      subscription = list.data[0] ?? null
    }
  } catch (error) {
    console.error("Pro membership lookup failed:", error)
  }
  if (!subscription) return null

  const item = subscription.items?.data?.[0]
  const price = item?.price
  const productName =
    (typeof price?.product === "object" && price.product && !price.product.deleted && price.product.name) ||
    "White 80 Pro"

  return {
    id: subscription.id,
    email: (user.email ?? "").toLowerCase(),
    user_id: user.id,
    stripe_customer_id: customerIdOf(subscription),
    stripe_subscription_id: subscription.id,
    plan: productName,
    tier: "Pro",
    price_cents: price?.unit_amount ?? 4900,
    billing_interval: price?.recurring?.interval ?? "month",
    status: subscription.status,
    trial_end: toIso(subscription.trial_end),
    current_period_end: toIso(getPeriodEnd(subscription)),
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: toIso(subscription.canceled_at),
    enrolled_at: toIso(subscription.created) ?? profile.created_at ?? new Date().toISOString(),
  }
}

const isLive = (s: Subscriber | null) => !!s && s.status !== "canceled"

export async function getSubscriberForUser(user: { id: string; email?: string | null }): Promise<Subscriber | null> {
  const admin = createAdminClient()

  const { data: linked } = await admin
    .from("newsletter_subscribers")
    .select(SUBSCRIBER_COLUMNS)
    .eq("user_id", user.id)
    .maybeSingle()
  const newsletter = (linked as Subscriber | null) ?? null
  if (isLive(newsletter)) return newsletter

  // Pro membership (profiles) takes precedence over an ended newsletter row.
  const pro = await getProMembershipForUser(user)
  if (isLive(pro)) return pro
  if (newsletter) return newsletter
  if (pro) return pro

  if (!user.email) return null

  // Link a paid subscription that was recorded before this account existed (same verified email).
  const { data: unlinked } = await admin
    .from("newsletter_subscribers")
    .update({ user_id: user.id, updated_at: new Date().toISOString() })
    .eq("email", user.email.toLowerCase())
    .is("user_id", null)
    .select(SUBSCRIBER_COLUMNS)
    .maybeSingle()
  return (unlinked as Subscriber | null) ?? null
}
