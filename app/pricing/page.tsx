import { redirect } from "next/navigation"

// One front door: every "pricing" / "get started" path lands on the email-first signup
// on the home page (7-day trial -> White 80 Pro, $49/mo). The old app checkout that asked
// buyers for their own API keys is retired; see git history for the previous page.
export default function PricingPage() {
  redirect("/#signup")
}
