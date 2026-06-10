import { PageHeader } from "@/components/white80/page-header"
import { SiteFooter } from "@/components/white80/site-footer"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <PageHeader currentPath="/terms" />
      
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="font-display text-5xl text-[#f4f0e6] mb-8">Terms of Service</h1>
        
        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-[#f4f0e6]">
          <p className="text-[#6e6a5e]">Last updated: January 2025</p>

          <section>
            <h2 className="font-display text-2xl tracking-wide text-[#f4f0e6] mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using White 80, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, do not use our service.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-wide text-[#f4f0e6] mt-8 mb-4">2. Description of Service</h2>
            <p>
              White 80 provides AI-powered trading analysis tools, including market scanning, 
              signal generation, and portfolio tracking. Our service is designed to assist 
              with trading research and analysis.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-wide text-[#f4f0e6] mt-8 mb-4">3. Not Financial Advice</h2>
            <p className="bg-[#f87171]/10 border border-[#f87171]/30 p-4 rounded-lg">
              <strong className="text-[#f87171]">IMPORTANT:</strong> White 80 does not provide financial, 
              investment, legal, or tax advice. All analysis, signals, and recommendations are for 
              informational purposes only. You are solely responsible for your trading decisions. 
              Past performance does not guarantee future results. Trading involves substantial 
              risk of loss.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-wide text-[#f4f0e6] mt-8 mb-4">4. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials 
              and API keys. You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-wide text-[#f4f0e6] mt-8 mb-4">5. API Keys</h2>
            <p>
              You must provide your own API keys for Polygon.io and Anthropic. You are responsible 
              for any charges incurred through your use of these third-party services. We are not 
              responsible for issues arising from third-party service outages or changes.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-wide text-[#f4f0e6] mt-8 mb-4">6. Subscription and Billing</h2>
            <p>
              Subscriptions are billed monthly. You may cancel at any time, and your access will 
              continue until the end of your current billing period. Refunds are available within 
              7 days of your first paid subscription.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-wide text-[#f4f0e6] mt-8 mb-4">7. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2 text-[#6e6a5e]">
              <li>Use the service for any illegal purpose</li>
              <li>Attempt to reverse engineer or copy our software</li>
              <li>Share your account with others</li>
              <li>Interfere with or disrupt the service</li>
              <li>Scrape or automate access to our service</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-wide text-[#f4f0e6] mt-8 mb-4">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, White 80 shall not be liable for any 
              indirect, incidental, special, consequential, or punitive damages, including 
              but not limited to loss of profits, data, or trading losses.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-wide text-[#f4f0e6] mt-8 mb-4">9. Changes to Terms</h2>
            <p>
              We may modify these terms at any time. We will notify you of material changes 
              via email or through the service. Continued use after changes constitutes 
              acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-wide text-[#f4f0e6] mt-8 mb-4">10. Contact</h2>
            <p>
              Questions about these Terms should be sent to{" "}
              <a href="mailto:legal@white80.io" className="text-[#c8ff00] hover:underline">
                legal@white80.io
              </a>
            </p>
          </section>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
