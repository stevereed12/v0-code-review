/**
 * TESTIMONIALS
 * ------------
 * Replace each entry below with a REAL testimonial. Only publish quotes you have
 * permission to use. Do not invent quotes, names, or results.
 *
 * - quote:  the testimonial text (verbatim)
 * - name:   real name or handle (e.g. "@tapehunter")
 * - detail: optional context (e.g. "Options trader, 6 yrs" or "Verified subscriber")
 *
 * Any entry left with `placeholder: true` renders as an empty, non-deceptive slot
 * so nothing fake goes live. Set `placeholder: false` once you fill in real content.
 */
type Testimonial = {
  quote: string
  name: string
  detail?: string
  placeholder?: boolean
}

const TESTIMONIALS: Testimonial[] = [
  {
    placeholder: true,
    quote: "Add a real subscriber quote here.",
    name: "Name / @handle",
    detail: "Role or context",
  },
  {
    placeholder: true,
    quote: "Add a real subscriber quote here.",
    name: "Name / @handle",
    detail: "Role or context",
  },
  {
    placeholder: true,
    quote: "Add a real subscriber quote here.",
    name: "Name / @handle",
    detail: "Role or context",
  },
]

export function Testimonials() {
  const live = TESTIMONIALS.filter((t) => !t.placeholder)

  // Until real testimonials are added, don't render a misleading empty section.
  if (live.length === 0) {
    return null
  }

  return (
    <section className="py-20 px-4 border-t border-[#262620]">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-display text-4xl md:text-5xl text-[#f4f0e6] mb-2">FROM THE FLOOR</h2>
        <p className="font-mono text-xs tracking-[0.2em] text-[#6e6a5e] mb-12">
          WHAT TRADERS SAY AFTER THEY WALK IN WITH THE READ.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#262620] border border-[#262620]">
          {live.map((t) => (
            <figure key={t.name} className="bg-[#0a0a0a] p-6 flex flex-col justify-between">
              <blockquote className="text-[#f4f0e6] leading-relaxed mb-6">
                <span className="text-[#c8ff00] font-display text-3xl leading-none mr-1">&ldquo;</span>
                {t.quote}
              </blockquote>
              <figcaption className="border-t border-[#262620] pt-4">
                <p className="font-mono text-sm text-[#f4f0e6]">{t.name}</p>
                {t.detail ? <p className="font-mono text-[11px] text-[#6e6a5e] mt-1">{t.detail}</p> : null}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
