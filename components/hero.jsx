"use client"

import { motion } from "framer-motion"
import { Activity, AudioLines, Cpu, ArrowRight } from "lucide-react"
import WaveformVisualizer from "@/components/waveform-visualizer"

const badges = [
  { label: "AI-Assisted", icon: Cpu },
  { label: "Audio Analysis", icon: AudioLines },
  { label: "Real-Time Screening", icon: Activity },
]

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] },
  }),
}

export default function Hero({ onStart, onHowItWorks }) {
  return (
    <section className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden px-5 pb-16 pt-28 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-12 text-center">
        <motion.p
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="font-mono text-xs uppercase tracking-[0.4em] text-primary"
        >
          Respiratory Pre-Screening
        </motion.p>

        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="max-w-4xl text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Listen to your cough.{" "}
          <span className="text-glow bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Screen smarter.
          </span>
        </motion.h1>

        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg"
        >
          AI-assisted respiratory pre-screening using cough audio and contextual information.
        </motion.p>

        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row"
        >
          <button
            type="button"
            onClick={onStart}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:w-auto"
            style={{ boxShadow: "0 12px 40px -12px rgba(94,234,246,0.55)" }}
          >
            Start Screening
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <button
            type="button"
            onClick={onHowItWorks}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card/40 px-7 py-3.5 text-sm font-medium text-foreground backdrop-blur transition hover:border-primary/40 hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:w-auto"
          >
            How It Works
          </button>
        </motion.div>

        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="relative w-full"
        >
          <div className="glass relative overflow-hidden rounded-3xl p-5 sm:p-8">
            <div className="flex flex-col gap-1 text-left">
              <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-primary">
                Live signal preview
              </span>
              <span className="text-sm text-muted-foreground">
                Cough waveform → Mel spectrogram representation
              </span>
            </div>

            <div className="mt-6">
              <WaveformVisualizer mode="idle" height={120} barWidth={4} gap={3} />
            </div>

            <SpectrogramStrip />

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {badges.map(({ label, icon: Icon }, i) => (
                <motion.span
                  key={label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + i * 0.1, duration: 0.5 }}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-3.5 py-1.5 text-xs font-medium text-muted-foreground"
                >
                  <Icon className="size-3.5 text-primary" />
                  {label}
                </motion.span>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.p
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground/80"
        >
          CoughSense is a screening aid, not a medical diagnosis.
        </motion.p>
      </div>
    </section>
  )
}

function SpectrogramStrip() {
  const cols = 64
  const rows = 8
  return (
    <div
      aria-hidden="true"
      className="mt-5 grid gap-[2px] overflow-hidden rounded-xl border border-border/60 bg-background/40 p-2"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: cols * rows }).map((_, idx) => {
        const col = idx % cols
        const row = Math.floor(idx / cols)
        return (
          <motion.span
            key={idx}
            className="h-1.5 rounded-[2px] bg-primary"
            initial={{ opacity: 0.05 }}
            animate={{ opacity: [0.05, 0.06 + ((rows - row) / rows) * 0.55, 0.05] }}
            transition={{
              duration: 2.4,
              repeat: Number.POSITIVE_INFINITY,
              delay: (col * 0.035 + row * 0.06) % 2.4,
              ease: "easeInOut",
            }}
          />
        )
      })}
    </div>
  )
}
