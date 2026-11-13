"use client"

import { motion } from "framer-motion"
import {
  User,
  MonitorSmartphone,
  ArrowDown,
  Server,
  Waves,
  BrainCircuit,
  Gauge,
  Braces,
  LayoutDashboard,
  Cloud,
} from "lucide-react"
import { SectionShell, SectionHeading, Reveal } from "@/components/section"

const flow = [
  { label: "User", detail: "Records or uploads a cough", icon: User, zone: "client" },
  { label: "Next.js Frontend", detail: "React UI, validation, state", icon: MonitorSmartphone, zone: "client" },
  { label: "POST /predict", detail: "multipart/form-data · audio, age, gender, smoker", icon: Braces, zone: "wire" },
  { label: "FastAPI REST API", detail: "Hosted on Render", icon: Server, zone: "server" },
  { label: "Audio preprocessing", detail: "Resample · Mel spectrogram", icon: Waves, zone: "server" },
  { label: "CoughSense Model", detail: "CNN + MLP feature fusion", icon: BrainCircuit, zone: "server" },
  { label: "Respiratory concern probability", detail: "Single scalar output", icon: Gauge, zone: "server" },
  { label: "JSON Response", detail: "probability · recommendation · message", icon: Braces, zone: "wire" },
  { label: "Frontend Result", detail: "Animated screening result view", icon: LayoutDashboard, zone: "client" },
]

const zoneStyles = {
  client: "border-border bg-card/40",
  wire: "border-primary/30 bg-primary/[0.07]",
  server: "border-border bg-background/40",
}

export default function ArchitectureDiagram() {
  return (
    <SectionShell id="architecture">
      <SectionHeading
        eyebrow="Deployment"
        title="Frontend on Vercel, model service on Render"
        description="The browser never runs the model. Every screening is a single request to the FastAPI service that owns preprocessing and inference."
      />

      <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col">
          {flow.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={step.label}>
                <Reveal delay={i * 0.05}>
                  <div
                    className={`flex items-center gap-4 rounded-2xl border p-4 backdrop-blur transition hover:border-primary/40 ${zoneStyles[step.zone]}`}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{step.label}</p>
                      <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
                        {step.detail}
                      </p>
                    </div>
                    <span className="hidden shrink-0 rounded-full border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:inline">
                      {step.zone === "wire" ? "network" : step.zone}
                    </span>
                  </div>
                </Reveal>
                {i < flow.length - 1 ? (
                  <div aria-hidden="true" className="flex items-center gap-2 py-2 pl-9">
                    <div className="relative h-5 w-px overflow-hidden bg-border">
                      <motion.span
                        className="absolute inset-x-0 h-2.5 bg-primary"
                        animate={{ y: ["-120%", "320%"] }}
                        transition={{
                          duration: 1.4,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "linear",
                          delay: i * 0.12,
                        }}
                      />
                    </div>
                    <ArrowDown className="size-3 text-border" />
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>

        <Reveal delay={0.15}>
          <div className="glass sticky top-8 flex flex-col gap-5 rounded-3xl p-6">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <Cloud className="size-5" />
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-base font-semibold tracking-tight text-foreground">
                Hosting topology
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                The API base URL is supplied through an environment variable, so the same frontend
                build points at local, staging, or production model services.
              </p>
            </div>
            <dl className="flex flex-col gap-3 border-t border-border pt-4 font-mono text-xs">
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted-foreground">Frontend</dt>
                <dd className="text-right text-foreground">Next.js</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted-foreground">Model service</dt>
                <dd className="text-right text-foreground">FastAPI on Render</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted-foreground">Endpoint</dt>
                <dd className="text-right text-foreground">POST /predict</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted-foreground">Config</dt>
                <dd className="text-right text-foreground">NEXT_PUBLIC_API_URL</dd>
              </div>
            </dl>
          </div>
        </Reveal>
      </div>
    </SectionShell>
  )
}
