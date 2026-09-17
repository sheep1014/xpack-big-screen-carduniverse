import { useEffect, useRef } from 'react'
export function PoolCounter({ count }: { count: number }) {
  const previous = useRef(count)
  const oldDigits = String(previous.current).padStart(3, '0')
  const digits = String(count).padStart(3, '0')
  useEffect(() => { previous.current = count }, [count])
  return <div className="ps-pool-count" aria-label={`當前卡池 ${count} 張`}>
    <div className="ps-pool-line" aria-hidden="true"><span>當前卡池</span><strong>{[...digits].map((digit, i) => <span className="ps-counter-digit" key={i}><span key={digit} className={`ps-digit-track${oldDigits[i] !== digit ? ' ps-digit-track--changing' : ''}`}><span>{oldDigits[i]}</span><span>{digit}</span></span></span>)}</strong><span>張</span></div>
    <div className="ps-pool-meter" aria-hidden="true"><span style={{ transform: `scaleX(${count / 500})` }} /><i key={count} /></div>
  </div>
}
