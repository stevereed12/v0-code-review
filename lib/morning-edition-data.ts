import "server-only"
import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { morningEditionSchema, type MorningEdition } from "@/lib/morning-edition"

const active = (status: string | null | undefined) => status === "active" || status === "trialing"

export async function requireMorningMembership(next: "/dashboard/morning-edition" | "/dashboard/rocket-board") {
  const auth = await createClient()
  const { data: { user }, error } = await auth.auth.getUser()
  if (error || !user) redirect(`/auth/login?next=${encodeURIComponent(next)}`)
  const admin = createAdminClient()
  const profile = await admin.from("profiles").select("subscription_status").eq("id", user.id).maybeSingle()
  if (active(profile.data?.subscription_status)) return admin
  const linked = await admin.from("newsletter_subscribers").select("status")
    .eq("user_id", user.id).in("status", ["active", "trialing"]).limit(1).maybeSingle()
  if (active(linked.data?.status)) return admin
  if (user.email_confirmed_at && user.email) {
    const unlinked = await admin.from("newsletter_subscribers").select("status").eq("email", user.email.trim().toLowerCase())
      .is("user_id", null).in("status", ["active", "trialing"]).limit(1).maybeSingle()
    if (active(unlinked.data?.status)) return admin
  }
  redirect("/account")
}

type Admin = ReturnType<typeof createAdminClient>

export async function getRocketEdition(admin: Admin, date?: string): Promise<MorningEdition | null> {
  const query = admin.from("white80_morning_editions").select("content")
  const { data, error } = date ? await query.eq("session_date", date).maybeSingle() :
    await query.order("session_date", { ascending: false }).limit(1).maybeSingle()
  if (error) throw new Error("Could not read the saved morning edition")
  const parsed = morningEditionSchema.safeParse(data?.content)
  return parsed.success ? parsed.data : null
}

export async function getRocketHistory(admin: Admin, date: string): Promise<MorningEdition[]> {
  const { data, error } = await admin.from("white80_morning_editions").select("content")
    .lt("session_date", date).order("session_date", { ascending: false }).limit(10)
  if (error) throw new Error("Could not read the Rocket Board history")
  return (data ?? []).flatMap((row) => {
    const parsed = morningEditionSchema.safeParse(row.content)
    return parsed.success ? [parsed.data] : []
  })
}

// A new public display of Massive-based analytics follows the plan's licensed scope.
// This flag is for Rocket Board screens only and does not control newsletter delivery.
export function rocketLiveEnabled(): boolean {
  return process.env.WHITE80_ROCKET_BOARD_LIVE === "1"
}
