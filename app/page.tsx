import { SiteHeader } from "@/components/newsletter/site-header"
import { Hero } from "@/components/newsletter/hero"
import { BriefsSection } from "@/components/newsletter/briefs-section"
import { SampleBrief } from "@/components/newsletter/sample-brief"
import { PricingSection } from "@/components/newsletter/pricing-section"
import { SignupSection } from "@/components/newsletter/signup-section"
import { FaqSection } from "@/components/newsletter/faq-section"
import { SiteFooter } from "@/components/white80/site-footer"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Hero />
        <BriefsSection />
        <SampleBrief />
        <PricingSection />
        <SignupSection />
        <FaqSection />
      </main>
      <SiteFooter />
    </div>
  )
}
