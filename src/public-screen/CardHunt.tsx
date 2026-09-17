import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CardHuntSubmission, CurrentHunt } from './model'
import { huntConfig, huntOrder } from './huntModel'
import type { HuntSelection } from './HuntInspection'
import logo from './assets/xpack-logo.svg'
function WaitingSignal({ index }: { index: number }) {
  return <div className="ps-hunt-waiting-art" aria-hidden="true" style={{ animationDelay: `${index * -.8}s` }}>
    <div className="ps-hunt-brand-signal">
      <img className="ps-hunt-brand-base" src={logo} alt="" />
      <img className="ps-hunt-brand-light" src={logo} alt="" />
    </div>
    <div className="ps-hunt-signal-track"><i /><i /><i /><i /><i /></div>
    <span className="ps-hunt-waiting-scan" />
  </div>
}
export function HuntArt({ submission }: { submission: CardHuntSubmission }) {
  const [failed, setFailed] = useState(false)
  return <span className="ps-hunt-art">{failed ? <span>卡牌圖片暫時無法顯示</span> : <img src={submission.cardImage} alt="" draggable={false} onError={() => setFailed(true)} />}</span>
}
interface Props { submissions: readonly CardHuntSubmission[]; hunt: CurrentHunt; active: boolean; onInspect(selection: HuntSelection): void }
export function CardHunt({ submissions, hunt, active, onInspect }: Props) {
  const queue = useRef<HTMLDivElement>(null)
  const previous = useRef(submissions)
  const follow = useRef(true)
  const [newId, setNewId] = useState<string | null>(null)
  const ordered = [...submissions].sort((a, b) => a.rank - b.rank)
  const rest = ordered.slice(3)
  useLayoutEffect(() => {
    const before = previous.current; previous.current = submissions
    const latest = submissions.at(-1)
    // Fixture changes are instant. Only a single appended event receives arrival motion.
    if (latest && submissions.length === before.length + 1 && before.every((s, i) => s.id === submissions[i].id)) {
      setNewId(latest.id)
      if (follow.current && queue.current && active) queue.current.scrollTo({ top: queue.current.scrollHeight, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    } else {
      setNewId(null)
      if (queue.current) queue.current.scrollTop = 0
      follow.current = true
    }
  }, [submissions])
  useEffect(() => { if (!newId) return; const timer = setTimeout(() => setNewId(null), 1400); return () => clearTimeout(timer) }, [newId])
  const open = (submission: CardHuntSubmission, trigger: HTMLButtonElement) => onInspect({ submission, trigger })
  const scrollPage = (direction: number) => queue.current?.scrollBy({ top: direction * 848, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  return <section className="ps-hunt" aria-label="CARD HUNT 即時提交">
    <header className="ps-hunt-challenge">
      <h1>{hunt.challengeText}</h1>
      <div className="ps-hunt-meta"><span>{huntConfig.roundLabel}</span><span className="ps-hunt-status"><i />{huntConfig.status}</span><span className="ps-hunt-total"><strong key={ordered.length}>{ordered.length}</strong> 筆提交</span></div>
    </header>
    <section className="ps-hunt-first" aria-label="最早提交的三筆">
      <div className="ps-hunt-section-heading"><h2>最早提交</h2><p>按上傳時間排序 · 結果由主持人現場確認</p></div>
      <div className="ps-hunt-featured">
        {[0, 1, 2].map(index => { const item = ordered[index]; return item ? <button key={item.id} className="ps-hunt-feature" data-new={newId === item.id} aria-label={`查看${huntOrder(item.rank)}的提交，${item.username}`} onClick={event => open(item, event.currentTarget)}>
          <span className="ps-hunt-rank">{huntOrder(item.rank)}</span><HuntArt submission={item} /><strong>{item.username}</strong>
        </button> : <div key={`empty-${index}`} className="ps-hunt-feature ps-hunt-feature--empty"><span className="ps-hunt-rank">{huntOrder(index + 1)}</span><WaitingSignal index={index} /><strong>等待提交</strong></div> })}
      </div>
    </section>
    {rest.length > 0 && <section className="ps-hunt-queue-section" aria-label="即時隊列">
        <div ref={queue} className="ps-hunt-queue" tabIndex={0} role="region" aria-label="即時隊列，按上傳時間排序" onScroll={() => { const el = queue.current!; follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48 }} onKeyDown={e => { if (e.key === 'PageDown' || e.key === 'PageUp') { e.preventDefault(); scrollPage(e.key === 'PageDown' ? 1 : -1) } }}>
          {rest.map(item => <button key={item.id} className="ps-hunt-row" data-new={newId === item.id} aria-label={`查看${huntOrder(item.rank)}的提交，${item.username}`} onClick={event => open(item, event.currentTarget)}><span className="ps-hunt-rank">{huntOrder(item.rank)}</span><HuntArt submission={item} /><strong>{item.username}</strong><span className="ps-hunt-inspect-mark" aria-hidden="true">↗</span></button>)}
        </div>
    </section>}
  </section>
}
