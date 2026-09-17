import React from 'react'
import { createRoot } from 'react-dom/client'
import { publicMockAssets } from './model'
import logo from './assets/xpack-logo.svg'

// Keep the inline shell visible until code, styles and every local card decode.
const status = document.getElementById('boot-status')!
const retry = document.getElementById('boot-retry') as HTMLButtonElement
const urls = [...new Set([...publicMockAssets.map(asset => asset.image), logo])]
const decoded = new Set<string>()
function loadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const timer = setTimeout(() => { image.onload = image.onerror = null; reject(new Error('Image timeout')) }, 45000)
    image.onload = () => { image.decode().then(() => { clearTimeout(timer); resolve() }, error => { clearTimeout(timer); reject(error) }) }
    image.onerror = () => { clearTimeout(timer); reject(new Error('Image unavailable')) }
    image.src = src
  })
}
let busy = false
async function boot() {
  if (busy) return
  busy = true
  retry.hidden = true
  status.textContent = '正在準備收藏資產…'
  try {
    const app = import('./App').catch(error => { retry.onclick = () => location.reload(); throw error })
    const pending = urls.filter(src => !decoded.has(src))
    let cursor = 0
    // Start the per-image timeout only when its request enters this worker pool.
    const workers = Array.from({ length: Math.min(6, pending.length) }, async () => {
      while (cursor < pending.length) {
        const src = pending[cursor++]
        await loadImage(src)
        decoded.add(src)
        status.textContent = `正在準備收藏資產 · ${decoded.size} / ${urls.length}`
      }
    })
    const [results, { default: App }] = await Promise.all([Promise.allSettled(workers), app])
    if (results.some(result => result.status === 'rejected')) throw new Error('Assets incomplete')
    await document.fonts.ready
    createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
  } catch {
    status.textContent = '部分資源尚未載入，請檢查網絡後重試'
    retry.hidden = false
  } finally { busy = false }
}
retry.onclick = () => { void boot() }
void boot()
