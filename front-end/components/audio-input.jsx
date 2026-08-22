"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, Square, Upload, Play, Pause, Trash2, AudioLines } from "lucide-react"
import WaveformVisualizer from "@/components/waveform-visualizer"

const ACCEPTED = ["audio/wav", "audio/x-wav", "audio/wave", "audio/mpeg", "audio/mp3", "audio/webm", "audio/ogg", "audio/mp4", "audio/m4a", "audio/x-m4a", "audio/flac"]
const MAX_BYTES = 15 * 1024 * 1024

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00"
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, "0")}`
}

function formatBytes(bytes) {
  if (!bytes) return ""
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function computePeaks(blob, buckets = 96) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return null
    const ctx = new Ctx()
    const buffer = await ctx.decodeAudioData(await blob.arrayBuffer())
    const data = buffer.getChannelData(0)
    const size = Math.floor(data.length / buckets) || 1
    const peaks = []
    let max = 0.0001
    for (let i = 0; i < buckets; i++) {
      let sum = 0
      const start = i * size
      for (let j = 0; j < size; j++) {
        const v = data[start + j] || 0
        sum += v * v
      }
      const rms = Math.sqrt(sum / size)
      max = Math.max(max, rms)
      peaks.push(rms)
    }
    ctx.close()
    return peaks.map((p) => Math.min(1, (p / max) * 0.95))
  } catch {
    return null
  }
}

export default function AudioInput({ audio, onChange, onError, disabled }) {
  const [isRecording, setIsRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [analyser, setAnalyser] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragging, setDragging] = useState(false)

  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const audioCtxRef = useRef(null)
  const timerRef = useRef(null)
  const audioElRef = useRef(null)
  const fileInputRef = useRef(null)

  const stopStream = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }
    setAnalyser(null)
  }, [])

  useEffect(() => stopStream, [stopStream])

  const acceptBlob = useCallback(
    async (blob, name, durationHint) => {
      const peaks = await computePeaks(blob)
      const url = URL.createObjectURL(blob)
      let duration = durationHint || 0
      if (!duration) {
        duration = await new Promise((resolve) => {
          const el = new Audio()
          el.preload = "metadata"
          el.onloadedmetadata = () =>
            resolve(Number.isFinite(el.duration) ? el.duration : 0)
          el.onerror = () => resolve(0)
          el.src = url
        })
      }
      onChange({ blob, name, url, duration, peaks, size: blob.size })
      setProgress(0)
      setIsPlaying(false)
    },
    [onChange],
  )

  const startRecording = async () => {
    if (disabled) return
    onError(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      onError("Recording is not supported in this browser. Please upload an audio file instead.")
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const Ctx = window.AudioContext || window.webkitAudioContext
      const ctx = new Ctx()
      audioCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const node = ctx.createAnalyser()
      node.fftSize = 512
      node.smoothingTimeConstant = 0.7
      source.connect(node)
      setAnalyser(node)

      const recorder = new MediaRecorder(stream)
      const chunks = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }
      recorder.onstop = async () => {
        const type = recorder.mimeType || "audio/webm"
        const blob = new Blob(chunks, { type })
        const ext = type.includes("ogg") ? "ogg" : type.includes("mp4") ? "m4a" : "webm"
        stopStream()
        setIsRecording(false)
        if (blob.size < 1200) {
          onError("That recording was too short. Please record a clear cough for at least 1 second.")
          return
        }
        await acceptBlob(blob, `cough-recording.${ext}`, elapsed)
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setElapsed(0)
      setIsRecording(true)
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)
    } catch {
      stopStream()
      setIsRecording(false)
      onError("Microphone access was blocked. Allow microphone permission or upload an audio file.")
    }
  }

  const stopRecording = () => {
    try {
      mediaRecorderRef.current?.stop()
    } catch {
      stopStream()
      setIsRecording(false)
    }
  }

  const handleFiles = async (files) => {
    onError(null)
    const file = files?.[0]
    if (!file) return
    const isAudio = file.type ? file.type.startsWith("audio/") || ACCEPTED.includes(file.type) : /\.(wav|mp3|m4a|ogg|webm|flac)$/i.test(file.name)
    if (!isAudio) {
      onError("That file type is not supported. Please use WAV, MP3, M4A, OGG, or WEBM audio.")
      return
    }
    if (file.size > MAX_BYTES) {
      onError("That file is too large. Please upload an audio file under 15 MB.")
      return
    }
    await acceptBlob(file, file.name)
  }

  const reset = () => {
    if (audio?.url) URL.revokeObjectURL(audio.url)
    onChange(null)
    setIsPlaying(false)
    setProgress(0)
    onError(null)
  }

  const togglePlay = () => {
    const el = audioElRef.current
    if (!el) return
    if (el.paused) {
      el.play().catch(() => onError("This audio file could not be played back."))
    } else {
      el.pause()
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (!disabled) handleFiles(e.dataTransfer.files)
        }}
        className={`relative overflow-hidden rounded-2xl border border-dashed p-5 transition-colors sm:p-7 ${
          dragging
            ? "border-primary/70 bg-primary/[0.07]"
            : "border-border bg-background/30"
        } ${disabled ? "opacity-60" : ""}`}
      >
        <AnimatePresence mode="wait">
          {audio ? (
            <motion.div
              key="loaded"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col gap-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <AudioLines className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{audio.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {formatTime(audio.duration)}
                      {audio.size ? ` · ${formatBytes(audio.size)}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={togglePlay}
                    disabled={disabled}
                    aria-label={isPlaying ? "Pause recording" : "Play recording"}
                    className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-card/60 text-foreground transition hover:border-primary/40 hover:text-primary disabled:opacity-50"
                  >
                    {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    disabled={disabled}
                    aria-label="Delete recording"
                    className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-card/60 text-muted-foreground transition hover:border-destructive/50 hover:text-destructive disabled:opacity-50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              <WaveformVisualizer
                mode="static"
                peaks={audio.peaks}
                progress={progress}
                height={80}
              />

              <audio
                ref={audioElRef}
                src={audio.url}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => {
                  setIsPlaying(false)
                  setProgress(0)
                }}
                onTimeUpdate={(e) => {
                  const el = e.currentTarget
                  if (el.duration) setProgress(el.currentTime / el.duration)
                }}
                className="hidden"
              />
            </motion.div>
          ) : isRecording ? (
            <motion.div
              key="recording"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-5"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2.5 text-sm font-medium text-foreground">
                  <motion.span
                    className="size-2.5 rounded-full bg-destructive"
                    animate={{ opacity: [1, 0.25, 1], scale: [1, 0.85, 1] }}
                    transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY }}
                  />
                  Recording...
                </span>
                <span className="font-mono text-sm tabular-nums text-primary">
                  {formatTime(elapsed)}
                </span>
              </div>
              <WaveformVisualizer mode="live" analyser={analyser} height={88} />
              <button
                type="button"
                onClick={stopRecording}
                className="inline-flex items-center justify-center gap-2 self-center rounded-full bg-destructive px-6 py-3 text-sm font-semibold text-destructive-foreground transition hover:brightness-110"
              >
                <Square className="size-3.5" />
                Stop Recording
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-5 py-2 text-center"
            >
              <div className="relative">
                <motion.span
                  className="absolute inset-0 rounded-full bg-primary/20"
                  animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                  transition={{ duration: 2.2, repeat: Number.POSITIVE_INFINITY, ease: "easeOut" }}
                />
                <span className="relative flex size-16 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
                  <Mic className="size-7" />
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-foreground">
                  Record a cough or drop an audio file here
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  WAV, MP3, M4A, OGG or WEBM · up to 15 MB · 2–8 seconds works best
                </p>
              </div>
              <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={disabled}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
                >
                  <Mic className="size-4" />
                  Record Cough
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card/50 px-6 py-3 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50"
                >
                  <Upload className="size-4" />
                  Upload Audio
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="sr-only"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ""
        }}
      />
    </div>
  )
}
