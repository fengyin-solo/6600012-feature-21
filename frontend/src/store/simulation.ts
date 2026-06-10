import { create } from 'zustand'
import type { SimMode, SimulationParams, Particle, SimMetrics } from '../types'
import { METRICS_HISTORY_LEN } from '../types'

const COLORS = ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#c084fc','#f472b6','#38bdf8']

function randomParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    position: [
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20,
    ] as [number, number, number],
    velocity: [
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
    ] as [number, number, number],
    mass: 0.5 + Math.random() * 2,
    color: COLORS[i % COLORS.length],
    radius: 0.15 + Math.random() * 0.35,
  }))
}

type MetricsHistory = {
  avgSpeed: number[]
  avgSpread: number[]
  stability: number[]
}

interface SimStore extends SimulationParams {
  particles: Particle[]
  fps: number
  totalEnergy: number
  metrics: SimMetrics
  metricsHistory: MetricsHistory
  setMode: (mode: SimMode) => void
  setParticleCount: (count: number) => void
  setParam: <K extends keyof SimulationParams>(key: K, value: SimulationParams[K]) => void
  reset: () => void
  setFps: (fps: number) => void
  setTotalEnergy: (e: number) => void
  updateMetrics: (m: SimMetrics) => void
  applyPreset: (preset: Partial<SimulationParams>) => void
}

function pushHistory(arr: number[], val: number): number[] {
  const next = [...arr, val]
  return next.length > METRICS_HISTORY_LEN ? next.slice(-METRICS_HISTORY_LEN) : next
}

export const useSimStore = create<SimStore>((set, get) => ({
  mode: 'gravity',
  particleCount: 300,
  gravity: 9.8,
  damping: 0.02,
  bounce: 0.7,
  attractorStrength: 5,
  slowMotion: false,
  paused: false,
  particles: randomParticles(300),
  fps: 0,
  totalEnergy: 0,
  metrics: { avgSpeed: 0, avgSpread: 0, stability: 0 },
  metricsHistory: { avgSpeed: [], avgSpread: [], stability: [] },
  setMode: (mode) => set({ mode }),
  setParticleCount: (count) => set({ particleCount: count, particles: randomParticles(count) }),
  setParam: (key, value) => set({ [key]: value } as any),
  reset: () => {
    const { particleCount } = get()
    set({ particles: randomParticles(particleCount) })
  },
  setFps: (fps) => set({ fps }),
  setTotalEnergy: (e) => set({ totalEnergy: e }),
  updateMetrics: (m) => set(state => ({
    metrics: m,
    metricsHistory: {
      avgSpeed: pushHistory(state.metricsHistory.avgSpeed, m.avgSpeed),
      avgSpread: pushHistory(state.metricsHistory.avgSpread, m.avgSpread),
      stability: pushHistory(state.metricsHistory.stability, m.stability),
    },
  })),
  applyPreset: (preset) => {
    set({ ...preset } as any)
    const { particleCount } = get()
    set({ particles: randomParticles(particleCount) })
  },
}))
