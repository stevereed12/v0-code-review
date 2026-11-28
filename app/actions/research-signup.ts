"use server"

import { Resend } from "resend"
import { z } from "zod"

export type ResearchSignupState = "idle" | "saved" | "received" | "invalid" | "unavailable"

const emailAddress = z.string().trim().toLowerCase().max(254).email()

export async function joinResearchList(
  _previous: ResearchSignupState,
  formData: FormData,
): Promise<ResearchSignupState> {
  const address = emailAddress.safeParse(formData.get("email"))
  if (!address.success) return "invalid"
  if (formData.get("company")) return "received"

  const key = process.env.RESEND_RESEARCH_API_KEY
  const segmentId = process.env.RESEND_RESEARCH_SEGMENT_ID
  if (!key || !segmentId) return "unavailable"

  try {
    const resend = new Resend(key)
    const email = address.data
    const existing = await resend.contacts.get({ email: encodeURIComponent(email) })

    if (existing.data) {
      if (existing.data.unsubscribed) return "received"
      const result = await resend.contacts.segments.add({ contactId: existing.data.id, segmentId })
      if (result.data) return "saved"
      if (result.error?.statusCode === 409) return "received"
      console.error("Research segment enrollment failed", result.error?.name)
      return "unavailable"
    }

    if (existing.error?.statusCode !== 404) {
      console.error("Research contact lookup failed", existing.error?.name)
      return "unavailable"
    }

    const result = await resend.contacts.create({ email, segments: [{ id: segmentId }] })
    if (result.data) return "saved"
    if (result.error?.statusCode === 409) return "received"
    console.error("Research contact creation failed", result.error?.name)
  } catch {
    console.error("Research signup provider unavailable")
  }
  return "unavailable"
}
