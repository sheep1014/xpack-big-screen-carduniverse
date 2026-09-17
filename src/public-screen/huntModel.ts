import type { CardHuntSubmission } from './model'
import { publicCardAssets } from './cardAssets'

// Mock-only configuration. Replace this data or provide a PublicScreenAdapter later;
// transport, validation and host decisions are deliberately outside the screen.
export const huntConfig = {
  title: 'CARD HUNT', roundLabel: 'ROUND 01', status: '接受提交中',
  challengeText: '上傳一張火屬性 Pokémon 卡牌',
  startedAt: '2026-10-10T19:30:00+08:00', mockIntervalMs: 4000,
}
const nicknames = ['阿楓', 'Mika', 'Ryan', '葡撻不加糖', 'Kiki', '阿謙', '南灣散步', 'Luna', '小島卡友', 'Jason', '白桃烏龍', '卡冊第七頁']
export function normalizeHuntCount(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.min(50, Math.floor(value))) : 0
}
export function createHuntSubmission(index: number): CardHuntSubmission {
  const assets = publicCardAssets.filter(asset => asset.identity.category === 'tcg')
  const asset = assets[(index * 5 + 5) % assets.length]
  const identity = asset.identity
  return {
    cardDetails: { name: asset.name, series: asset.series, estimatedValue: 800 + (index % 20) * 100, year: identity.year, cardNumber: identity.cardNumber,
      grade: asset.grade,
      language: identity.language === '日文版' ? 'Japanese' : identity.language === '英文版' ? 'English' : 'Not specified' },
    id: `hunt-001-${String(index + 1).padStart(3, '0')}`, userId: `collector-${index + 1}`,
    rank: index + 1, cardImage: asset.image,
    username: nicknames[index % nicknames.length],
    timestamp: new Date(Date.parse(huntConfig.startedAt) + (index * 7 + Math.floor(index / 3) * 2 + 4) * 1000).toISOString(),
  }
}
export const huntTime = (timestamp: string) => new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Macau', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
}).format(new Date(timestamp))
export const huntRank = (rank: number) => `#${String(rank).padStart(2, '0')}`

// Display order, independent of the stable numeric submission identifier.
export const huntOrder = (rank: number) => `No.${rank}`
