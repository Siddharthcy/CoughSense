"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useInView, animate } from "framer-motion"
import { SectionShell, SectionHeading, Reveal } from "@/components/section"

const metrics = [
  { label: "Precision", value: 86.84, suffix: "%" },
  { label: "Recall", value: 66.0, suffix: "%" },
  { label: "F1-score", value: 75.0, suffix: "%" },
  { label: "ROC-AUC", value: 81.69, suffix: "%" },
]

const matrix = [
  { label: "True Negative", value: 363, tone: "good" },
  { label: "False Positive", value: 25, tone: "warn" },
  { label: "False Negative", value: 85, tone: "warn" },
  { label: "True Positive", value: 165, tone: "good" },
]

function Counter({ to, decimals = 0, suffix = "" }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, to, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setVal(v),
    })
    return () => controls.stop()
  }, [inView, to])

  return (
    <span ref={ref} className="font-mono text-3xl font-semibold tabular-nums text-foreground sm:text-4xl">
      {val.toFixed(decimals)}
      <span className="text-primary">{suffix}</span>
    </span>
  )
}

export default function ModelResults() {
  return (
    <SectionShell id="results">
      <SectionHeading
        eyebrow="Prototype evaluation"
        title="Measured performance on a held-out set"
        description="Evaluated against 638 test samples with known labels. These figures describe prototype behavior only."
      />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m, i) => (
          <Reveal key={m.label} delay={i * 0.08}>
            <div className="glass group relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl p-6 transition hover:border-primary/40">
              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
              />
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {m.label}
              </p>
              <Counter to={m.value} decimals={m.value % 1 === 0 ? 0 : 2} suffix={m.suffix} />
              <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-primary"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${m.value}%` }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 1.3, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Reveal>
          <div className="glass flex h-full flex-col gap-5 rounded-3xl p-6 sm:p-8">
            <div className="flex flex-col gap-1">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
                Confusion matrix
              </p>
              <p className="text-sm text-muted-foreground">638 labeled test samples</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {matrix.map((cell, i) => (
                <motion.div
                  key={cell.label}
                  initial={{ opacity: 0, scale: 0.94 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className={`flex flex-col gap-1.5 rounded-2xl border p-4 ${
                    cell.tone === "good"
                      ? "border-primary/30 bg-primary/[0.07]"
                      : "border-caution/25 bg-caution/[0.06]"
                  }`}
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    {cell.label}
                  </span>
                  <span
                    className={`font-mono text-2xl font-semibold tabular-nums ${
                      cell.tone === "good" ? "text-primary" : "text-caution"
                    }`}
                  >
                    <Counter to={cell.value} />
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="glass flex h-full flex-col justify-between gap-6 rounded-3xl p-6 sm:p-8">
            <div className="flex flex-col gap-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
                Reading these numbers
              </p>
              <ul className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
                <li>
                  High precision means most elevated flags corresponded to labeled positives in the
                  held-out set.
                </li>
                <li>
                  Recall of 66% means the prototype missed a meaningful share of labeled positives —
                  a low score is never a clearance.
                </li>
                <li>
                  Scores describe recorded audio patterns only and cannot attribute a cause.
                </li>
              </ul>
            </div>
            <p className="rounded-xl border border-border bg-background/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
              Prototype evaluation on a held-out dataset; not clinical validation.
            </p>
          </div>
        </Reveal>
      </div>
    </SectionShell>
  )
}
