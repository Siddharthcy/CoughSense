"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Check, Loader2 } from "lucide-react"
import WaveformVisualizer from "@/components/waveform-visualizer"

const STAGES = [
  "Receiving audio",
  "Processing waveform",
  "Generating Mel spectrogram",
  "Extracting acoustic features",
  "Analyzing contextual features",
  "Generating screening result",
]

export default function AnalysisProgress({ finished }) {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    if (stage >= STAGES.length - 1) return
    const delay = 620 + Math.random() * 380
    const id = setTimeout(() => setStage((s) => Math.min(STAGES.length - 1, s + 1)), delay)
    return () => clearTimeout(id)
  }, [stage])

  useEffect(() => {
    if (finished) setStage(STAGES.length - 1)
  }, [finished])

  const pct = Math.round(((stage + (finished ? 1 : 0.4)) / STAGES.length) * 100)

  return (
    <div className="glass relative mx-auto flex w-full max-w-3xl flex-col gap-8 overflow-hidden rounded-3xl p-6 sm:p-10">
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
      />

      <div className="flex flex-col gap-2 text-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">
          CoughSense engine
        </span>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Analyzing your cough
        </h2>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-background/40 p-4">
        <WaveformVisualizer mode="idle" height={72} barWidth={3} gap={2} />
        <SpectrogramScan />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
          <span>Pipeline</span>
          <span className="tabular-nums text-primary">{pct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-accent to-primary"
            initial={{ width: "4%" }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            style={{ boxShadow: "0 0 18px rgba(94,234,246,0.7)" }}
          />
        </div>
      </div>

      <ol className="flex flex-col gap-1.5">
        {STAGES.map((label, i) => {
          const done = i < stage || (finished && i <= stage)
          const active = i === stage && !finished
          return (
            <motion.li
              key={label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: i <= stage ? 1 : 0.35, x: 0 }}
              transition={{ duration: 0.4 }}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                active
                  ? "border-primary/40 bg-primary/[0.07] text-foreground"
                  : "border-transparent text-muted-foreground"
              }`}
            >
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                  done
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : active
                      ? "border-primary/50 text-primary"
                      : "border-border text-muted-foreground/60"
                }`}
              >
                {done ? (
                  <Check className="size-3" />
                ) : active ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <span className="size-1 rounded-full bg-current" />
                )}
              </span>
              <span className="font-mono text-xs sm:text-sm">{label}</span>
            </motion.li>
          )
        })}
      </ol>

      <p className="text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
        CoughSense is a screening aid, not a medical diagnosis.
      </p>
    </div>
  )
}

function SpectrogramScan() {
  const cols = 48
  const rows = 6
  return (
    <div
      aria-hidden="true"
      className="relative mt-3 grid gap-[2px] overflow-hidden rounded-lg"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: cols * rows }).map((_, idx) => {
        const col = idx % cols
        const row = Math.floor(idx / cols)
        return (
          <motion.span
            key={idx}
            className="h-1.5 rounded-[2px] bg-accent"
            initial={{ opacity: 0.06 }}
            animate={{ opacity: [0.06, 0.08 + ((rows - row) / rows) * 0.5, 0.06] }}
            transition={{
              duration: 1.8,
              repeat: Number.POSITIVE_INFINITY,
              delay: (col * 0.03 + row * 0.05) % 1.8,
              ease: "easeInOut",
            }}
          />
        )
      })}
      <motion.span
        className="pointer-events-none absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-primary/25 to-transparent"
        animate={{ x: ["-10%", "620%"] }}
        transition={{ duration: 2.6, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      />
    </div>
  )
}
