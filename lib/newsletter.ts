export const NEWSLETTER = {
  id: "white80-newsletter",
  name: "White 80 Pro",
  description: "Premarket brief and morning confirmation brief, every trading day.",
  priceInCents: 4900,
  interval: "month" as const,
  trialDays: 7,
}

export const DELIVERY = {
  // Railway pipeline sends at 5:00 and 5:45 AM PT (8:00 / ~8:45 AM ET).
  premarket: "8:00 AM ET",
  confirmation: "9:00 AM ET",
}
