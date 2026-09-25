"use server"

import Stripe from "stripe"
import { headers } from "next/headers"
import { NEWSLETTER } from "@/lib/newsletter"

export type CheckoutState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "ready"; url: string }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

async function resolveOrigin(): Promise<string> {
  const origin = (await headers()).get("origin")
  if (origin && /^https?:\/\/[^\s/]+$/.test(origin)) return origin
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return "http://localhost:3000"
}

export async function startNewsletterCheckout(
  _previous: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const raw = formData.get("email")
  const email = typeof raw === "string" ? raw.trim().toLowerCase() : ""

  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { status: "error", message: "Enter a valid email address." }
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return { status: "error", message: "Checkout is temporarily unavailable. Please try again shortly." }
  }

  const origin = await resolveOrigin()
  const stripe = new Stripe(secretKey)

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: NEWSLETTER.name,
              description: NEWSLETTER.description,
            },
            unit_amount: NEWSLETTER.priceInCents,
            recurring: { interval: NEWSLETTER.interval },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: NEWSLETTER.trialDays,
        metadata: { product_id: NEWSLETTER.id },
      },
      metadata: { product_id: NEWSLETTER.id, source: "landing" },
      success_url: `${origin}/subscribed?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#signup`,
    })

    if (!session.url) {
      return { status: "error", message: "Could not start checkout. Please try again." }
    }
    return { status: "ready", url: session.url }
  } catch (error) {
    console.error("Newsletter checkout error:", error)
    return { status: "error", message: "Could not start checkout. Please try again." }
  }
}
