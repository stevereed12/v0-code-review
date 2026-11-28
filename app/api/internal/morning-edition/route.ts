import { createAdminClient } from "@/lib/supabase/admin"
import { ingestMorningEdition } from "@/lib/morning-ingest"

export const runtime = "nodejs"

export async function POST(request: Request) {
  return ingestMorningEdition(request, {
    secret: process.env.WHITE80_MORNING_PUBLISH_SECRET,
    now: () => new Date(),
    insert: async (row) => {
      const { error } = await createAdminClient().from("white80_morning_editions").insert(row)
      if (error?.code === "23505") return "conflict"
      if (error) throw error
      return "created"
    },
    existingHash: async (editionId) => {
      const { data, error } = await createAdminClient().from("white80_morning_editions").select("content_sha256")
        .eq("edition_id", editionId).maybeSingle()
      if (error) throw error
      return data?.content_sha256 as string | undefined
    },
  })
}
