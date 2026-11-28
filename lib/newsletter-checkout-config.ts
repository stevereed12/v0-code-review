export function isStripeTestKey(key: string) {
  return /^(sk|rk)_test_/.test(key)
}

export function newsletterCheckoutKey(env = process.env): string | undefined {
  if (env.VERCEL_ENV !== "preview") return env.STRIPE_SECRET_KEY

  const key = env.STRIPE_PREVIEW_SECRET_KEY
  return key && isStripeTestKey(key) ? key : undefined
}
