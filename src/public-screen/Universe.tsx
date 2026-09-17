import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { CardArt } from './CardArt'
import { EdgeCallouts, type EdgeCalloutHandle } from './EdgeCallouts'
import { universeSlots, slotForCard } from './layout'
import { money, type UniverseCard } from './model'
import { cameraPreset, arrivalAmount, arrivalTiming, projectSlot } from './projection'
const orbitSamples = Array.from({ length: 81 }, (_, n) => { const a = n / 80 * Math.PI * 2; return { cos: Math.cos(a), sin: Math.sin(a) } })
function ArrivingCard({ card }: { card: UniverseCard }) {
  return <span className={`ps-card-arrival${card.isNew ? ' ps-card-arrival--new' : ''}`}>{card.isNew && <span className="ps-scan-preview" aria-hidden="true"><CardArt card={card} /></span>}<CardArt card={card} />{card.isNew && <><span className="ps-arrival-ring" /><span className="ps-scan-cursor" aria-hidden="true"><span className="ps-scan-data">{['0101  0010     1100 01   ', '00   1010  01      1001 ', '1100    01  0110    10  '].map((bits, i) => <i key={i}>{bits.repeat(4)}</i>)}</span><span className="ps-scan-beam" /></span></>}</span>
}
interface Props { cards: readonly UniverseCard[]; paused: boolean; cameraLocked: boolean; onOpen(card: UniverseCard): void }
export function Universe({ cards, paused, cameraLocked, onOpen }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const edgeCallouts = useRef<EdgeCalloutHandle>(null)
  const landingSlot = useRef<HTMLDivElement>(null)
  const elements = useRef<(HTMLButtonElement | null)[]>([])
  const yaw = useRef<number>(cameraPreset.yaw)
  const slotAssignments = useRef(new Map<string, number>())
  const turnToArrival = useRef<{ from: number; to: number; started: number } | null>(null)
  const paintRef = useRef<() => void>(() => {})
  const arrival = useRef<{ card: UniverseCard; started: number } | null>(null)
  const [arrivalView, setArrivalView] = useState<{ card: UniverseCard; phase: string } | null>(null)
  const rings = useRef<(SVGPathElement | null)[]>([])
  const latest = cards.find(c => c.isNew)
  useEffect(() => {
    if (!latest) { arrival.current = null; setArrivalView(null); paintRef.current(); return }
    arrival.current = { card: latest, started: performance.now() }
    setArrivalView({ card: latest, phase: 'scanning' }); paintRef.current()
    const timers = [setTimeout(() => setArrivalView({ card: latest, phase: 'focus' }), arrivalTiming.scan), setTimeout(() => setArrivalView({ card: latest, phase: 'returning' }), arrivalTiming.hold), setTimeout(() => { arrival.current = null; setArrivalView(null); paintRef.current() }, arrivalTiming.end)]
    return () => timers.forEach(clearTimeout)
  }, [latest?.id])
  const drag = useRef<{ id: number; x: number; moved: boolean } | null>(null)
  const lastDrag = useRef(0)
  const active = useMemo(() => {
    const assignments = slotAssignments.current
    const ids = new Set(cards.map(card => card.id))
    if ([...assignments.keys()].some(id => !ids.has(id))) assignments.clear()
    const used = new Set(assignments.values())
    const slots = new Map<number, UniverseCard>()
    cards.forEach((card, index) => {
      let slot = assignments.get(card.id)
      if (slot === undefined) {
        if (card.isNew) {
          const occupied = [...used].map(i => projectSlot(universeSlots[i], card, yaw.current)).filter(p => p.front)
          const recent = [...assignments.values()].slice(-6).map(i => projectSlot(universeSlots[i], card, yaw.current))
          const seed = Number(card.id.replace(/\D/g, '')) || index + 1
          const free = universeSlots.map((point, i) => ({ point, i, projection: projectSlot(point, card, yaw.current) })).filter(p => !used.has(p.i))
          const visible = free.filter(p => p.projection.depth > .62)
          const distance = (p: { x: number; y: number }, points: { x: number; y: number }[], cap: number) => Math.min(cap, ...points.map(q => Math.hypot(p.x - q.x, p.y - q.y))) / cap
          const score = (p: typeof free[number]) => {
            const noise = Math.sin(seed * 127.1 + p.i * 311.7) * 43758.5453
            return distance(p.projection, occupied, 300) * .35 + distance(p.projection, recent, 850) * .4 + (noise - Math.floor(noise)) * .25
          }
          const candidates = visible.length ? visible.map(p => ({ ...p, score: score(p) })).sort((a, b) => b.score - a.score) : free.sort((a, b) => b.projection.depth - a.projection.depth)
          const chosen = candidates[0]
          slot = chosen?.i ?? slotForCard(index)
          if (!cameraLocked && chosen && chosen.projection.depth < .66) {
            const target = Math.atan2(chosen.point.x, chosen.point.z)
            const delta = Math.atan2(Math.sin(target - yaw.current), Math.cos(target - yaw.current))
            turnToArrival.current = { from: yaw.current, to: yaw.current + delta, started: performance.now() }
          }
        } else {
          slot = slotForCard(index)
          if (used.has(slot)) slot = universeSlots.findIndex((_, i) => !used.has(i))
        }
        assignments.set(card.id, slot); used.add(slot)
      }
      slots.set(slot, card)
    })
    return slots
  }, [cards, cameraLocked])
  const current = useRef(active); current.current = active
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    let raf = 0, last = 0, visible = true, disposed = false
    let orbitYaw = NaN
    let paintedYaw = NaN, paintedCards: typeof active | null = null, hadArrival = false
    const cached: Record<string, string>[] = universeSlots.map(() => ({}))
    const paint = () => {
      const now = performance.now()
      const hasArrival = !!arrival.current
      edgeCallouts.current?.paint(now, yaw.current, current.current, !!arrival.current && now - arrival.current.started < arrivalTiming.scan)
      if (paintedYaw === yaw.current && paintedCards === current.current && !hasArrival && !hadArrival) return
      paintedYaw = yaw.current; paintedCards = current.current; hadArrival = hasArrival
      if (landingSlot.current) landingSlot.current.hidden = true
      universeSlots.forEach((p, i) => {
        const el = elements.current[i]; if (!el) return
        const card = current.current.get(i)
        const age = arrival.current && card && arrival.current.card.id === card.id ? now - arrival.current.started : 5000
        const focus = media.matches ? (age < arrivalTiming.hold ? 1 : 0) : arrivalAmount(age)
        const point = projectSlot(p, card, yaw.current, focus, age < 600)
        // The animated card leaves its slot; keep an independent empty surface
        // on the rotating globe until the card has completely landed over it.
        if (landingSlot.current && arrival.current?.card.id === card?.id && age < arrivalTiming.end) {
          const base = projectSlot(p, undefined, yaw.current)
          const target = landingSlot.current
          target.hidden = false
          target.dataset.slot = String(i)
          target.dataset.front = String(base.front)
          target.style.transform = `translate(-50%,-50%) matrix(${base.matrix.map(v => v.toFixed(5)).join(',')},${base.x.toFixed(2)},${base.y.toFixed(2)})`
          target.style.opacity = base.opacity.toFixed(2)
          target.style.zIndex = String(Math.min(base.zIndex, point.zIndex - 1))
        }
        const cache = cached[i]
        const style = (key: 'transform' | 'opacity' | 'zIndex' | 'pointerEvents', value: string) => {
          if (cache[key] !== value) { el.style[key] = value; cache[key] = value }
        }
        const data = (key: string, value: string) => {
          if (cache[key] !== value) { el.dataset[key] = value; cache[key] = value }
        }
        style('transform', `translate(-50%,-50%) matrix(${point.matrix.map(v => v.toFixed(5)).join(',')},${point.x.toFixed(2)},${point.y.toFixed(2)})`)
        style('opacity', point.opacity.toFixed(2))
        style('zIndex', String(point.zIndex))
        data('role', point.role)
        data('focal', String(focus > .01))
        data('front', String(point.front))
        style('pointerEvents', card && (point.front || focus > .01) ? 'auto' : 'none')
      })
      if (orbitYaw !== yaw.current) { paintOrbits(); orbitYaw = yaw.current }
      root.current?.setAttribute('data-yaw', String(yaw.current))
    }
    // Latitude rings are rotationally symmetric. Only the three meridians change with yaw.
    const paintOrbits = (all = false) => {
      rings.current.forEach((ring, index) => {
        if (!ring || (!all && index < 5)) return
        const points = orbitSamples.map(({ cos, sin }) => {
          const latitude = index < 5 ? (index - 2) * .37 : null
          const radius = latitude === null ? 1 : Math.sqrt(1 - latitude * latitude)
          const turn = yaw.current + (index - 5) * Math.PI / 3
          const x = latitude === null ? cos * Math.cos(turn) : cos * radius
          const y = latitude === null ? sin : latitude
          const z = latitude === null ? cos * Math.sin(turn) : sin * radius
          const screenY = y * Math.cos(cameraPreset.pitch) - z * Math.sin(cameraPreset.pitch)
          return `${(1152 + x * cameraPreset.radiusX).toFixed(1)},${(1430 + screenY * cameraPreset.radiusY).toFixed(1)}`
        })
        ring.setAttribute('d', `M${points.join(' L')} Z`)
      })
    }
    paintOrbits(true)
    const tick = (now: number) => {
      if (disposed || paused || document.hidden || !visible || media.matches) { raf = 0; return }
      if (!drag.current && !cameraLocked) {
        const turn = turnToArrival.current
        if (turn) {
          const t = Math.min(1, (now - turn.started) / 1400), eased = t * t * (3 - 2 * t)
          yaw.current = turn.from + (turn.to - turn.from) * eased
          if (t === 1) turnToArrival.current = null
        } else yaw.current += Math.min((now - (last || now)) / 1000, .1) * .027
      }
      last = now
      paint()
      raf = requestAnimationFrame(tick)
    }
    const reconcile = () => {
      if (disposed) return
      cancelAnimationFrame(raf); last = 0; paint()
      if (!paused && visible && !document.hidden && !media.matches) raf = requestAnimationFrame(tick)
    }
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; reconcile() })
    if (root.current) observer.observe(root.current)
    document.addEventListener('visibilitychange', reconcile); media.addEventListener('change', reconcile)
    paintRef.current = paint; reconcile()
    return () => { disposed = true; cancelAnimationFrame(raf); observer.disconnect(); document.removeEventListener('visibilitychange', reconcile); media.removeEventListener('change', reconcile); paintRef.current = () => {} }
  }, [paused, cameraLocked])
  useEffect(() => { paintRef.current() }, [active])
  const down = (event: PointerEvent) => { if (cameraLocked) return; turnToArrival.current = null; drag.current = { id: event.pointerId, x: event.clientX, moved: false } }
  const move = (event: PointerEvent) => {
    const d = drag.current; if (!d || d.id !== event.pointerId) return
    const dx = event.clientX - d.x
    if (Math.abs(dx) > 2 || d.moved) {
      const scale = root.current!.getBoundingClientRect().width / 2304
      yaw.current -= dx / scale * .0018; d.x = event.clientX; d.moved = true; paintRef.current()
      event.currentTarget.setPointerCapture(event.pointerId)
    }
  }
  const up = () => { if (drag.current?.moved) lastDrag.current = performance.now(); drag.current = null }
  return <div ref={root} className="ps-universe" data-paused={paused} data-locked={cameraLocked} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
    <div className="ps-space-light" aria-hidden="true" />
    <div className="ps-sphere-energy" aria-hidden="true"><div className="ps-energy-halo" /><div className="ps-energy-rim" /></div>
    <svg className="ps-container-orbits" viewBox="0 0 2304 2784" aria-hidden="true"><circle cx="1152" cy="1430" r={cameraPreset.radiusX} />{Array.from({ length: 8 }, (_, i) => <path key={i} ref={el => { rings.current[i] = el }} />)}</svg>
    <div ref={landingSlot} className="ps-slot ps-landing-slot" data-active="false" hidden aria-hidden="true"><span className="ps-slot-back" /><span className="ps-slot-face"><span className="ps-placeholder" /></span></div>
    <EdgeCallouts ref={edgeCallouts} onOpen={onOpen} />
    {arrivalView && <div className="ps-arrival-info" data-phase={arrivalView.phase} aria-live="polite"><strong>{arrivalView.card.name}</strong><p className="ps-arrival-value">HK$ {money(arrivalView.card.estimatedValue)}</p><p className="ps-arrival-uploader">Uploaded by · {arrivalView.card.uploaderNickname}</p></div>}
    {universeSlots.map((slot, i) => {
      const card = active.get(i)
      return <button key={i} ref={el => { elements.current[i] = el }} className="ps-slot" disabled={!card} data-layer={slot.layer} data-active={!!card} data-tier={card?.valueTier} data-new={card?.isNew || false} data-card-id={card?.id} data-slot={i} aria-label={card ? `${card.name}, uploaded by ${card.uploaderNickname}` : undefined} aria-hidden={!card || undefined}
        onClick={() => { if (card && performance.now() - lastDrag.current > 250) onOpen(card) }}>
        <span className="ps-slot-back" aria-hidden="true" /><span className="ps-slot-face">{card ? <ArrivingCard key={card.id} card={card} /> : <span className="ps-placeholder" />}</span>
      </button>
    })}
  </div>
}
