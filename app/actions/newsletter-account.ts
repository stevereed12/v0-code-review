"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  getPaidNewsletterCheckout,
  getStripe,
  getSubscriberForUser,
  upsertSubscriberFromStripe,
} from "@/lib/newsletter-subscribers"

export type CreateAccountState =
  | { status: "idle" }
  | { status: "error"; message: string; existingAccount?: boolean }

export type MembershipState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; message: string }
  | { status: "portal"; url: string }

export async function createNewsletterAccount(
  _previous: CreateAccountState,
  formData: FormData,
): Promise<CreateAccountState> {
  const sessionId = formData.get("session_id")
  const password = formData.get("password")
  const confirm = formData.get("confirm")

  if (typeof password !== "string" || password.length < 8 || password.length > 72) {
    return { status: "error", message: "Use a password between 8 and 72 characters." }
  }
  if (password !== confirm) {
    return { status: "error", message: "Passwords don't match." }
  }

  const checkout = await getPaidNewsletterCheckout(typeof sessionId === "string" ? sessionId : null)
  if (!checkout) {
    return { status: "error", message: "We couldn't verify your payment. Refresh the page or contact support." }
  }

  const admin = createAdminClient()
  const subscriber = await upsertSubscriberFromStripe(checkout.subscription, checkout.email)
  if (subscriber.user_id) {
    return { status: "error", message: "An account already exists for this email. Sign in instead.", existingAccount: true }
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: checkout.email,
    password,
    email_confirm: true,
  })

  if (createError || !created.user) {
    if (createError?.code === "email_exists" || createError?.status === 422) {
      return { status: "error", message: "An account already exists for this email. Sign in instead.", existingAccount: true }
    }
    if (createError?.code === "weak_password") {
      return { status: "error", message: "That password is too weak. Try a longer one." }
    }
    console.error("Account creation failed:", createError)
    return { status: "error", message: "Something went wrong creating your account. Please try again." }
  }

  await admin
    .from("newsletter_subscribers")
    .update({ user_id: created.user.id, updated_at: new Date().toISOString() })
    .eq("id", subscriber.id)

  const supabase = await createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({ email: checkout.email, password })
  if (signInError) redirect("/auth/login?next=/account")

  redirect("/account")
}

async function requireSubscriber() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login?next=/account")
  return getSubscriberForUser(user)
}

async function setCancelAtPeriodEnd(cancel: boolean): Promise<MembershipState> {
  const subscriber = await requireSubscriber()
  if (!subscriber?.stripe_subscription_id) {
    return { status: "error", message: "No membership found on this account." }
  }
  if (subscriber.status === "canceled") {
    return { status: "error", message: "This membership has already ended." }
  }

  try {
    const updated = await getStripe().subscriptions.update(subscriber.stripe_subscription_id, {
      cancel_at_period_end: cancel,
    })
    await upsertSubscriberFromStripe(updated, subscriber.email)
  } catch (error) {
    console.error("Membership update failed:", error)
    return { status: "error", message: "Couldn't update your membership. Please try again." }
  }

  revalidatePath("/account")
  return cancel
    ? { status: "success", message: "Your membership will end at the close of the current period." }
    : { status: "success", message: "Your membership is active again." }
}

export async function cancelMembership(_previous: MembershipState): Promise<MembershipState> {
  return setCancelAtPeriodEnd(true)
}

export async function resumeMembership(_previous: MembershipState): Promise<MembershipState> {
  return setCancelAtPeriodEnd(false)
}

export async function openBillingPortal(_previous: MembershipState): Promise<MembershipState> {
  const subscriber = await requireSubscriber()
  if (!subscriber?.stripe_customer_id) {
    return { status: "error", message: "No billing profile found on this account." }
  }

  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: subscriber.stripe_customer_id,
      return_url: `${origin}/account`,
    })
    return { status: "portal", url: session.url }
  } catch (error) {
    console.error("Billing portal failed:", error)
    return {
      status: "error",
      message: "Billing management isn't available right now. You can still cancel from this page.",
    }
  }
}
