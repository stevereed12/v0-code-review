"use server"

import { Resend } from "resend"

const SUBJECT_LABELS: Record<string, string> = {
  general: "General Question",
  support: "Technical Support",
  billing: "Billing Issue",
  feature: "Feature Request",
  bug: "Bug Report",
}

interface ContactInput {
  name: string
  email: string
  subject: string
  message: string
}

export async function sendContactMessage(input: ContactInput) {
  try {
    const { name, email, subject, message } = input

    // Basic validation
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return { error: "Please fill out all required fields." }
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { error: "Please enter a valid email address." }
    }

    if (!process.env.RESEND_API_KEY) {
      return { error: "Email service is not configured. Please email contact@white80.io directly." }
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const subjectLabel = SUBJECT_LABELS[subject] || "General Question"

    const { error } = await resend.emails.send({
      // Must be an address on a domain verified in Resend (white80.io)
      from: "White 80 Contact <contact@white80.io>",
      to: ["contact@white80.io"],
      replyTo: email,
      subject: `[${subjectLabel}] New message from ${name}`,
      text: `New contact form submission

Name: ${name}
Email: ${email}
Topic: ${subjectLabel}

Message:
${message}
`,
    })

    if (error) {
      console.error("[v0] Resend error:", error)
      return { error: "Failed to send message. Please email contact@white80.io directly." }
    }

    return { success: true }
  } catch (err) {
    console.error("[v0] sendContactMessage error:", err)
    return { error: err instanceof Error ? err.message : "Something went wrong. Please try again." }
  }
}
