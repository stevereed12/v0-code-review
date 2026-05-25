import { White80Dashboard } from "@/components/white80/dashboard"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (!user || authError) {
    redirect("/auth/login")
  }

  // Get user's profile with API keys and subscription status
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("subscription_status, polygon_api_key, anthropic_api_key")
    .eq("id", user.id)
    .single()

  // If profile fetch fails, don't redirect to pricing - could be a temporary error
  if (profileError && profileError.code !== "PGRST116") {
    // PGRST116 is "no rows found" - any other error should not block the user
    console.error("Profile fetch error:", profileError)
  }

  // Check subscription status - must have active or trialing subscription to access dashboard
  const hasActiveSubscription = profile?.subscription_status === "active" || profile?.subscription_status === "trialing"
  
  if (!hasActiveSubscription && profile) {
    // Only redirect if we successfully fetched profile and it shows no subscription
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
      userId={user.id}
      userEmail={user.email}
      hasSubscription={hasActiveSubscription}
      polygonKey={profile?.polygon_api_key}
      anthropicKey={profile?.anthropic_api_key}
    />
  )
}
