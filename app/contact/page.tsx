"use client"

import { useState } from "react"
import { PageHeader } from "@/components/white80/page-header"
import { SiteFooter } from "@/components/white80/site-footer"
import { Mail, MessageSquare, Clock } from "lucide-react"
import { sendContactMessage } from "@/app/actions/contact"

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const formData = new FormData(form)
    const result = await sendContactMessage({
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      subject: String(formData.get("subject") || ""),
      message: String(formData.get("message") || ""),
    })

    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <PageHeader currentPath="/contact" />
      
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="font-display text-5xl md:text-6xl text-[#f4f0e6] mb-4">GET IN TOUCH</h1>
          <p className="text-[#6e6a5e] font-mono text-sm">
            Have questions? We&apos;re here to help.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-[#0a0a0a] border border-[#262620] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#c8ff00]/10 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-[#c8ff00]" />
                </div>
                <div>
                  <div className="font-mono text-[10px] text-[#6e6a5e] tracking-wider">EMAIL</div>
                  <a href="mailto:contact@white80.io" className="text-[#f4f0e6] hover:text-[#c8ff00] transition-colors">
                    contact@white80.io
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-[#262620] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#f4f0e6]/10 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-[#f4f0e6]" />
                </div>
                <div>
                  <div className="font-mono text-[10px] text-[#6e6a5e] tracking-wider">LIVE CHAT</div>
                  <span className="text-[#f4f0e6]">Coming soon</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-[#262620] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#c8ff00]/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#c8ff00]" />
                </div>
                <div>
                  <div className="font-mono text-[10px] text-[#6e6a5e] tracking-wider">RESPONSE TIME</div>
                  <span className="text-[#f4f0e6]">Within 24 hours</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-[#0a0a0a] border border-[#262620] rounded-lg p-6">
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-[#c8ff00]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-[#c8ff00]" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Message Sent!</h3>
                <p className="text-[#6e6a5e] text-sm">
                  We&apos;ll get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-mono text-[10px] text-[#6e6a5e] tracking-wider mb-1.5">
                    NAME
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full bg-[#0a0a0a] border border-[#262620] rounded px-3 py-2 text-sm text-[#f4f0e6] placeholder:text-[#6e6a5e] focus:outline-none focus:border-[#c8ff00]/50"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-[#6e6a5e] tracking-wider mb-1.5">
                    EMAIL
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full bg-[#0a0a0a] border border-[#262620] rounded px-3 py-2 text-sm text-[#f4f0e6] placeholder:text-[#6e6a5e] focus:outline-none focus:border-[#c8ff00]/50"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-[#6e6a5e] tracking-wider mb-1.5">
                    SUBJECT
                  </label>
                  <select
                    name="subject"
                    required
                    className="w-full bg-[#0a0a0a] border border-[#262620] rounded px-3 py-2 text-sm text-[#f4f0e6] focus:outline-none focus:border-[#c8ff00]/50"
                  >
                    <option value="">Select a topic</option>
                    <option value="general">General Question</option>
                    <option value="support">Technical Support</option>
                    <option value="billing">Billing Issue</option>
                    <option value="feature">Feature Request</option>
                    <option value="bug">Bug Report</option>
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-[#6e6a5e] tracking-wider mb-1.5">
                    MESSAGE
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={4}
                    className="w-full bg-[#0a0a0a] border border-[#262620] rounded px-3 py-2 text-sm text-[#f4f0e6] placeholder:text-[#6e6a5e] focus:outline-none focus:border-[#c8ff00]/50 resize-none"
                    placeholder="How can we help?"
                  />
                </div>
                {error && (
                  <div className="bg-[#f87171]/10 border border-[#f87171]/30 rounded px-3 py-2 text-[#f87171] font-mono text-xs">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#c8ff00] hover:bg-[#c8ff00]/90 text-[#0a0a0a] font-mono text-sm py-2.5 rounded transition-colors disabled:opacity-50"
                >
                  {loading ? "SENDING..." : "SEND MESSAGE"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
