import { SiteHeader } from "@/components/newsletter/site-header"
import { Hero } from "@/components/newsletter/hero"
import { BriefsSection } from "@/components/newsletter/briefs-section"
import { SampleBrief } from "@/components/newsletter/sample-brief"
import { PricingSection } from "@/components/newsletter/pricing-section"
import { SignupSection } from "@/components/newsletter/signup-section"
import { FaqSection } from "@/components/newsletter/faq-section"
import { SiteFooter } from "@/components/white80/site-footer"
import { publicMetadata } from "@/lib/public-metadata"
import { ResearchSignup } from "@/components/newsletter/research-signup"

export const metadata = publicMetadata(
  "/",
  "White 80 — Daily Premarket Brief for Active Traders",
  "Start your trading day with futures, overnight catalysts, sector rotation and risk flags, then get a morning confirmation brief. Try White 80 Pro free for 7 days.",
)

export default function LandingPage() {
  return (
    <div className="landing min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <Hero />
        <BriefsSection />
        <SampleBrief />
        {process.env.RESEND_RESEARCH_API_KEY && process.env.RESEND_RESEARCH_SEGMENT_ID && (
          <div className="mx-auto max-w-6xl px-4 pt-12 md:pt-16">
            <ResearchSignup placement="home" />
          </div>
        )}
        <PricingSection />
        <SignupSection />
        <FaqSection />
      </main>
      <SiteFooter />
    </div>
  )
}
