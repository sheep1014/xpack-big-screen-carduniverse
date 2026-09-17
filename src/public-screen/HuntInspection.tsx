import { useLayoutEffect, useRef, useState } from 'react'
import { money, type CardHuntSubmission } from './model'
import { huntOrder, huntTime } from './huntModel'
import { HuntArt } from './CardHunt'
export interface HuntSelection { submission: CardHuntSubmission; trigger: HTMLButtonElement }
export function HuntInspection({ selection, onClosed }: { selection: HuntSelection; onClosed(): void }) {
  const { submission, trigger } = selection
  const details = submission.cardDetails
  const art = useRef<HTMLDivElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const [phase, setPhase] = useState('opening')
  const closeRef = useRef(() => {})
  useLayoutEffect(() => {
    const element = art.current!
    const stage = element.closest('.ps-stage')!.getBoundingClientRect()
    const scale = stage.width / 2304
    const image = trigger.querySelector<HTMLElement>('.ps-hunt-art')!
    const source = image.getBoundingClientRect()
    const from = `translate(${(source.x - stage.x) / scale}px,${(source.y - stage.y) / scale}px) scale(${source.width / scale / 640})`
    const target = 'translate(832px,680px) scale(1)'
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    image.style.visibility = 'hidden'
    closeButton.current?.focus({ preventScroll: true })
    let animation = element.animate([{ transform: from }, { transform: target }], { duration: reduced ? 0 : 600, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' })
    animation.onfinish = () => setPhase('open')
    let closing = false
    closeRef.current = () => {
      if (closing) return
      closing = true
      const current = getComputedStyle(element).transform
      animation.cancel(); setPhase('closing')
      animation = element.animate([{ transform: current }, { transform: from }], { duration: reduced ? 0 : 420, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' })
      animation.onfinish = () => { image.style.visibility = ''; onClosed(); trigger.focus({ preventScroll: true }) }
    }
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current() }
      if (event.key === 'Tab') { event.preventDefault(); closeButton.current?.focus() }
    }
    document.addEventListener('keydown', key)
    return () => { animation.cancel(); image.style.visibility = ''; document.removeEventListener('keydown', key) }
  }, [selection, onClosed, trigger])
  return <div className="ps-hunt-inspection" data-phase={phase} role="dialog" aria-modal="true" aria-labelledby="hunt-inspection-title">
    <div className="ps-hunt-inspection-shade" onClick={() => closeRef.current()} />
    <div ref={art} className="ps-hunt-inspection-art"><HuntArt submission={submission} /></div>
    <button ref={closeButton} className="ps-hunt-close" aria-label="關閉檢視" onClick={() => closeRef.current()}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 5L19 19M19 5L5 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></button>
    <div className="ps-hunt-inspection-copy">
      <p id="hunt-inspection-title" className="ps-hunt-inspection-number">{huntOrder(submission.rank)}</p>
      {details && <>
        <h2>{details.name}</h2>
        <p className="ps-hunt-inspection-series">{[details.year, details.series].filter(Boolean).join(' · ')}</p>
        <dl className="ps-hunt-inspection-facts">
          <div><dt>卡號</dt><dd>{details.cardNumber || '—'}</dd></div>
          <div><dt>評級</dt><dd>{details.grade}</dd></div>
          <div><dt>語言</dt><dd>{details.language}</dd></div>
          <div><dt>估值</dt><dd>HK$ {money(details.estimatedValue)}</dd></div>
        </dl>
      </>}
      <div className="ps-hunt-inspection-submitter"><span>上傳者 · {submission.username}</span><time dateTime={submission.timestamp}>{huntTime(submission.timestamp)}</time></div>
    </div>
  </div>
}
