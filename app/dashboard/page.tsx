import { White80Dashboard } from "@/components/white80/dashboard"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user's profile with API keys and subscription status
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, polygon_api_key, anthropic_api_key")
    .eq("id", user.id)
    .single()

  // Check subscription status - must have active subscription to access dashboard
  const hasActiveSubscription = profile?.subscription_status === "active"
  
  if (!hasActiveSubscription) {
    // No subscription - redirect to pricing
    redirect("/pricing")
  }

  // Check if API keys are set up
  const hasApiKeys = profile?.polygon_api_key && profile?.anthropic_api_key
  
  if (!hasApiKeys) {
    // Has subscription but no API keys - redirect to onboarding
    redirect("/onboarding")
  }

  return (
    <White80Dashboard 
      userEmail={user.email}
      hasSubscription={hasActiveSubscription}
      polygonKey={profile?.polygon_api_key}
      anthropicKey={profile?.anthropic_api_key}
    />
  )
}
