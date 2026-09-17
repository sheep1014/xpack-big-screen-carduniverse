import type { AssetSlot } from './layout'
import type { UniverseCard } from './model'
export const cameraPreset = { yaw: .12, centerX: 1152, centerY: 1430, radiusX: 870, radiusY: 870, pitch: -.16 } as const
const ease = (t: number) => { const v = Math.max(0, Math.min(1, t)); return v * v * (3 - 2 * v) }
export const arrivalTiming = { scan: 2300, hold: 3500, end: 4800 } as const
export function arrivalAmount(age: number) {
  if (age < arrivalTiming.hold) return 1
  if (age < arrivalTiming.end) return 1 - ease((age - arrivalTiming.hold) / (arrivalTiming.end - arrivalTiming.hold))
  return 0
}
export function projectSlot(p: AssetSlot, card: UniverseCard | undefined, yaw: number, focus = 0, fromPlaceholder = false) {
  const angle = yaw + p.phase
  const cy = Math.cos(angle), sy = Math.sin(angle)
  const unitX = (p.x * cy - p.z * sy)
  const rawZ = (p.x * sy + p.z * cy)
  const rawY = p.y
  const cp = Math.cos(cameraPreset.pitch), sp = Math.sin(cameraPreset.pitch)
  const unitY = rawY * cp - rawZ * sp
  const unitZ = rawY * sp + rawZ * cp
  const depth = (unitZ + 1) / 2
  const role = !card ? 'outer' : depth > .82 ? 'inner' : 'middle'
  // Every asset keeps its latitude/longitude surface slot; value never pulls it inward.
  const x = unitX, y = unitY
  const valueScale = card?.valueTier === 'premium' ? 1.16 : card?.valueTier === 'high' ? 1.10 : 1
  const baseHeight = !card || fromPlaceholder ? 42 + depth * 42 : (44 + depth * depth * 88) * valueScale
  const height = baseHeight + (800 - baseHeight) * focus
  const baseX = cameraPreset.centerX + x * cameraPreset.radiusX
  const baseY = cameraPreset.centerY + y * cameraPreset.radiusY
  const px = baseX + (cameraPreset.centerX - baseX) * focus
  const py = baseY + (cameraPreset.centerY - 100 - baseY) * focus
  const baseOpacity = !card ? .38 + depth * .27 : card.valueTier === 'premium' ? .16 + depth * depth * .84 : card.valueTier === 'high' ? .12 + depth * depth * .80 : .08 + depth * depth * .76
  const pitch = cameraPreset.pitch * (1 - focus)
  const longitude = Math.atan2(unitX, rawZ) * (1 - focus)
  const latitude = -Math.asin(Math.max(-1, Math.min(1, rawY))) * (1 - focus)
  const sinP = Math.sin(pitch), cosP = Math.cos(pitch), sinL = Math.sin(longitude), cosL = Math.cos(longitude), sinA = Math.sin(latitude), cosA = Math.cos(latitude)
  // Orthographic tangent-plane basis. Same UV orientation without 500 CSS 3D subtrees.
  const scale = height / 166
  const matrix = [cosL * scale, sinP * sinL * scale, sinL * sinA * scale, (cosP * cosA - sinP * cosL * sinA) * scale]
  const facing = sinP * sinA + cosP * cosL * cosA
  return { x: px, y: py, height, matrix, front: facing >= 0, opacity: baseOpacity + (1 - baseOpacity) * focus,
    zIndex: focus > 0 ? 1900 : 1 + Math.round(depth * 1000), depth, role }
}
