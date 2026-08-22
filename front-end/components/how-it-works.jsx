"use client"

import { motion } from "framer-motion"
import { AudioLines, Grid2x2, Layers, Sliders, Network, Gauge } from "lucide-react"
import { SectionShell, SectionHeading, Reveal } from "@/components/section"

const audioBranch = [
  { label: "Cough Audio", detail: "Recorded or uploaded sample", icon: AudioLines },
  { label: "Mel Spectrogram", detail: "128 Mel bands · 256 time frames", icon: Grid2x2 },
  { label: "CNN", detail: "Convolutional audio encoder", icon: Layers },
  { label: "Audio Features", detail: "Learned acoustic embedding", icon: Sliders },
]

const contextBranch = [
  { label: "Age + Gender + Smoking", detail: "Contextual inputs", icon: Sliders },
  { label: "MLP", detail: "Metadata encoder", icon: Layers },
  { label: "Context Features", detail: "Learned context embedding", icon: Sliders },
]

const specs = [
  "128 Mel bands",
  "Fixed 256 time-frame representation",
  "CNN audio branch",
  "MLP metadata branch",
  "Feature fusion layer",
  "Single respiratory screening output",
]

function Node({ item, index }) {
  const Icon = item.icon
  return (
    <Reveal delay={index * 0.08}>
      <div className="group flex items-center gap-4 rounded-2xl border border-border bg-card/40 p-4 backdrop-blur transition hover:border-primary/40 hover:bg-primary/[0.05]">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary transition group-hover:bg-primary/20">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{item.label}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
        </div>
      </div>
    </Reveal>
  )
}

function Connector() {
  return (
    <div aria-hidden="true" className="flex justify-center py-1.5">
      <div className="relative h-6 w-px overflow-hidden bg-border">
        <motion.span
          className="absolute inset-x-0 h-3 bg-primary"
          animate={{ y: ["-100%", "300%"] }}
          transition={{ duration: 1.6, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />
      </div>
    </div>
  )
}

function Branch({ title, items }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        {title}
      </p>
      {items.map((item, i) => (
        <div key={item.label}>
          <Node item={item} index={i} />
          {i < items.length - 1 ? <Connector /> : null}
        </div>
      ))}
    </div>
  )
}

export default function HowItWorks() {
  return (
    <SectionShell id="how-it-works" className="scroll-mt-20">
      <SectionHeading
        eyebrow="How it works"
        title="Two signal branches, fused into one screening score"
        description="CoughSense encodes the cough audio and the contextual answers separately, then fuses both representations to produce a single respiratory concern score."
      />

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <Branch title="Audio branch" items={audioBranch} />
        <Branch title="Context branch" items={contextBranch} />
      </div>

      <div className="mt-8 flex flex-col items-center gap-2">
        <Connector />
        <Reveal className="w-full">
          <div className="glow-ring flex flex-col items-center gap-4 rounded-3xl border border-primary/25 bg-primary/[0.06] p-6 text-center sm:p-8">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Network className="size-6" />
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-lg font-semibold tracking-tight text-foreground">Feature Fusion</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Audio features + context features combined in a joint representation
              </p>
            </div>
            <Connector />
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/50 px-5 py-3">
              <Gauge className="size-5 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Respiratory Concern Score
              </span>
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.1} className="mt-10">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {specs.map((spec) => (
            <div
              key={spec}
              className="rounded-xl border border-border bg-background/30 px-4 py-3 font-mono text-xs text-muted-foreground"
            >
              {spec}
            </div>
          ))}
        </div>
      </Reveal>
    </SectionShell>
  )
}
