import 'server-only'

import Stripe from 'stripe'

// Lazy initialization to avoid build-time errors when env vars aren't available
let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    stripeInstance = new Stripe(key)
  }
  return stripeInstance
}

// For backwards compatibility - but prefer getStripe() for lazy init
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : (null as unknown as Stripe)
