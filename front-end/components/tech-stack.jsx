"use client"

import { MonitorSmartphone, Server, BrainCircuit } from "lucide-react"
import { SectionShell, SectionHeading, Reveal } from "@/components/section"

const groups = [
  {
    title: "Frontend",
    icon: MonitorSmartphone,
    items: ["Next.js", "React", "JavaScript", "HTML", "CSS"],
  },
  {
    title: "Backend",
    icon: Server,
    items: ["Python", "FastAPI", "REST API", "Render"],
  },
  {
    title: "AI",
    icon: BrainCircuit,
    items: ["PyTorch", "CNN", "MLP", "Librosa", "Mel spectrograms"],
  },
]

export default function TechStack() {
  return (
    <SectionShell id="stack">
      <SectionHeading
        eyebrow="Technology"
        title="What CoughSense is built on"
        align="center"
      />

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {groups.map((group, gi) => {
          const Icon = group.icon
          return (
            <Reveal key={group.title} delay={gi * 0.1}>
              <div className="glass flex h-full flex-col gap-5 rounded-3xl p-6 transition hover:border-primary/40">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
                    {group.title}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-lg border border-border bg-background/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/35 hover:text-foreground"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          )
        })}
      </div>
    </SectionShell>
  )
}
