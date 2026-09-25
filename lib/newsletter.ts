export const NEWSLETTER = {
  id: "white80-newsletter",
  name: "White 80 Daily Brief",
  description: "Premarket brief and morning confirmation brief, every trading day.",
  priceInCents: 4900,
  interval: "month" as const,
  trialDays: 7,
}

export const DELIVERY = {
  premarket: "7:00 AM ET",
  confirmation: "9:45 AM ET",
}
