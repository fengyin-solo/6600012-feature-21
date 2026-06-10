import { useSimStore } from '../store/simulation'
import type { SimMode } from '../types'
import ParamSlider from './ParamSlider'
import { shallow } from 'zustand/shallow'

const MODES: { value: SimMode; label: string; icon: string }[] = [
  { value: 'gravity', label: '重力吸引', icon: '🌍' },
  { value: 'collision', label: '弹性碰撞', icon: '💥' },
  { value: 'fluid', label: '流体模拟', icon: '💧' },
  { value: 'vortex', label: '漩涡旋转', icon: '🌀' },
]

const PRESETS = [
  { id: 'solar', name: '太阳系', params: { mode: 'gravity' as SimMode, gravity: 5, attractorStrength: 8, damping: 0.01, particleCount: 200 } },
  { id: 'billiards', name: '台球碰撞', params: { mode: 'collision' as SimMode, gravity: 0, damping: 0.005, bounce: 0.95, particleCount: 50 } },
  { id: 'lava', name: '熔岩灯', params: { mode: 'fluid' as SimMode, gravity: 3, damping: 0.05, particleCount: 150 } },
  { id: 'tornado', name: '龙卷风', params: { mode: 'vortex' as SimMode, gravity: 2, attractorStrength: 12, damping: 0.02, particleCount: 400 } },
]

const GRAVITY_METRICS = [
  { key: 'avgSpeed' as const, label: '速度', color: 'rgb(74,222,128)' },
  { key: 'stability' as const, label: '稳定', color: 'rgb(96,165,250)' },
]

const DAMPING_METRICS = [
  { key: 'avgSpeed' as const, label: '速度', color: 'rgb(74,222,128)' },
  { key: 'stability' as const, label: '稳定', color: 'rgb(96,165,250)' },
]

const BOUNCE_METRICS = [
  { key: 'avgSpeed' as const, label: '速度', color: 'rgb(74,222,128)' },
  { key: 'avgSpread' as const, label: '扩散', color: 'rgb(251,191,36)' },
]

const ATTRACTOR_METRICS = [
  { key: 'avgSpread' as const, label: '扩散', color: 'rgb(251,191,36)' },
  { key: 'stability' as const, label: '稳定', color: 'rgb(96,165,250)' },
]

export default function ControlPanel() {
  const {
    mode,
    gravity,
    damping,
    bounce,
    attractorStrength,
    particleCount,
    paused,
    slowMotion,
    setMode,
    setParam,
    setParticleCount,
    applyPreset,
    reset,
  } = useSimStore(s => ({
    mode: s.mode,
    gravity: s.gravity,
    damping: s.damping,
    bounce: s.bounce,
    attractorStrength: s.attractorStrength,
    particleCount: s.particleCount,
    paused: s.paused,
    slowMotion: s.slowMotion,
    setMode: s.setMode,
    setParam: s.setParam,
    setParticleCount: s.setParticleCount,
    applyPreset: s.applyPreset,
    reset: s.reset,
  }), shallow)

  return (
    <div className="w-80 bg-gray-900 border-l border-gray-700 p-4 overflow-y-auto flex flex-col gap-3">
      <h2 className="text-lg font-bold text-white">粒子物理模拟器</h2>

      <div>
        <label className="text-xs text-gray-400 block mb-1">模拟模式</label>
        <div className="grid grid-cols-2 gap-2">
          {MODES.map(m => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={`px-3 py-2 rounded text-sm font-medium transition ${
                mode === m.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-400 block mb-1">预设场景</label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => applyPreset(p.params)}
              className="px-3 py-1 bg-purple-700 hover:bg-purple-600 text-white text-xs rounded-full"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <ParamSlider
          label="重力"
          value={gravity}
          min={-20}
          max={20}
          step={0.1}
          accent="#4ade80"
          formatValue={v => v.toFixed(1)}
          onChange={v => setParam('gravity', v)}
          relatedMetrics={GRAVITY_METRICS}
        />

        <ParamSlider
          label="阻尼"
          value={damping}
          min={0}
          max={0.5}
          step={0.005}
          accent="#facc15"
          formatValue={v => v.toFixed(3)}
          onChange={v => setParam('damping', v)}
          relatedMetrics={DAMPING_METRICS}
        />

        <ParamSlider
          label="弹性"
          value={bounce}
          min={0}
          max={1}
          step={0.05}
          accent="#fb923c"
          formatValue={v => v.toFixed(2)}
          onChange={v => setParam('bounce', v)}
          relatedMetrics={BOUNCE_METRICS}
        />

        <ParamSlider
          label="吸引力"
          value={attractorStrength}
          min={0}
          max={20}
          step={0.5}
          accent="#f472b6"
          formatValue={v => v.toFixed(1)}
          onChange={v => setParam('attractorStrength', v)}
          relatedMetrics={ATTRACTOR_METRICS}
        />
      </div>

      <div>
        <label className="text-xs text-gray-400">粒子数量: {particleCount}</label>
        <input type="range" min={10} max={800} step={10}
          value={particleCount}
          onChange={e => setParticleCount(Number(e.target.value))}
          className="w-full accent-blue-500" />
      </div>

      <div className="flex gap-2 mt-2">
        <button
          onClick={() => setParam('paused', !paused)}
          className={`flex-1 py-2 rounded font-medium text-sm ${paused ? 'bg-green-600' : 'bg-red-600'} text-white`}
        >
          {paused ? '▶ 继续' : '⏸ 暂停'}
        </button>
        <button
          onClick={() => setParam('slowMotion', !slowMotion)}
          className={`flex-1 py-2 rounded font-medium text-sm ${slowMotion ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}
        >
          🐌 慢动作
        </button>
      </div>
      <button
        onClick={() => reset()}
        className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
      >
        🔄 重置粒子
      </button>
    </div>
  )
}
