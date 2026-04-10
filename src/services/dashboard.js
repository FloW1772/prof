import { getSessions } from './sessions'
import { isDueToday } from './spaced-repetition'

const STREAK_STORAGE_KEY = 'prof_streak'
const FLASHCARDS_STORAGE_KEY = 'prof.flashcards'
const MAX_TRACKED_DAYS = 90

function isBrowser() {
  return globalThis.window !== undefined && globalThis.localStorage !== undefined
}

function readJson(key, fallbackValue) {
  if (!isBrowser()) {
    return fallbackValue
  }

  try {
    const raw = localStorage.getItem(key)
    if (!raw) {
      return fallbackValue
    }

    return JSON.parse(raw)
  } catch {
    return fallbackValue
  }
}

function writeJson(key, value) {
  if (!isBrowser()) {
    return
  }

  localStorage.setItem(key, JSON.stringify(value))
}

function toLocalDateKey(date) {
  const resolved = new Date(date)
  const year = resolved.getFullYear()
  const month = String(resolved.getMonth() + 1).padStart(2, '0')
  const day = String(resolved.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function fromLocalDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function shiftLocalDateKey(dateKey, offsetDays) {
  const nextDate = fromLocalDateKey(dateKey)
  nextDate.setDate(nextDate.getDate() + offsetDays)
  return toLocalDateKey(nextDate)
}

function uniqueSortedDays(days) {
  return [...new Set(days)]
    .filter((day) => typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day))
    .sort((left, right) => fromLocalDateKey(right) - fromLocalDateKey(left))
}

function normalizeFlashcardCard(card) {
  if (!card || typeof card !== 'object') {
    return null
  }

  const score = Number.isFinite(card.score) ? card.score : 0
  const nextReviewDate = typeof card.nextReviewDate === 'string' ? card.nextReviewDate : ''

  return {
    ...card,
    score,
    nextReviewDate,
  }
}

function readTrackedDays() {
  const stored = readJson(STREAK_STORAGE_KEY, [])
  return Array.isArray(stored) ? uniqueSortedDays(stored) : []
}

function computeCurrentStreak(days) {
  if (days.length === 0) {
    return {
      streak: 0,
      lastActiveDate: null,
      trackedDays: [],
    }
  }

  const orderedDays = uniqueSortedDays(days)
  if (orderedDays.length === 0) {
    return {
      streak: 0,
      lastActiveDate: null,
      trackedDays: [],
    }
  }

  let streak = 1
  let cursor = orderedDays[0]

  for (let index = 1; index < orderedDays.length; index += 1) {
    const expectedPreviousDay = shiftLocalDateKey(cursor, -1)
    if (orderedDays[index] !== expectedPreviousDay) {
      break
    }

    streak += 1
    cursor = orderedDays[index]
  }

  return {
    streak,
    lastActiveDate: orderedDays[0],
    trackedDays: orderedDays,
  }
}

export function recordStudyActivity(date = new Date()) {
  if (!isBrowser()) {
    return getStreakData()
  }

  const dayKey = toLocalDateKey(date)
  const trackedDays = readTrackedDays()
  const nextTrackedDays = [dayKey, ...trackedDays.filter((item) => item !== dayKey)].slice(
    0,
    MAX_TRACKED_DAYS
  )

  writeJson(STREAK_STORAGE_KEY, nextTrackedDays)
  return computeCurrentStreak(nextTrackedDays)
}

export function getStreakData() {
  return computeCurrentStreak(readTrackedDays())
}

export function getSessionStats() {
  const sessions = getSessions()

  const sessionsPerSubject = sessions.reduce((accumulator, session) => {
    const subject = session.subject || 'General'
    const existing = accumulator.get(subject) || 0
    accumulator.set(subject, existing + 1)
    return accumulator
  }, new Map())

  const sessionsBySubject = [...sessionsPerSubject.entries()]
    .map(([subject, count]) => ({ subject, count }))
    .sort((left, right) => right.count - left.count || left.subject.localeCompare(right.subject))

  return {
    totalSessions: sessions.length,
    sessionsBySubject,
    latestSessions: sessions.slice(0, 3),
  }
}

export function getFlashcardStats() {
  const stored = readJson(FLASHCARDS_STORAGE_KEY, null)
  const cards = Array.isArray(stored?.cards) ? stored.cards.map(normalizeFlashcardCard).filter(Boolean) : []

  const mastered = cards.filter((card) => {
    const hasStrongScore = Number(card.score) >= 4
    const isScheduledAhead = card.nextReviewDate ? !isDueToday(card.nextReviewDate) : false
    return hasStrongScore && isScheduledAhead
  }).length

  return {
    totalCards: cards.length,
    masteredCards: mastered,
    reviewCards: Math.max(cards.length - mastered, 0),
    topic: typeof stored?.topic === 'string' ? stored.topic : '',
  }
}

export function getDashboardSnapshot() {
  const streak = getStreakData()
  const sessions = getSessionStats()
  const flashcards = getFlashcardStats()

  return {
    streak,
    sessions,
    flashcards,
  }
}
