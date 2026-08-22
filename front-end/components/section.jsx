"use client"

import { motion } from "framer-motion"

export function SectionShell({ id, children, className = "" }) {
  return (
    <section
      id={id}
      className={`relative mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 md:py-28 ${className}`}
    >
      {children}
    </section>
  )
}

export function SectionHeading({ eyebrow, title, description, align = "center" }) {
  const alignment = align === "left" ? "items-start text-left" : "items-center text-center"
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`flex flex-col gap-4 ${alignment}`}
    >
      {eyebrow ? (
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-primary/5 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="max-w-3xl text-balance text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </motion.div>
  )
}

export function Reveal({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
