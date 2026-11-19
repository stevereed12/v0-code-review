import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import { isNewsletterSubscription, syncNewsletterSubscription } from "@/lib/newsletter-subscribers"

// Newer Stripe API versions put the billing period on the subscription item, not the subscription.
function periodEndIso(subscription: Stripe.Subscription): string | null {
  const item = subscription.items?.data?.[0] as { current_period_end?: number } | undefined
  const legacy = (subscription as unknown as { current_period_end?: number }).current_period_end
  const seconds = item?.current_period_end ?? legacy
  return seconds ? new Date(seconds * 1000).toISOString() : null
}

export async function POST(req: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
  }
  
  const stripe = new Stripe(stripeSecretKey)
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Missing Supabase config" }, { status: 500 })
  }
  
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id
      const subscriptionId = session.subscription as string

      if (userId && subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        
        await supabaseAdmin
          .from("profiles")
          .update({
            subscription_status: "active",
            subscription_id: subscriptionId,
            subscription_end_date: periodEndIso(subscription),
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId)
      }
      break
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      // Newsletter subscriptions live in newsletter_subscribers, not profiles.
      if (isNewsletterSubscription(subscription)) {
        await syncNewsletterSubscription(stripe, subscription)
        break
      }

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single()

      if (profile) {
        await supabaseAdmin
          .from("profiles")
          .update({
            subscription_status: subscription.status === "active" ? "active" : subscription.status,
            subscription_end_date: periodEndIso(subscription),
            updated_at: new Date().toISOString(),
          })
          .eq("id", profile.id)
      }
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      if (isNewsletterSubscription(subscription)) {
        await syncNewsletterSubscription(stripe, subscription)
        break
      }

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single()

      if (profile) {
        await supabaseAdmin
          .from("profiles")
          .update({
            subscription_status: "canceled",
            subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", profile.id)
      }
      break
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single()

      if (profile) {
        await supabaseAdmin
          .from("profiles")
          .update({
            subscription_status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("id", profile.id)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
