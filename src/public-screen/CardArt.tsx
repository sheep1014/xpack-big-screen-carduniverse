import { useState } from 'react'
import type { UniverseCard } from './model'
export function CardArt({ card, full = false }: { card: UniverseCard; full?: boolean }) {
  const [failed, setFailed] = useState(false)
  return <span className="ps-art" data-failed={failed}>
    {failed ? <span className="ps-art-fallback">Card image unavailable</span> : <img src={full ? card.image : card.thumbnail || card.image} alt="" draggable={false} onError={() => setFailed(true)} />}
  </span>
}
