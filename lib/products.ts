export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  interval: "month" | "year"
  features: string[]
}

export const PRODUCTS: Product[] = [
  {
    id: "white80-monthly",
    name: "White 80 Pro",
    description: "Full access to White 80 trading intelligence",
    priceInCents: 4900, // $49/month
    interval: "month",
    features: [
      "AI-powered trading signals",
      "Pre-market briefings",
      "Options flow analysis",
      "Tier 1 scanner",
      "Deep thesis research",
      "Performance tracker",
      "Cloud sync across devices",
    ],
  },
  {
    id: "white80-yearly",
    name: "White 80 Pro (Annual)",
    description: "Full access - save 2 months with yearly billing",
    priceInCents: 49000, // $490/year (save $98)
    interval: "year",
    features: [
      "Everything in monthly",
      "2 months free",
      "Priority support",
    ],
  },
]

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id)
}
