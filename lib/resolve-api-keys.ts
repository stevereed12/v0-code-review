import { createClient } from "@/lib/supabase/server"

interface ResolvedKeys {
  anthropicKey: string | null
  polygonKey: string | null
}

/**
 * The signed-in user's profile is the source of truth for their keys.
 * Browser-supplied keys are only a fallback, because localStorage gets wiped
 * by data resets, logouts, and user switches.
 */
export async function resolveApiKeys(clientKeys: {
  anthropicKey?: string | null
  polygonKey?: string | null
}): Promise<ResolvedKeys> {
  let profileAnthropic: string | null = null
  let profilePolygon: string | null = null

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("anthropic_api_key, polygon_api_key")
        .eq("id", user.id)
        .single()

      profileAnthropic = profile?.anthropic_api_key?.trim() || null
      profilePolygon = profile?.polygon_api_key?.trim() || null
    }
  } catch (err) {
    console.error("Failed to resolve profile API keys:", err)
  }

  return {
    anthropicKey:
      profileAnthropic || clientKeys.anthropicKey?.trim() || process.env.ANTHROPIC_API_KEY?.trim() || null,
    polygonKey: profilePolygon || clientKeys.polygonKey?.trim() || process.env.POLYGON_API_KEY?.trim() || null,
  }
}
