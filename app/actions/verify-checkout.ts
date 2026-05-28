"use server"

import Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured")
  }
  return new Stripe(key)
}

export async function verifyCheckoutSession(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: "Not authenticated" }
  }

  let stripe: Stripe
  try {
    stripe = getStripeClient()
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Stripe configuration error" }
  }

  try {
    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    })

    // Verify the session belongs to this user
    if (session.metadata?.supabase_user_id !== user.id) {
      return { error: "Session does not belong to this user" }
    }

    // Check payment status
    if (session.payment_status !== "paid") {
      return { error: "Payment not completed" }
    }

    // Get subscription details
    const subscription = session.subscription as Stripe.Subscription | null
    
    if (!subscription) {
      return { error: "No subscription found" }
    }

    // Update user profile with subscription info
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        subscription_status: "active",
        subscription_id: typeof subscription === "string" ? subscription : subscription.id,
        stripe_customer_id: session.customer as string,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Failed to update profile:", updateError)
      return { error: "Failed to update subscription status" }
    }

    return { success: true }
  } catch (err) {
    console.error("Error verifying checkout:", err)
    return { error: "Failed to verify payment" }
  }
}
