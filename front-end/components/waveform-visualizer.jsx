"use client"

import { useEffect, useRef } from "react"

export default function WaveformVisualizer({
  mode = "idle",
  analyser = null,
  peaks = null,
  progress = 0,
  height = 96,
  barWidth = 3,
  gap = 2,
  className = "",
}) {
  const canvasRef = useRef(null)
  const rafRef = useRef(0)
  const phaseRef = useRef(0)
  const smoothRef = useRef([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    let dead = false

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = Math.max(1, Math.floor(rect.width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const freqData = analyser ? new Uint8Array(analyser.frequencyBinCount) : null

    const draw = () => {
      if (dead) return
      const rect = canvas.getBoundingClientRect()
      const w = rect.width
      const h = height
      ctx.clearRect(0, 0, w, h)

      const slot = barWidth + gap
      const count = Math.max(8, Math.floor(w / slot))
      const mid = h / 2

      if (smoothRef.current.length !== count) {
        smoothRef.current = new Array(count).fill(0.06)
      }
      const smooth = smoothRef.current

      phaseRef.current += 0.045

      for (let i = 0; i < count; i++) {
        let target = 0.06

        if (mode === "live" && analyser && freqData) {
          analyser.getByteFrequencyData(freqData)
          const bin = Math.floor((i / count) * (freqData.length * 0.65))
          target = Math.min(1, (freqData[bin] / 255) * 1.5 + 0.04)
        } else if (mode === "static" && peaks && peaks.length) {
          const p = peaks[Math.floor((i / count) * peaks.length)] ?? 0.05
          target = Math.max(0.05, p)
        } else {
          const x = i / count
          const env = Math.sin(Math.PI * x) ** 0.8
          target =
            (0.14 +
              0.13 * Math.sin(phaseRef.current + x * 9) +
              0.09 * Math.sin(phaseRef.current * 0.62 + x * 17 + 1.4) +
              0.06 * Math.sin(phaseRef.current * 1.31 + x * 4)) *
            env
          target = Math.max(0.045, target)
        }

        smooth[i] += (target - smooth[i]) * (mode === "static" ? 1 : 0.22)
        const barH = Math.max(2, smooth[i] * (h - 8))

        const played = mode === "static" && i / count <= progress
        const active = mode === "live" || played || mode === "idle"

        const grad = ctx.createLinearGradient(0, mid - barH / 2, 0, mid + barH / 2)
        if (active) {
          grad.addColorStop(0, "rgba(94, 234, 246, 0.95)")
          grad.addColorStop(0.5, "rgba(56, 208, 224, 0.85)")
          grad.addColorStop(1, "rgba(94, 234, 246, 0.95)")
        } else {
          grad.addColorStop(0, "rgba(148, 178, 196, 0.28)")
          grad.addColorStop(1, "rgba(148, 178, 196, 0.28)")
        }
        ctx.fillStyle = grad

        const x = i * slot + gap / 2
        const r = Math.min(barWidth / 2, barH / 2)
        ctx.beginPath()
        ctx.roundRect(x, mid - barH / 2, barWidth, barH, r)
        ctx.fill()
      }

      if (mode !== "static") {
        rafRef.current = requestAnimationFrame(draw)
      }
    }

    draw()
    if (mode === "static") {
      const id = setTimeout(draw, 60)
      return () => {
        dead = true
        clearTimeout(id)
        ro.disconnect()
        cancelAnimationFrame(rafRef.current)
      }
    }

    return () => {
      dead = true
      ro.disconnect()
      cancelAnimationFrame(rafRef.current)
    }
  }, [mode, analyser, peaks, progress, height, barWidth, gap])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height }}
      aria-hidden="true"
    />
  )
}
