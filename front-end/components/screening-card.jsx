"use client"

import { useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, Sparkles } from "lucide-react"
import AudioInput from "@/components/audio-input"
import UserMetadataForm from "@/components/user-metadata-form"
import AnalysisProgress from "@/components/analysis-progress"
import ResultCard from "@/components/result-card"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function ScreeningCard() {
  const [phase, setPhase] = useState("form") // form | analyzing | result
  const [audio, setAudio] = useState(null)
  const [meta, setMeta] = useState({ age: "", gender: "", smoker: "" })
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [responseReady, setResponseReady] = useState(false)
  const sectionRef = useRef(null)

  const scrollHere = () => {
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const validate = () => {
    if (!audio) return "Please record or upload a cough audio file before analyzing."
    const age = Number(meta.age)
    if (!meta.age) return "Please enter your age."
    if (!Number.isFinite(age) || !Number.isInteger(age) || age < 1 || age > 120)
      return "Please enter a valid age between 1 and 120."
    if (!meta.gender) return "Please select a gender option."
    if (!meta.smoker) return "Please select a smoking status option."
    return null
  }

  const analyze = async () => {
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    if (!API_URL) {
      setError(
        "The screening service is not configured yet. Set NEXT_PUBLIC_API_URL to your CoughSense API address and try again.",
      )
      return
    }

    setError(null)
    setResult(null)
    setResponseReady(false)
    setPhase("analyzing")
    scrollHere()

    const startedAt = Date.now()

    try {
      const form = new FormData()
      form.append("audio", audio.blob, audio.name || "cough.webm")
      form.append("age", String(Number(meta.age)))
      form.append("gender", meta.gender)
      form.append("smoker", meta.smoker)

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 60000)

      const res = await fetch(`${API_URL.replace(/\/$/, "")}/predict`, {
        method: "POST",
        body: form,
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (!res.ok) {
        throw new Error(res.status === 413 ? "too-large" : "bad-response")
      }

      const data = await res.json()
      // Normalize server payloads: older Flask backend returns { result: { probability } }
      // newer FastAPI backend may return { concerning, confidence } (confidence is 0-100).
      const payload = data?.result ?? data

      // Derive a canonical probability (0.0 - 1.0) from available fields.
      let probability = null
      if (payload && typeof payload.probability === "number" && Number.isFinite(payload.probability)) {
        probability = payload.probability
        // If backend returned a percentage in 0-100, convert to 0-1
        if (probability > 1) probability = probability / 100.0
      } else if (payload && typeof payload.confidence === "number" && Number.isFinite(payload.confidence)) {
        probability = payload.confidence / 100.0
      } else if (payload && typeof payload.probability === "string" && !Number.isNaN(Number(payload.probability))) {
        probability = Number(payload.probability)
        if (probability > 1) probability = probability / 100.0
      }

      if (probability === null || !Number.isFinite(probability)) {
        throw new Error("bad-payload")
      }

      // Attach the normalized probability back onto the payload for downstream UI components.
      payload.probability = Math.min(1, Math.max(0, probability))

      setResponseReady(true)
      const elapsed = Date.now() - startedAt
      const wait = Math.max(0, 3400 - elapsed)
      setTimeout(() => {
        setResult(payload)
        setPhase("result")
        scrollHere()
      }, wait)
    } catch (err) {
      const friendly =
        err?.name === "AbortError"
          ? "The screening service took too long to respond. Please try again."
          : err?.message === "too-large"
            ? "That audio file was rejected as too large. Please use a shorter recording."
            : err?.message === "bad-payload"
              ? "The screening service returned an unexpected response. Please try again."
              : "We could not reach the screening service. Please check your connection and try again."
      setError(friendly)
      setPhase("form")
      scrollHere()
    }
  }

  const restart = () => {
    setResult(null)
    setResponseReady(false)
    setAudio(null)
    setError(null)
    setPhase("form")
    scrollHere()
  }

  const disabled = phase === "analyzing"

  return (
    <section
      id="screening"
      ref={sectionRef}
      className="relative mx-auto w-full max-w-4xl scroll-mt-20 px-5 py-20 sm:px-8 md:py-28"
    >
      <AnimatePresence mode="wait">
        {phase === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="glass relative overflow-hidden rounded-3xl p-6 sm:p-10"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
            />

            <div className="flex flex-col gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">
                Step 1 — 3
              </span>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Respiratory Screening
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Record or upload a cough and provide a few basic details.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-8">
              <AudioInput
                audio={audio}
                onChange={setAudio}
                onError={setError}
                disabled={disabled}
              />

              <div className="h-px w-full bg-border" />

              <UserMetadataForm values={meta} onChange={setMeta} disabled={disabled} />

              <AnimatePresence>
                {error ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <p
                      role="alert"
                      className="flex items-start gap-2.5 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm leading-relaxed text-foreground"
                    >
                      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                      {error}
                    </p>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <button
                type="button"
                onClick={analyze}
                disabled={disabled}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
                style={{ boxShadow: "0 14px 44px -14px rgba(94,234,246,0.6)" }}
              >
                <Sparkles className="size-4" />
                Analyze Cough
              </button>

              <p className="text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
                CoughSense is a screening aid, not a medical diagnosis.
              </p>
            </div>
          </motion.div>
        )}

        {phase === "analyzing" && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <AnalysisProgress finished={responseReady} />
          </motion.div>
        )}

        {phase === "result" && result && (
          <motion.div key="result">
            <ResultCard
              result={result}
              onRestart={restart}
              onHome={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
