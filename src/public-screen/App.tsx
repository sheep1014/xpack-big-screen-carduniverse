import { Fragment, useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { CardHunt } from './CardHunt'
import { HuntInspection, type HuntSelection } from './HuntInspection'
import { huntConfig } from './huntModel'
import type { PublicScreenMode } from './preset'
import { Universe } from './Universe'
import { PoolCounter } from './PoolCounter'
import { arrivalTiming } from './projection'
import { CardDetail, type DetailOrigin } from './CardDetail'
import { createMockAdapter, type UniverseCard, type PublicScreenAdapter } from './model'
import { fitPublicScreen, publicScreenPreset } from './preset'
import logo from './assets/xpack-logo.svg'
import './public-screen.css'
import './card-hunt.css'
const query = new URLSearchParams(location.search)
const mockAdapter = createMockAdapter(query.has('count') ? Number(query.get('count')) : 0, Number(query.get('huntCount') || 0))
export default function App() { return <PublicScreen source={mockAdapter} simulation={mockAdapter} clickToSimulate={query.get('clickMock') !== '0'} /> }
export function PublicScreen({ source, simulation, clickToSimulate = false }: { source: PublicScreenAdapter; simulation?: ReturnType<typeof createMockAdapter>; clickToSimulate?: boolean }) {
  const snapshot = useSyncExternalStore(source.subscribe, source.getSnapshot)
  const [scale, setScale] = useState(() => fitPublicScreen(innerWidth, innerHeight))
  const [mode, setMode] = useState<PublicScreenMode>(query.get('mode') === 'cardHunt' ? 'cardHunt' : 'universe')
  const [inspection, setInspection] = useState<HuntSelection | null>(null)
  const [clickMock, setClickMock] = useState(clickToSimulate)
  const [huntLive, setHuntLive] = useState(query.get('huntLive') === '1')
  const closeInspection = useCallback(() => setInspection(null), [])
  const [debug, setDebug] = useState(query.get('debug') === '1')
  const [selected, setSelected] = useState<UniverseCard | null>(null)
  const [detailClosing, setDetailClosing] = useState(false)
  const detailOrigin = useRef<DetailOrigin>({ element: null, transform: 'translate(-50%,-50%) translate(1152px,1430px) scale(.6)', opacity: 0 })
  const [stream, setStream] = useState(query.get('live') === '1' || (!query.has('count') && query.get('live') !== '0'))
  const [intervalMs, setIntervalMs] = useState(query.get('speed') === 'fast' ? 120 : 5000)
  const [cameraLocked, setCameraLocked] = useState(query.get('camera') === 'locked')
  const [search, setSearch] = useState('')
  const [hidden, setHidden] = useState(document.hidden)
  const returnFocus = useRef<HTMLElement | null>(null)
  const dialog = useRef<HTMLDivElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const pendingActivation = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const latest = snapshot.cards.slice().reverse().find(c => c.isNew)
  const count = snapshot.cards.length
  useEffect(() => source.connect(), [source])
  useEffect(() => () => clearTimeout(pendingActivation.current), [])
  useEffect(() => {
    const resize = () => setScale(fitPublicScreen(innerWidth, innerHeight))
    const visibility = () => setHidden(document.hidden)
    addEventListener('resize', resize); document.addEventListener('visibilitychange', visibility)
    return () => { removeEventListener('resize', resize); document.removeEventListener('visibilitychange', visibility) }
  }, [])
  useEffect(() => {
    if (!latest) return
    const timer = setTimeout(() => simulation?.settle(), arrivalTiming.end)
    return () => clearTimeout(timer)
  }, [latest?.id, count])
  useEffect(() => {
    if (!stream || count === 500 || hidden || selected || mode !== 'universe') return
    const timer = setInterval(() => simulation?.activate(), intervalMs)
    return () => clearInterval(timer)
  }, [stream, count, hidden, selected, intervalMs, mode])
  useEffect(() => {
    if (!huntLive || mode !== 'cardHunt' || hidden || inspection || snapshot.submissions.length >= 50) return
    const timer = setInterval(() => simulation?.submit(), huntConfig.mockIntervalMs)
    return () => clearInterval(timer)
  }, [huntLive, mode, hidden, inspection, snapshot.submissions.length, simulation])
  const switchMode = (next: PublicScreenMode) => { if (!selected && !inspection) { setMode(next); setDebug(false) } }
  const close = () => setDetailClosing(true)
  const finishClose = useCallback(() => {
    detailOrigin.current.element?.removeAttribute('data-detail-selected')
    setSelected(null); setDetailClosing(false)
    requestAnimationFrame(() => returnFocus.current?.focus({ preventScroll: true }))
  }, [])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches('input,select,textarea') || e.ctrlKey || e.metaKey || e.altKey) return
      if (!selected && !inspection && !e.repeat && (e.key === '1' || e.key === '2')) { e.preventDefault(); setMode(e.key === '1' ? 'universe' : 'cardHunt'); setDebug(false) }
      if (e.key === 'Escape') { if (selected) close(); else setDebug(false) }
      if (e.key.toLowerCase() === 'd' && !selected && !inspection) setDebug(d => !d)
      if (e.key === 'Tab' && selected && dialog.current) {
        const items = dialog.current.querySelectorAll<HTMLElement>('button, [tabindex="0"]')
        const first = items[0], last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    addEventListener('keydown', key); return () => removeEventListener('keydown', key)
  }, [selected, inspection])
  useEffect(() => { if (selected) closeButton.current?.focus() }, [selected])
  const open = (card: UniverseCard) => {
    returnFocus.current = document.activeElement as HTMLElement
    const element = document.querySelector<HTMLElement>(`.ps-slot[data-card-id="${CSS.escape(card.id)}"]`)
    detailOrigin.current = { element, transform: element?.style.transform || 'translate(-50%,-50%) translate(1152px,1430px) scale(.6)', opacity: element ? Number(getComputedStyle(element).opacity) : 0 }
    element?.setAttribute('data-detail-selected', 'true')
    setDetailClosing(false); setSelected(card)
  }
  const simulate = (n: number) => { clearTimeout(pendingActivation.current); setStream(false); simulation?.setCount(n); setSelected(null) }
  return <div className="ps-viewport" onClick={event => {
    // Mock-only surface gesture. Real adapters never receive simulated submissions.
    if (!simulation || !clickMock || mode !== 'cardHunt' || inspection || selected || event.defaultPrevented) return
    if ((event.target as HTMLElement).closest('button,a,input,select,textarea,[role="tab"],.ps-debug,.ps-hunt-inspection')) return
    setHuntLive(false)
    simulation.submit()
  }}>
    <main className="ps-stage" data-native={`${publicScreenPreset.width}x${publicScreenPreset.height}`} data-hidden={hidden} style={{ transform: `translate(-50%,-50%) scale(${scale})` }}>
      <div className="ps-presentation" inert={!!selected || !!inspection}>
        <header className="ps-header"><img src={logo} alt="XPACK" /><p>Logoman Trade Night 2026</p></header>
        <nav className="ps-title ps-mode-switch" role="tablist" aria-label="Public Screen mode">
          {(['universe', 'cardHunt'] as const).map((item, index) => <Fragment key={item}>{index > 0 && <span aria-hidden="true" className="ps-mode-divider">|</span>}<button id={`mode-${item}`} role="tab" aria-selected={mode === item} aria-controls={`panel-${item}`} aria-keyshortcuts={String(index + 1)} tabIndex={mode === item ? 0 : -1} onClick={() => switchMode(item)} onKeyDown={event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 'universe' : event.key === 'End' ? 'cardHunt' : mode === 'universe' ? 'cardHunt' : 'universe'; switchMode(next); document.getElementById(`mode-${next}`)?.focus() } }}>{item === 'universe' ? 'LIVE CARD UNIVERSE' : 'CARD HUNT'}</button></Fragment>)}
        </nav>
        <div id="panel-universe" className="ps-mode-panel" role="tabpanel" aria-labelledby="mode-universe" data-active={mode === 'universe'} inert={mode !== 'universe'} aria-hidden={mode !== 'universe'}>
          <Universe cards={snapshot.cards} paused={!!selected || hidden || mode !== 'universe'} cameraLocked={cameraLocked} onOpen={open} />
          <footer className="ps-footer"><PoolCounter count={count} /></footer>
        </div>
        <div id="panel-cardHunt" className="ps-mode-panel" role="tabpanel" aria-labelledby="mode-cardHunt" data-active={mode === 'cardHunt'} inert={mode !== 'cardHunt'} aria-hidden={mode !== 'cardHunt'}>
          <CardHunt submissions={snapshot.submissions} hunt={snapshot.hunt} active={mode === 'cardHunt'} onInspect={setInspection} />
        </div>
      </div>
      {inspection && <HuntInspection selection={inspection} onClosed={closeInspection} />}
      {selected && <CardDetail card={selected} origin={detailOrigin.current} closing={detailClosing} dialogRef={dialog} closeButtonRef={closeButton} onClose={close} onClosed={finishClose} />}
    </main>
    {debug && simulation && !selected && !inspection && mode === 'cardHunt' && <aside className="ps-debug" aria-label="Card Hunt review controls"><header><b>Card Hunt · Mock Review</b><button onClick={() => setDebug(false)}>隱藏 D</button></header><fieldset><legend>Submissions</legend>{[0, 3, 10, 20, 50].map(n => <button key={n} aria-pressed={snapshot.submissions.length === n} onClick={() => { setHuntLive(false); simulation.setHuntCount(n) }}>{n}</button>)}</fieldset><button aria-pressed={clickMock} onClick={() => setClickMock(v => !v)}>{clickMock ? '點擊模擬已開啟' : '開啟點擊模擬'}</button><button disabled={snapshot.submissions.length >= 50} onClick={() => simulation.submit()}>新增一筆</button><button onClick={() => setHuntLive(v => !v)} disabled={snapshot.submissions.length >= 50}>{huntLive ? '暫停提交' : '持續提交'}</button><p>1 Universe · 2 Card Hunt<br />D 隱藏工具 · Esc 關閉 Inspection<br />每 4 秒新增一筆，最多 50 筆。</p><small>Mock only · 不接真實上傳，不判定卡牌。</small></aside>}
    {debug && simulation && !selected && mode === 'universe' && <aside className="ps-debug" aria-label="Public Screen 調試工具"><header><b>Live Universe · R6</b><button onClick={() => setDebug(false)}>隱藏 D</button></header><p>原生 2304 × 2784 · 目前縮放 {Math.round(scale * 100)}%</p><fieldset><legend>卡牌數量（Mock）</legend>{[0, 35, 50, 100, 300, 500].map(n => <button aria-pressed={count === n} key={n} onClick={() => simulate(n)}>{n}</button>)}</fieldset><div><button disabled={count >= 500} onClick={() => simulation.activate()}>點亮一張</button><button onClick={() => { simulate(499); pendingActivation.current = setTimeout(simulation.activate, 700) }}>499 → 500</button><button aria-pressed={stream} disabled={count >= 500} onClick={() => setStream(s => !s)}>{stream ? '暫停錄入' : '持續錄入'}</button></div><button onClick={() => { simulate(0); setIntervalMs(120); setStream(true) }}>從 0 連續點亮至 500</button><button onClick={() => setIntervalMs(5000)}>正常節奏 · 5 秒</button><p>每張逐一錄入 · {intervalMs === 120 ? '加速示範' : '正常節奏'}<br />Esc 關閉詳情 · D 隱藏工具</p><button aria-pressed={cameraLocked} onClick={() => setCameraLocked(v => !v)}>{cameraLocked ? '相機已鎖定' : '鎖定相機'}</button><label className="ps-search">尋找現場卡牌<input value={search} onChange={e => setSearch(e.target.value)} placeholder="卡名 / 暱稱 / 編號" /></label>{search && <div className="ps-search-results">{snapshot.cards.filter(c => `${c.name} ${c.uploaderNickname} ${c.id}`.toLowerCase().includes(search.toLowerCase())).slice(0, 8).map(c => <button key={c.id} onClick={() => open(c)}>{c.uploaderNickname} · {c.name}</button>)}</div>}<small>196 種卡面循環配置為 500 筆測試資料；未接真實上傳。</small></aside>}
  </div>
}
