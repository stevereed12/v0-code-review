"use client"

import { useState, useEffect } from "react"
import { PRODUCTS } from "@/lib/products"
import { createCheckoutSession } from "@/app/actions/stripe"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { MobileMenu } from "@/components/white80/mobile-menu"
import dynamic from "next/dynamic"

function PricingPageContent() {
  const [loading, setLoading] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
    }
    checkAuth()
  }, [supabase.auth])

  const handleSubscribe = async (productId: string) => {
    console.log("[v0] handleSubscribe called with productId:", productId)
    console.log("[v0] isAuthenticated:", isAuthenticated)
    
    // Wait for auth check to complete
    if (isAuthenticated === null) {
      console.log("[v0] Auth check still pending, waiting...")
      return
    }
    
    setLoading(productId)
    
    // Check auth client-side first - redirect to signup if not logged in
    if (!isAuthenticated) {
      console.log("[v0] User not authenticated, redirecting to signup")
      router.push("/auth/signup?redirect=/pricing")
      setLoading(null)
      return
    }
    
    try {
      console.log("[v0] Calling createCheckoutSession...")
      const result = await createCheckoutSession(productId, window.location.origin)
      console.log("[v0] createCheckoutSession result:", result)
      
      if (result.error) {
        console.log("[v0] Error from createCheckoutSession:", result.error)
        if (result.error === "Not authenticated") {
          router.push("/auth/signup?redirect=/pricing")
        } else {
          alert(result.error)
        }
        setLoading(null)
        return
      }

      if (result.url) {
        console.log("[v0] Redirecting to Stripe checkout:", result.url)
        window.location.href = result.url
      }
    } catch (err) {
      console.error("[v0] Exception in handleSubscribe:", err)
      alert("An error occurred. Please try again.")
    }
    setLoading(null)
  }

  return (
    <div className="min-h-screen bg-[#060a10]">
      {/* Header */}
      <header className="border-b border-[#131c2e]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#00e5ff] rounded-full animate-pulse" />
            <span className="font-mono text-lg tracking-wider text-white">WHITE 80</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="font-mono text-xs sm:text-sm text-[#3d4f6b] hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <MobileMenu isLoggedIn={isAuthenticated || false} currentPath="/pricing" />
          </div>
        </div>
      </header>

      <div className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Start Your 7-Day Free Trial
            </h1>
            <p className="text-[#3d4f6b] font-mono text-sm max-w-md mx-auto mb-4">
              Full access to all features. No charge until your trial ends.
            </p>
            <div className="inline-flex items-center gap-2 bg-[#00ffaa]/10 border border-[#00ffaa]/20 rounded-full px-4 py-1.5">
              <span className="w-2 h-2 bg-[#00ffaa] rounded-full" />
              <span className="font-mono text-xs text-[#00ffaa]">CANCEL ANYTIME</span>
            </div>
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
                disabled={loading === product.id || isAuthenticated === null}
                className={`w-full font-mono text-sm tracking-wider py-3 rounded transition-colors disabled:opacity-50 ${
                  product.interval === "year"
                    ? "bg-[#00e5ff] hover:bg-[#00e5ff]/90 text-[#060a10]"
                    : "bg-[#131c2e] hover:bg-[#1a2438] text-white border border-[#00e5ff]/30"
                }`}
              >
                {loading === product.id ? "LOADING..." : isAuthenticated === null ? "CHECKING..." : "START FREE TRIAL"}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center space-y-2">
          <p className="text-[#d6dff0] font-mono text-sm">
            7 days free, then your subscription begins. Cancel anytime.
          </p>
          <p className="text-[#3d4f6b] font-mono text-xs">
            Requires your own Polygon (free) and Anthropic (pay-as-you-go) API keys.
          </p>
        </div>
      </div>
    </div>
  </div>
  )
}

export default dynamic(() => Promise.resolve(PricingPageContent), { ssr: false })
