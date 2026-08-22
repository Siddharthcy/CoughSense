"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { AudioLines } from "lucide-react"

const links = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Results", href: "#results" },
  { label: "Architecture", href: "#architecture" },
]

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-colors ${
        scrolled ? "border-b border-border bg-background/80 backdrop-blur-xl" : ""
      }`}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/12 text-primary">
            <AudioLines className="size-4" />
          </span>
          <span className="font-mono text-sm font-semibold uppercase tracking-[0.26em] text-foreground">
            CoughSense
          </span>
        </a>

        <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
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

        <a
          href="#screening"
          className="rounded-full border border-primary/35 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/18"
        >
          Start Screening
        </a>
      </div>
    </motion.header>
  )
}
