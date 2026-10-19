"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    await createClient().auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      Sign out
    </button>
  )
}
