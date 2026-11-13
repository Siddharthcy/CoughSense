"use client"

import { useEffect, useState } from "react"
import { motion, useMotionValue, animate } from "framer-motion"
import { RotateCcw, Home, Info, Stethoscope, ShieldCheck } from "lucide-react"

const DISCLAIMER = "CoughSense is a screening aid, not a medical diagnosis."
const UNDETERMINED = "Cause cannot be determined from this screening."

function ProbabilityMeter({ probability }) {
  const pct = Math.round(probability * 100)
  const size = 232
  const stroke = 12
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const [display, setDisplay] = useState(0)
  const mv = useMotionValue(0)

  useEffect(() => {
    const controls = animate(mv, pct, {
      duration: 1.5,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [pct, mv])

  const elevated = probability >= 0.5
  const strokeColor = elevated ? "var(--caution)" : "var(--primary)"

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <motion.div
        aria-hidden="true"
        className="absolute inset-4 rounded-full"
        style={{
          background: elevated
            ? "radial-gradient(circle, oklch(0.82 0.13 78 / 18%) 0%, transparent 70%)"
            : "radial-gradient(circle, oklch(0.82 0.13 195 / 18%) 0%, transparent 70%)",
        }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
      />
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--secondary)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - probability) }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: "drop-shadow(0 0 10px rgba(94,234,246,0.5))" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center gap-1">
        <span className="font-mono text-5xl font-semibold tabular-nums text-foreground">
          {display}%
        </span>
        <span className="max-w-[9rem] text-center text-xs leading-relaxed text-muted-foreground">
          Respiratory concern probability
        </span>
      </div>
    </div>
  )
}

export default function ResultCard({ result, onRestart, onHome }) {
  const probability =
    typeof result?.probability === "number" && Number.isFinite(result.probability)
      ? Math.min(1, Math.max(0, result.probability))
      : 0
  const elevated = probability >= 0.5

  const title = elevated
    ? "Further medical evaluation is recommended."
    : "No strong recorded respiratory indicators detected."

  const recommendation =
    result?.recommendation ||
    (elevated
      ? "Further medical evaluation is recommended."
      : "No urgent recorded indicators. Continue to monitor your symptoms.")

  const message = result?.message || `Probability of recorded respiratory concern: ${probability.toFixed(2)}. ${UNDETERMINED}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto flex w-full max-w-3xl flex-col gap-8"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">
          CoughSense output
        </span>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Screening Result
        </h2>
      </div>

      <div className="glass relative overflow-hidden rounded-3xl p-6 sm:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent"
        />

        <div className="flex flex-col items-center gap-8 md:flex-row md:items-center md:gap-10">
          <ProbabilityMeter probability={probability} />

          <div className="flex flex-1 flex-col gap-5 text-center md:text-left">
            <span
              className={`inline-flex items-center justify-center gap-2 self-center rounded-full border px-3.5 py-1.5 text-xs font-medium md:self-start ${
                elevated
                  ? "border-caution/40 bg-caution/10 text-caution"
                  : "border-primary/40 bg-primary/10 text-primary"
              }`}
            >
              {elevated ? <Stethoscope className="size-3.5" /> : <ShieldCheck className="size-3.5" />}
              {elevated ? "Elevated recorded signal" : "Low recorded signal"}
            </span>

            <h3 className="text-balance text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-2xl">
              {title}
            </h3>

            <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{message}</p>

            <div className="rounded-2xl border border-border bg-background/40 p-4 text-left">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Recommendation
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{recommendation}</p>
            </div>

            <p className="flex items-start gap-2 text-left text-xs leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
              {UNDETERMINED} This screening does not identify any specific condition.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row">
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
          >
            <RotateCcw className="size-4" />
            Analyze Another Recording
          </button>
          <button
            type="button"
            onClick={onHome}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-card/50 px-6 py-3 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/5"
          >
            <Home className="size-4" />
            Return Home
          </button>
        </div>
      </div>

      <p className="text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
        {result?.disclaimer || DISCLAIMER}
      </p>
    </motion.div>
  )
}
