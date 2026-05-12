"use client"

import { useState } from "react"
import { PRODUCTS } from "@/lib/products"
import { createCheckoutSession } from "@/app/actions/stripe"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  const handleSubscribe = async (productId: string) => {
    setLoading(productId)
    const result = await createCheckoutSession(productId)
    
    if (result.error) {
      if (result.error === "Not authenticated") {
        router.push("/auth/login")
      } else {
        alert(result.error)
      }
      setLoading(null)
      return
    }

    if (result.url) {
      window.location.href = result.url
    }
  }

  return (
    <div className="min-h-screen bg-[#060a10] py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-3 h-3 bg-[#00e5ff] rounded-full animate-pulse" />
            <span className="font-mono text-xl tracking-wider text-white">WHITE 80</span>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Trading Intelligence, Simplified
          </h1>
          <p className="text-[#3d4f6b] font-mono text-sm max-w-md mx-auto">
            AI-powered signals, pre-market briefs, options flow analysis. 
            Everything you need to trade smarter.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {PRODUCTS.map((product) => (
            <div
              key={product.id}
              className={`bg-[#0c1020] border rounded-lg p-6 ${
                product.interval === "year"
                  ? "border-[#00e5ff]/50 relative"
                  : "border-[#131c2e]"
              }`}
            >
              {product.interval === "year" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-[#00e5ff] text-[#060a10] font-mono text-[10px] tracking-wider px-3 py-1 rounded-full">
                    SAVE $98
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h2 className="font-mono text-lg text-white mb-1">{product.name}</h2>
                <p className="text-[#3d4f6b] text-sm">{product.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">
                  ${(product.priceInCents / 100).toFixed(0)}
                </span>
                <span className="text-[#3d4f6b] font-mono text-sm">
                  /{product.interval}
                </span>
              </div>

              <ul className="space-y-3 mb-6">
                {product.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 text-[#00ffaa] mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-[#d6dff0] text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(product.id)}
                disabled={loading === product.id}
                className={`w-full font-mono text-sm tracking-wider py-3 rounded transition-colors disabled:opacity-50 ${
                  product.interval === "year"
                    ? "bg-[#00e5ff] hover:bg-[#00e5ff]/90 text-[#060a10]"
                    : "bg-[#131c2e] hover:bg-[#1a2438] text-white border border-[#00e5ff]/30"
                }`}
              >
                {loading === product.id ? "LOADING..." : "SUBSCRIBE"}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-[#3d4f6b] font-mono text-xs">
            Cancel anytime. Requires your own Polygon and Anthropic API keys.
          </p>
        </div>
      </div>
    </div>
  )
}
