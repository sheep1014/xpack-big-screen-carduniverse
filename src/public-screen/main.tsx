import React from 'react'
import { createRoot } from 'react-dom/client'
import { createMockAdapter, publicMockAssets } from './model'
import { preloadImages } from './preload'
import logo from './assets/xpack-logo.svg'

const status = document.getElementById('boot-status')!
const retry = document.getElementById('boot-retry') as HTMLButtonElement
const query = new URLSearchParams(location.search)
const initial = createMockAdapter(query.has('count') ? Number(query.get('count')) : 0, Number(query.get('huntCount') || 0)).getSnapshot()
const firstImages = query.get('mode') === 'cardHunt'
  ? initial.submissions.map(item => item.cardImage)
  : initial.cards.map(card => card.image)
// Limit speculative work; actual card elements load the remaining images on demand.
const urls = [logo, ...firstImages.slice(0, 48), ...(!firstImages.length ? publicMockAssets.slice(0, 3).map(asset => asset.image) : [])]
let busy = false
async function boot() {
  if (busy) return
  busy = true
  retry.hidden = true
  status.textContent = '正在準備收藏資產…'
  try {
    const [{ default: App }] = await Promise.all([
      import('./App'),
      preloadImages(urls, (loaded, total) => { status.textContent = `正在準備收藏資產 · ${loaded} / ${total}` }),
    ])
    createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
  } catch {
    status.textContent = '展示內容未能載入，請檢查網絡後重試'
    retry.hidden = false
    retry.onclick = () => location.reload()
  } finally { busy = false }
}
retry.onclick = () => { void boot() }
void boot()
