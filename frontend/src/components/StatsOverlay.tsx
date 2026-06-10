import { useSimStore } from '../store/simulation'

export default function StatsOverlay() {
  const fps = useSimStore(s => s.fps)
  const count = useSimStore(s => s.particleCount)
  const mode = useSimStore(s => s.mode)
  const energy = useSimStore(s => s.totalEnergy)
  const metrics = useSimStore(s => s.metrics)

  return (
    <div className="absolute top-3 left-3 bg-black/60 rounded px-3 py-2 text-xs font-mono space-y-1 pointer-events-none">
      <div className="text-green-400">FPS: {fps}</div>
      <div className="text-blue-400">粒子数: {count}</div>
      <div className="text-yellow-400">模式: {mode}</div>
      <div className="text-pink-400">总动能: {energy.toFixed(1)}</div>
      <div className="border-t border-gray-700 my-1" />
      <div className="text-emerald-400">平均速度: {metrics.avgSpeed.toFixed(2)}</div>
      <div className="text-amber-400">平均扩散: {metrics.avgSpread.toFixed(2)}</div>
      <div className="text-sky-400">稳定性: {metrics.stability.toFixed(2)}</div>
    </div>
  )
}
