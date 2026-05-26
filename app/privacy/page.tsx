import { PageHeader } from "@/components/white80/page-header"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#060a10]">
      <PageHeader currentPath="/privacy" />
      
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-[#d6dff0]">
          <p className="text-[#3d4f6b]">Last updated: January 2025</p>

          <section>
            <h2 className="text-xl font-bold text-white mt-8 mb-4">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us, including your name, email address, 
              and payment information when you create an account or subscribe to our service. 
              We also collect API keys you provide for third-party services (Polygon.io, Anthropic).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mt-8 mb-4">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2 text-[#3d4f6b]">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Analyze usage patterns to improve user experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mt-8 mb-4">3. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data. 
              Your API keys are encrypted at rest and in transit. We never share your 
              personal information or trading data with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mt-8 mb-4">4. Third-Party Services</h2>
            <p>
              White 80 integrates with third-party services (Polygon.io for market data, 
              Anthropic for AI analysis). Your use of these services is subject to their 
              respective privacy policies. We only transmit the minimum data necessary 
              to provide our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mt-8 mb-4">5. Data Retention</h2>
            <p>
              We retain your account information for as long as your account is active. 
              You can request deletion of your data at any time by contacting support. 
              Trading analysis data is not permanently stored and is generated on-demand.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mt-8 mb-4">6. Cookies</h2>
            <p>
              We use essential cookies to maintain your session and preferences. 
              We do not use third-party tracking cookies or sell your data to advertisers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mt-8 mb-4">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 text-[#3d4f6b]">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data in a portable format</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mt-8 mb-4">8. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:privacy@white80.io" className="text-[#00e5ff] hover:underline">
                privacy@white80.io
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
