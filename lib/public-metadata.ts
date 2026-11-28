import type { Metadata } from "next"

export function publicMetadata(path: string, title: string, description: string, type: "website" | "article" = "website"): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: { index: true, follow: true },
    openGraph: { type, title, description, url: path, siteName: "White 80", locale: "en_US" },
    twitter: { card: "summary", title, description },
  }
}
