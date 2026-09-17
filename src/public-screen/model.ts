import { createHuntSubmission, huntConfig, normalizeHuntCount } from './huntModel'
import { publicCardAssets } from './cardAssets'
// User authorized direct reuse of POC assets on 2026-09-16. No source files are modified.
export const publicMockAssets = publicCardAssets
export type ValueTier = 'premium' | 'high' | 'normal'
export interface UniverseCard {
  id: string; image: string; thumbnail?: string
  name: string; estimatedValue: number; valueTier: ValueTier; uploaderNickname: string
  createdAt: string; isNew: boolean; metadata: string
}
export interface CardHuntSubmission {
  id: string; userId: string; username: string; cardImage: string
  timestamp: string; rank: number
  cardDetails?: { name: string; series: string; year?: string; cardNumber?: string; grade: string; language: string; estimatedValue: number }
}
export interface CurrentHunt { roundId: string; challengeText: string; startedAt: string }
export interface PublicScreenSnapshot {
  cards: readonly UniverseCard[]; submissions: readonly CardHuntSubmission[]
  hunt: CurrentHunt; revision: number
}
export type PublicScreenEvent =
  | { type: 'snapshot'; snapshot: PublicScreenSnapshot }
  | { type: 'card.upsert'; card: UniverseCard }
  | { type: 'hunt.submission'; roundId: string; submission: CardHuntSubmission }
  | { type: 'hunt.started'; hunt: CurrentHunt }
/** Transport boundary: UI never reads a socket or owns transport ordering. */
export interface PublicScreenAdapter {
  getSnapshot(): PublicScreenSnapshot
  subscribe(listener: () => void): () => void
  connect(): () => void
}
const mockNicknames = ['阿謙', '小島卡友', 'Mika收藏簿', '阿朗', '葡撻不加糖', '卡仔Ken', '小滿', '阿澄', '南灣散步', 'Kiki', '紙上星球', '阿樂', '波子汽水', 'Ryan的卡冊', '小魚', '阿軒', '星期六收藏家', 'Nana', '阿森', '海邊拾卡', '小晴', 'Jason', '白桃烏龍', '阿浩', 'Luna', '卡冊第七頁', '阿盈', '小北', '城中慢遊', 'Andy', '阿然', '小宇', '夜貓卡友', '阿熙', '檸檬茶少冰', '阿晴', 'Sam收藏日記', '小圓', '阿楓', '栗子']
export function createMockCard(index: number, isNew = false): UniverseCard {
  const id = `public-${String(index + 1).padStart(3, '0')}`
  const asset = publicMockAssets[index % publicMockAssets.length]
  const valueTier: ValueTier = index % 23 === 0 ? 'premium' : index % 7 === 0 ? 'high' : 'normal'
  return { id, image: asset.image, thumbnail: asset.image,
    name: asset.name, estimatedValue: valueTier === 'premium' ? 28000 + index * 100 : valueTier === 'high' ? 6800 + index * 10 : 800 + (index % 20) * 100,
    valueTier, uploaderNickname: mockNicknames[index % mockNicknames.length],
    createdAt: new Date(Date.parse('2026-10-10T14:00:00+08:00') + index * 11000).toISOString(),
    isNew, metadata: `${asset.identity.year} · ${asset.grade} · Graded · ${asset.identity.cardNumber || 'Collectible'}`,
  }
}
export function normalizeCount(count: number) { return Number.isFinite(count) ? Math.min(500, Math.max(0, Math.floor(count))) : 500 }
export function createMockAdapter(initialCount: number, initialHuntCount = 0) {
  let snapshot: PublicScreenSnapshot = {
    cards: Array.from({ length: normalizeCount(initialCount) }, (_, i) => createMockCard(i)),
    submissions: Array.from({ length: normalizeHuntCount(initialHuntCount) }, (_, i) => createHuntSubmission(i)), hunt: { roundId: 'round-001', challengeText: huntConfig.challengeText, startedAt: huntConfig.startedAt }, revision: 0,
  }
  const listeners = new Set<() => void>()
  const emit = (patch: Partial<PublicScreenSnapshot>) => { snapshot = { ...snapshot, ...patch, revision: snapshot.revision + 1 }; listeners.forEach(fn => fn()) }
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } },
    connect: () => () => {},
    setCount: (count: number) => emit({ cards: Array.from({ length: normalizeCount(count) }, (_, i) => createMockCard(i)) }),
    activate: () => {
      if (snapshot.cards.length >= 500) return null
      const card = createMockCard(snapshot.cards.length, true)
      emit({ cards: [...snapshot.cards.map(c => c.isNew ? { ...c, isNew: false } : c), card] }); return card.id
    },
    setHuntCount: (count: number) => emit({ submissions: Array.from({ length: normalizeHuntCount(count) }, (_, i) => createHuntSubmission(i)) }),
    submit: () => {
      if (snapshot.submissions.length >= 50) return null
      const submission = createHuntSubmission(snapshot.submissions.length)
      emit({ submissions: [...snapshot.submissions, submission] }); return submission.id
    },
    settle: () => {
      if (snapshot.cards.some(c => c.isNew)) emit({ cards: snapshot.cards.map(c => c.isNew ? { ...c, isNew: false } : c) })
    },
  } satisfies PublicScreenAdapter & Record<string, unknown>
}
export const money = (amount: number) => new Intl.NumberFormat('zh-MO', { maximumFractionDigits: 0 }).format(amount)
