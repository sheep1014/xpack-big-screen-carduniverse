export const publicScreenPreset = {
  id: 'GF-LED-61-62', width: 2304, height: 2784,
  physicalWidthM: 6, physicalHeightM: 7.25, capacity: 500,
} as const
export type PublicScreenMode = 'universe' | 'cardHunt'
export function fitPublicScreen(width: number, height: number) {
  return Math.min(width / publicScreenPreset.width, height / publicScreenPreset.height)
}
