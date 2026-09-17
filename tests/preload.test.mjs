import { test } from 'node:test'
import assert from 'node:assert/strict'
import { preloadImages } from '../src/public-screen/preload.ts'
function images(mode) {
  const seen = []; let active = 0, peak = 0, decoded = 0
  globalThis.Image = class {
    set src(value) {
      seen.push(value); active++; peak = Math.max(peak, active)
      if (mode !== 'hang') setTimeout(() => { active--; (mode === 'fail' ? this.onerror : this.onload)?.() }, 1)
    }
    removeAttribute() { active-- }
    decode() { decoded++; return Promise.reject(new Error('mobile decode rejected')) }
  }
  return { seen, peak: () => peak, active: () => active, decoded: () => decoded }
}
test('deduplicates requests and limits image concurrency without forced decode', async () => {
  const state = images('ok'); const progress = []
  await preloadImages(['a','b','a','c','d','e','f'], (n,total) => progress.push([n,total]), 1000)
  assert.equal(state.seen.length,6); assert.ok(state.peak() <= 4); assert.equal(state.decoded(),0)
  assert.deepEqual(progress.at(-1),[6,6])
})
test('failed card images cannot block startup', async () => {
  const state = images('fail'); await preloadImages(['a','b','c','d','e'],()=>{},1000)
  assert.equal(state.seen.length,5)
})
test('global deadline releases hanging requests and stops queueing more', async () => {
  const state = images('hang'); const before=Date.now()
  await preloadImages(['a','b','c','d','e','f'],()=>{},30)
  assert.ok(Date.now()-before < 500); assert.equal(state.seen.length,4); assert.equal(state.active(),0)
})
test('empty preload list completes immediately', async () => { await preloadImages([],()=>{},1000) })
