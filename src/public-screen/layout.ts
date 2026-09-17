export type DepthLayer = 'far' | 'middle' | 'near'
export interface AssetSlot { x: number; y: number; z: number; layer: DepthLayer; phase: number }
// Symmetric latitude bands: similar surface spacing, staggered neighbours, exactly 500 slots.
const hemisphere = [4, 12, 20, 28, 34, 36, 38, 38, 40]
export const sphereBands = [...hemisphere, ...[...hemisphere].reverse()]
export const universeSlots: AssetSlot[] = sphereBands.flatMap((count, band) => {
  const latitude = (-85 + band * 10) * Math.PI / 180
  const y = Math.sin(latitude), radius = Math.cos(latitude)
  return Array.from({ length: count }, (_, i) => {
    const angle = (i + (band % 2) * .5) / count * Math.PI * 2
    return { x: Math.cos(angle) * radius, y, z: Math.sin(angle) * radius, layer: 'far' as const, phase: 0 }
  })
})
export const slotForCard = (index: number) => index * 197 % 500
