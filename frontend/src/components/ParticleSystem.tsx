import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimStore } from '../store/simulation'
import { applyPhysics } from '../simulations/physics'

const tempObject = new THREE.Object3D()
const tempColor = new THREE.Color()

export default function ParticleSystem() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const particles = useSimStore(s => s.particles)
  const mode = useSimStore(s => s.mode)
  const gravity = useSimStore(s => s.gravity)
  const damping = useSimStore(s => s.damping)
  const bounce = useSimStore(s => s.bounce)
  const attractorStrength = useSimStore(s => s.attractorStrength)
  const slowMotion = useSimStore(s => s.slowMotion)
  const paused = useSimStore(s => s.paused)
  const setFps = useSimStore(s => s.setFps)
  const setTotalEnergy = useSimStore(s => s.setTotalEnergy)
  const updateMetrics = useSimStore(s => s.updateMetrics)

  const colorArray = useMemo(
    () => new Float32Array(particles.length * 3),
    [particles.length]
  )

  useMemo(() => {
    particles.forEach((p, i) => {
      tempColor.set(p.color)
      colorArray[i * 3] = tempColor.r
      colorArray[i * 3 + 1] = tempColor.g
      colorArray[i * 3 + 2] = tempColor.b
    })
  }, [particles, colorArray])

  const fpsCounter = useRef({ frames: 0, lastTime: performance.now() })
  const metricsCounter = useRef({ frames: 0, lastTime: performance.now() })

  useFrame((_, delta) => {
    if (!meshRef.current || paused) return
    const dt = slowMotion ? delta * 0.1 : delta
    const updated = applyPhysics(particles, mode, gravity, damping, bounce, attractorStrength, dt)

    let totalEnergy = 0
    let sumSpeed = 0
    let cx = 0, cy = 0, cz = 0

    updated.forEach((p, i) => {
      tempObject.position.set(...p.position)
      const scale = p.radius * 2
      tempObject.scale.set(scale, scale, scale)
      tempObject.updateMatrix()
      meshRef.current!.setMatrixAt(i, tempObject.matrix)
      const v = p.velocity
      const speed = Math.sqrt(v[0]**2 + v[1]**2 + v[2]**2)
      totalEnergy += 0.5 * p.mass * speed * speed
      sumSpeed += speed
      cx += p.position[0]
      cy += p.position[1]
      cz += p.position[2]
    })

    const n = updated.length || 1
    const avgSpeed = sumSpeed / n
    cx /= n; cy /= n; cz /= n

    let sumDist = 0
    for (const p of updated) {
      const dx = p.position[0] - cx
      const dy = p.position[1] - cy
      const dz = p.position[2] - cz
      sumDist += Math.sqrt(dx*dx + dy*dy + dz*dz)
    }
    const avgSpread = sumDist / n
    const stability = 1 / (1 + avgSpeed * 0.1)

    meshRef.current.instanceMatrix.needsUpdate = true
    setTotalEnergy(totalEnergy)

    metricsCounter.current.frames++
    const now = performance.now()
    if (now - metricsCounter.current.lastTime > 200) {
      updateMetrics({ avgSpeed, avgSpread, stability })
      metricsCounter.current.frames = 0
      metricsCounter.current.lastTime = now
    }

    fpsCounter.current.frames++
    if (now - fpsCounter.current.lastTime > 1000) {
      setFps(fpsCounter.current.frames)
      fpsCounter.current.frames = 0
      fpsCounter.current.lastTime = now
    }
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particles.length]}>
      <sphereGeometry args={[1, 8, 8]}>
        <instancedBufferAttribute attach="attributes-color" args={[colorArray, 3]} />
      </sphereGeometry>
      <meshPhongMaterial vertexColors toneMapped={false} shininess={80} />
    </instancedMesh>
  )
}
