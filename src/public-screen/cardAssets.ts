import catalog from './assets/card-pool/catalog.json'
// Authorized 196-card set. Images are copied byte-for-byte from the supplied pack.
const images = import.meta.glob('./assets/card-pool/**/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const categories: Record<string, string> = { baseball: 'Baseball', basketball: 'Basketball', soccer: 'Soccer', tcg: 'Pokémon' }
const assets = catalog.map(identity => {
  const category = categories[identity.sport || identity.category] || 'Collectible'
  const image = images[`./assets/card-pool/${identity.relativePath}`]
  if (!image) throw new Error(`Missing card asset: ${identity.relativePath}`)
  return { id: identity.id, image, identity,
    // The supplied catalog uses generic identities, not verified player/card names.
    name: `${identity.year} ${category} Card ${identity.cardNumber}`,
    series: `${category} Collection`,
    grade: identity.gradeAgency && identity.gradeScore ? `${identity.gradeAgency} ${identity.gradeScore}${identity.condition.includes('PRISTINE') ? ' PRISTINE' : ''}` : 'Not specified',
  }
})
// Round-robin categories so the first screen does not show only baseball.
const groups = Object.values(categories).map(category => assets.filter(a => categories[a.identity.sport || a.identity.category] === category))
export const publicCardAssets = Array.from({ length: Math.max(...groups.map(g => g.length)) }, (_, i) => groups.flatMap(g => g[i] ? [g[i]] : [])).flat()
