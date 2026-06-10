"use client"

import { useState } from "react"
import { PageHeader } from "@/components/white80/page-header"
import { SiteFooter } from "@/components/white80/site-footer"
import { ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"

const FAQ_ITEMS = [
  {
    question: "What is White 80?",
    answer: "White 80 is an AI-powered trading intelligence platform that helps active traders identify high-probability setups, manage watchlists, and stay informed with real-time market analysis. Think of it as your personal trading desk analyst."
  },
  {
    question: "How does the 7-day free trial work?",
    answer: "You get full access to all White 80 features for 7 days completely free. No charges until your trial ends. You can cancel anytime during the trial period and won't be charged."
  },
  {
    question: "What API keys do I need?",
    answer: "White 80 requires two API keys: a Polygon.io API key (free tier available) for real-time market data, and an Anthropic API key (pay-as-you-go) for AI analysis. You maintain control of your own API costs."
  },
  {
    question: "Why do I need my own API keys?",
    answer: "Using your own API keys gives you control over costs, ensures data privacy, and allows you to use your existing Polygon/Anthropic subscriptions. It also means no rate limiting from shared infrastructure."
  },
  {
    question: "What's included in the subscription?",
    answer: "Your subscription includes: AI-powered signal generation, multi-tier watchlist management, pre-market briefs, options flow analysis, spread strategy conversion, portfolio tracking, and all future feature updates."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes, you can cancel your subscription at any time from your account settings or by contacting support. Your access continues until the end of your current billing period."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. Your API keys are encrypted and stored securely. We never share your data with third parties. All communications are encrypted using industry-standard TLS."
  },
  {
    question: "What markets does White 80 cover?",
    answer: "White 80 primarily covers US equities and options markets. This includes NYSE, NASDAQ, and all optionable securities. We're continuously expanding coverage based on user feedback."
  },
  {
    question: "How accurate are the AI signals?",
    answer: "White 80 provides analysis and ideas, not financial advice. The AI identifies patterns, unusual activity, and potential setups based on real-time data. Always do your own due diligence before trading."
  },
  {
    question: "Do you offer refunds?",
    answer: "We offer a full refund within the first 7 days of your paid subscription if you're not satisfied. Contact support@white80.io to request a refund."
  },
]

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="border border-[#262620] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-[#0a0a0a] transition-colors"
      >
        <span className="font-mono text-sm text-[#f4f0e6]">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-[#c8ff00] shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#6e6a5e] shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 text-sm text-[#6e6a5e] leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  )
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <PageHeader currentPath="/faq" />
      
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="font-display text-5xl md:text-6xl text-[#f4f0e6] mb-4">QUESTIONS</h1>
          <p className="text-[#6e6a5e] font-mono text-xs tracking-[0.2em]">
            EVERYTHING YOU NEED TO KNOW ABOUT WHITE 80
          </p>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <FAQItem key={i} question={item.question} answer={item.answer} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-[#6e6a5e] text-sm mb-4">Still have questions?</p>
          <Link
            href="/contact"
            className="inline-block font-mono text-sm bg-[#c8ff00]/10 border border-[#c8ff00] text-[#c8ff00] px-6 py-2.5 hover:bg-[#c8ff00]/20 transition-colors"
          >
            CONTACT US
          </Link>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
