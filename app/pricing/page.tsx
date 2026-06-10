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
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-[#262620]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#c8ff00] animate-pulse" />
            <span className="font-display text-2xl tracking-wide text-[#f4f0e6]">WHITE 80</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="font-mono text-xs sm:text-sm text-[#6e6a5e] hover:text-white transition-colors"
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
            <h1 className="font-display text-5xl md:text-6xl text-[#f4f0e6] mb-4 text-balance">
              SEVEN DAYS. <span className="text-[#c8ff00]">FREE.</span>
            </h1>
            <p className="text-[#6e6a5e] font-mono text-sm max-w-md mx-auto mb-6">
              Full access to the desk. No charge until your trial ends.
            </p>
            <div className="inline-flex items-center gap-2 border border-[#c8ff00]/30 px-4 py-1.5">
              <span className="w-1.5 h-1.5 bg-[#c8ff00]" />
              <span className="font-mono text-[10px] tracking-[0.25em] text-[#c8ff00]">CANCEL ANYTIME</span>
            </div>
          </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {PRODUCTS.map((product) => (
            <div
              key={product.id}
              className={`bg-[#141411] border p-6 ${
                product.interval === "year"
                  ? "border-[#c8ff00]/50 relative"
                  : "border-[#262620]"
              }`}
            >
              {product.interval === "year" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-[#c8ff00] text-[#0a0a0a] font-mono text-[10px] tracking-wider px-3 py-1">
                    SAVE $98
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h2 className="font-display text-2xl tracking-wide text-[#f4f0e6] mb-1">{product.name}</h2>
                <p className="text-[#6e6a5e] text-sm">{product.description}</p>
              </div>

              <div className="mb-6">
                <span className="font-display text-5xl text-[#f4f0e6]">
                  ${(product.priceInCents / 100).toFixed(0)}
                </span>
                <span className="text-[#6e6a5e] font-mono text-sm">
                  /{product.interval}
                </span>
              </div>

              <ul className="space-y-3 mb-6">
                {product.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 text-[#c8ff00] mt-0.5 flex-shrink-0"
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
                    <span className="text-[#f4f0e6] text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(product.id)}
                disabled={loading === product.id || isAuthenticated === null}
                className={`w-full font-mono text-sm tracking-wider py-3 transition-colors disabled:opacity-50 ${
                  product.interval === "year"
                    ? "bg-[#c8ff00] hover:bg-[#d9ff4d] text-[#0a0a0a]"
                    : "bg-transparent hover:bg-[#1e1e19] text-[#f4f0e6] border border-[#c8ff00]/30"
                }`}
              >
                {loading === product.id ? "LOADING..." : isAuthenticated === null ? "CHECKING..." : "START FREE TRIAL"}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center space-y-2">
          <p className="text-[#f4f0e6] font-mono text-sm">
            7 days free, then your subscription begins. Cancel anytime.
          </p>
          <p className="text-[#6e6a5e] font-mono text-xs">
            Requires your own Polygon (free) and Anthropic (pay-as-you-go) API keys.
          </p>
        </div>
      </div>
    </div>
  </div>
  )
}

export default dynamic(() => Promise.resolve(PricingPageContent), { ssr: false })
