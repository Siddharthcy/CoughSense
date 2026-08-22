"use client"

import { AudioLines } from "lucide-react"

const links = [
  { label: "Screening", href: "#screening" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Results", href: "#results" },
  { label: "Architecture", href: "#architecture" },
]

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <AudioLines className="size-4" />
          </span>
          <div className="flex flex-col">
            <span className="font-mono text-xs uppercase tracking-[0.28em] text-foreground">
              CoughSense
            </span>
            <span className="text-xs text-muted-foreground">
              AI-assisted respiratory pre-screening
            </span>
          </div>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition hover:text-primary"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto w-full max-w-6xl px-5 py-5 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70 sm:px-8">
          CoughSense is a screening aid, not a medical diagnosis.
        </p>
      </div>
    </footer>
  )
}
