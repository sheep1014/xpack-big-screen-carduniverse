import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { CardArt } from './CardArt'
import { money, type UniverseCard } from './model'
import { universeSlots } from './layout'
import { cameraPreset, projectSlot } from './projection'
import './edge-callouts.css'

type Entry = { card: UniverseCard; slot: number; started: number; leaving: number | null }
export interface EdgeCalloutHandle {
  paint(now: number, yaw: number, cards: Map<number, UniverseCard>, scanning: boolean): void
}
const positions = [
  { x: 60, y: 620, left: true, upper: true },
  { x: 1784, y: 2140, left: false, upper: false },
  { x: 1784, y: 620, left: false, upper: true },
  { x: 60, y: 2140, left: true, upper: false },
]
// Anchor to the transformed bottom-center, not the card's center.
const bottomAnchor = (p: ReturnType<typeof projectSlot>) => ({ x: p.x + p.matrix[2] * 83, y: p.y + p.matrix[3] * 83 })
const nearRim = (p: ReturnType<typeof projectSlot>, side: number, tolerance = 160) => {
  const a = bottomAnchor(p), { left, upper } = positions[side]
  const half = Math.sqrt(Math.max(0, cameraPreset.radiusX ** 2 - (a.y - cameraPreset.centerY) ** 2))
  const rim = cameraPreset.centerX + (left ? -half : half)
  const inset = left ? a.x - rim : rim - a.x
  return inset >= -40 && inset <= tolerance && (left ? a.x < cameraPreset.centerX : a.x > cameraPreset.centerX) && (upper ? a.y > 940 && a.y < 1450 : a.y > 1450 && a.y < 2080)
}
const lifetime = 4800, fadeTime = 450, cooldown = 30000
const entranceGap = 2200, maxVisible = 2
export const EdgeCallouts = forwardRef<EdgeCalloutHandle, { onOpen(card: UniverseCard): void }>(function EdgeCallouts({ onOpen }, ref) {
  const [shown, setShown] = useState<(Entry | null)[]>(positions.map(() => null))
  const entries = useRef<(Entry | null)[]>(positions.map(() => null))
  const lines = useRef<(SVGGElement | null)[]>([])
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const seen = useRef(new Map<string, number>())
  const lastCheck = useRef(0)
  const nextEntrance = useRef(0)
  const nextSide = useRef(0)
  const reducedMotion = useRef(matchMedia('(prefers-reduced-motion: reduce)'))
  useImperativeHandle(ref, () => ({ paint(now, yaw, cards, scanning) {
    // Keep automatic transient annotations off for reduced-motion viewers.
    if (reducedMotion.current.matches) return
    let changed = false
    const choose = now - lastCheck.current > 250
    if (choose) lastCheck.current = now
    const firstSide = nextSide.current
    for (let offset = 0; offset < positions.length; offset++) {
      const side = (firstSide + offset) % positions.length
      let entry = entries.current[side]
      if (entry) {
        const card = cards.get(entry.slot)
        const p = projectSlot(universeSlots[entry.slot], entry.card, yaw)
        if (entry.leaving === null && (card?.id !== entry.card.id || !p.front || p.depth < .54 || !nearRim(p, side, 195) || now - entry.started > lifetime)) {
          entry = { ...entry, leaving: now }; entries.current[side] = entry; changed = true
        }
        if (entry.leaving !== null && now - entry.leaving > fadeTime) {
          seen.current.set(entry.card.id, now); entries.current[side] = null; entry = null; changed = true
        }
        if (entry) {
          const pos = positions[side], anchor = bottomAnchor(p)
          // Route vertically outside the full sphere, then use a short horizontal
          // approach below the card and a vertical terminal into its bottom edge.
          const railX = cameraPreset.centerX + (pos.left ? -1 : 1) * (cameraPreset.radiusX + 38)
          const panelX = pos.x + 57
          const panelY = pos.upper ? pos.y + (buttons.current[side]?.offsetHeight || 168) : pos.y
          const bendY = panelY + (pos.upper ? 36 : -36)
          const approachY = anchor.y + 18
          const group = lines.current[side]
          group?.querySelector('path')?.setAttribute('d', `M${panelX},${panelY} V${bendY} H${railX} V${approachY} H${anchor.x} V${anchor.y}`)
          group?.querySelector('circle')?.setAttribute('cx', String(anchor.x))
          group?.querySelector('circle')?.setAttribute('cy', String(anchor.y))
          const opacity = entry.leaving === null ? 1 : Math.max(0, 1 - (now - entry.leaving) / fadeTime)
          if (group) group.style.opacity = String(opacity)
          if (buttons.current[side]) {
            buttons.current[side]!.style.opacity = String(opacity)
            buttons.current[side]!.style.pointerEvents = entry.leaving === null ? 'auto' : 'none'
          }
        }
      }
      if (!entry && choose && !scanning && now >= nextEntrance.current && entries.current.filter(Boolean).length < maxVisible) {
        const candidates = [...cards].flatMap(([slot, card]) => {
          if (card.isNew || now - (seen.current.get(card.id) ?? -Infinity) < cooldown || entries.current.some(e => e?.card.id === card.id)) return []
          const p = projectSlot(universeSlots[slot], card, yaw)
          if (!p.front || p.depth < .55 || p.depth > .84 || !nearRim(p, side)) return []
          return [{ card, slot, distance: Math.abs(p.y - (positions[side].y + 100)) }]
        }).sort((a, b) => a.distance - b.distance)
        if (candidates[0]) {
          entries.current[side] = { card: candidates[0].card, slot: candidates[0].slot, started: now, leaving: null }; changed = true
          // One shared beat across all corners; never fill several on one frame
          // or catch up in a burst after a scan / pause. Rotate priority fairly.
          nextEntrance.current = now + entranceGap
          nextSide.current = (side + 1) % positions.length
        }
      }
    }
    if (changed) setShown([...entries.current])
  } }), [])
  return <div className="ps-edge-callouts">
    <svg viewBox="0 0 2304 2784" aria-hidden="true">{shown.map((entry, side) => entry && <g key={entry.card.id} ref={el => { lines.current[side] = el }} style={{ opacity: 0 }}><path pathLength="1" /><circle r="4" /></g>)}</svg>
    {shown.map((entry, side) => entry && <button key={entry.card.id} ref={el => { buttons.current[side] = el }} className="ps-edge-callout" data-side={side} data-card-id={entry.card.id} style={{ left: positions[side].x, top: positions[side].y }} aria-label={`View ${entry.card.name}, uploaded by ${entry.card.uploaderNickname}`} onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); onOpen(entry.card) }}>
      <span className="ps-edge-thumb"><CardArt card={entry.card} /></span>
      <span className="ps-edge-copy"><strong>{entry.card.name}</strong><span className="ps-edge-value">HK$ {money(entry.card.estimatedValue)}</span><span className="ps-edge-uploader">Uploaded by · {entry.card.uploaderNickname}</span></span>
    </button>)}
  </div>
})
