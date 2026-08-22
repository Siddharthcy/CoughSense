"use client"

import { ShieldAlert } from "lucide-react"
import { Reveal } from "@/components/section"

export default function Disclaimer() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-8 sm:px-8">
      <Reveal>
        <div className="flex flex-col gap-4 rounded-3xl border border-caution/25 bg-caution/[0.05] p-6 sm:flex-row sm:items-start sm:gap-5 sm:p-8">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-caution/12 text-caution">
            <ShieldAlert className="size-5" />
          </span>
          <div className="flex flex-col gap-2">
            <p className="text-base font-semibold tracking-tight text-foreground">
              CoughSense is a screening aid, not a medical diagnosis.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Results describe patterns detected in a recorded cough sample and the contextual
              answers provided. The cause of any signal cannot be determined from this screening, and
              a low score is not a clearance. Always consult a qualified healthcare professional
              about respiratory symptoms, and seek urgent care for severe breathlessness, chest pain,
              or other emergency symptoms.
            </p>
          </div>
        </div>
      </Reveal>
    </div>
  )
}
