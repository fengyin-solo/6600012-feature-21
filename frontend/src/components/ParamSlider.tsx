import { useRef, useEffect } from 'react'
import { useSimStore } from '../store/simulation'

interface MetricBadge {
  key: 'avgSpeed' | 'avgSpread' | 'stability'
  label: string
  color: string
}

interface ParamSliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  accent: string
  formatValue: (v: number) => string
  onChange: (v: number) => void
  relatedMetrics: MetricBadge[]
}

function colorToRGBA(rgb: string, alpha: number): string {
  const m = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  if (!m) return rgb
  return `rgba(${m[1]},${m[2]},${m[3]},${alpha})`
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length < 2) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    const dpr = window.devicePixelRatio || 1
    canvas.style.width = `${w / dpr}px`
    canvas.style.height = `${h / dpr}px`

    ctx.clearRect(0, 0, w, h)

    const minV = Math.min(...data)
    const maxV = Math.max(...data)
    const range = maxV - minV || 1

    ctx.beginPath()
    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * w
      const y = h - ((v - minV) / range) * h * 0.8 - h * 0.1
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5 * dpr
    ctx.stroke()

    const lastX = w
    const lastY = h - ((data[data.length - 1] - minV) / range) * h * 0.8 - h * 0.1
    ctx.beginPath()
    ctx.arc(lastX, lastY, 2 * dpr, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()

    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, colorToRGBA(color, 0.15))
    grad.addColorStop(1, colorToRGBA(color, 0))
    ctx.beginPath()
    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * w
      const y = h - ((v - minV) / range) * h * 0.8 - h * 0.1
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.lineTo(w, h)
    ctx.lineTo(0, h)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()
  }, [data, color])

  const dpr = window.devicePixelRatio || 1
  return (
    <canvas
      ref={canvasRef}
      width={80 * dpr}
      height={24 * dpr}
      className="rounded"
    />
  )
}

function getTrend(data: number[]): 'up' | 'down' | 'stable' {
  if (data.length < 4) return 'stable'
  const recent = data.slice(-4)
  const diff = recent[recent.length - 1] - recent[0]
  const range = Math.max(...data) - Math.min(...data) || 1
  if (diff / range > 0.1) return 'up'
  if (diff / range < -0.1) return 'down'
  return 'stable'
}

const TREND_ICON = { up: '↑', down: '↓', stable: '→' }
const TREND_COLOR = { up: 'text-red-400', down: 'text-green-400', stable: 'text-gray-400' }

export default function ParamSlider({
  label, value, min, max, step, accent, formatValue, onChange, relatedMetrics,
}: ParamSliderProps) {
  const metricsHistory = useSimStore(s => s.metricsHistory)
  const metrics = useSimStore(s => s.metrics)

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      const direction = e.deltaY < 0 ? 1 : -1
      const next = Math.min(max, Math.max(min, value + step * direction))
      if (next !== value) onChange(next)
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [value, min, max, step, onChange])

  return (
    <div className="bg-gray-800/60 rounded-lg p-2.5 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs font-mono font-bold" style={{ color: accent }}>
          {formatValue(value)}
        </span>
      </div>

      <input
        ref={inputRef}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: accent }}
      />

      <div className="space-y-1">
        {relatedMetrics.map(m => {
          const history = metricsHistory[m.key]
          const current = metrics[m.key]
          const trend = getTrend(history)
          return (
            <div key={m.key} className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 w-10 shrink-0">{m.label}</span>
              <MiniSparkline data={history} color={m.color} />
              <span className="text-[10px] font-mono w-8 text-right" style={{ color: m.color }}>
                {current.toFixed(2)}
              </span>
              <span className={`text-[10px] ${TREND_COLOR[trend]}`}>
                {TREND_ICON[trend]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
