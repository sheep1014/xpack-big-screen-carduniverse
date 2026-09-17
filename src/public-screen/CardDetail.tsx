import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { CardArt } from './CardArt'
import { money, type UniverseCard } from './model'
export interface DetailOrigin { element: HTMLElement | null; transform: string; opacity: number }
interface Props {
  card: UniverseCard; origin: DetailOrigin; closing: boolean
  dialogRef: RefObject<HTMLDivElement | null>; closeButtonRef: RefObject<HTMLButtonElement | null>
  onClose(): void; onClosed(): void
}
const target = 'translate(-50%,-50%) translate(1152px,1120px) scale(5.6)'
export function CardDetail({ card, origin, closing, dialogRef, closeButtonRef, onClose, onClosed }: Props) {
  const art = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState('opening')
  useLayoutEffect(() => {
    const element = art.current!
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const animation = element.animate([
      { transform: origin.transform, opacity: origin.opacity },
      { transform: target, opacity: 1 },
    ], { duration: reduced ? 0 : 650, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' })
    animation.onfinish = () => setPhase('open')
    return () => animation.cancel()
  }, [origin])
  useLayoutEffect(() => {
    if (!closing) return
    const element = art.current!
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const current = getComputedStyle(element)
    const from = { transform: current.transform, opacity: current.opacity }
    element.getAnimations().forEach(animation => animation.cancel())
    setPhase('closing')
    const animation = element.animate([from, {
      transform: origin.element?.style.transform || origin.transform,
      opacity: origin.element ? Number(origin.element.style.opacity) : origin.opacity,
    }], { duration: reduced ? 0 : 500, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' })
    animation.onfinish = onClosed
    return () => animation.cancel()
  }, [closing, origin, onClosed])
  return <div ref={dialogRef} className="ps-detail" data-phase={phase} role="dialog" aria-modal="true" aria-labelledby="ps-detail-title">
    <div className="ps-detail-shade" onClick={onClose} />
    <div ref={art} className="ps-detail-art" style={{ transform: origin.transform, opacity: origin.opacity }}><CardArt card={card} full /></div>
    <button ref={closeButtonRef} className="ps-detail-close" onClick={onClose} aria-label="Close card details"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 5L19 19M19 5L5 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></button>
    <div className="ps-detail-copy">
      <h2 id="ps-detail-title">{card.name}</h2>
      <p className="ps-detail-metadata">{card.metadata}</p>
      <div className="ps-detail-facts">
        <section><span>Estimated Value</span><strong>HK$ {money(card.estimatedValue)}</strong></section>
        <section><span>Uploaded by</span><strong className="ps-uploader-name">{card.uploaderNickname}</strong></section>
      </div>
    </div>
  </div>
}
