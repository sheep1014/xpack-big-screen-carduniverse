/** Warm first-screen images without allowing slow/failed assets to block the stage. */
export async function preloadImages(urls: string[], onProgress: (loaded: number, total: number) => void, budgetMs = 8000) {
  const pending = [...new Set(urls)]
  let cursor = 0, completed = 0, expired = false
  const cancel = new Set<() => void>()
  const timer = setTimeout(() => {
    expired = true
    for (const stop of [...cancel]) stop()
  }, budgetMs)
  const load = (src: string) => new Promise<void>(resolve => {
    const image = new Image()
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      image.onload = image.onerror = null
      cancel.delete(stop)
      resolve()
    }
    const stop = () => { finish(); image.removeAttribute('src') }
    cancel.add(stop)
    // onload is enough to establish availability. Forcing decode of the entire
    // collection retains large bitmaps and can exhaust mobile browser memory.
    image.onload = image.onerror = finish
    image.src = src
  })
  try {
    await Promise.all(Array.from({ length: Math.min(4, pending.length) }, async () => {
      while (!expired && cursor < pending.length) {
        await load(pending[cursor++])
        if (!expired) onProgress(++completed, pending.length)
      }
    }))
  } finally { clearTimeout(timer) }
}
