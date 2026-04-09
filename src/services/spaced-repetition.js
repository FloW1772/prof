const DAY_IN_MS = 24 * 60 * 60 * 1000
const MIN_EASINESS = 1.3

function clampQuality(quality) {
  if (quality < 0) {
    return 0
  }

  if (quality > 5) {
    return 5
  }

  return quality
}

function toStartOfDay(date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function addDays(baseDate, days) {
  return new Date(toStartOfDay(baseDate).getTime() + days * DAY_IN_MS)
}

function getEasinessAfterReview(easinessFactor, quality) {
  const delta = 5 - quality
  const updated = easinessFactor + (0.1 - delta * (0.08 + delta * 0.02))
  return Math.max(MIN_EASINESS, Number(updated.toFixed(2)))
}

export function isDueToday(nextReviewDate, now = new Date()) {
  if (!nextReviewDate) {
    return true
  }

  const reviewDay = toStartOfDay(new Date(nextReviewDate)).getTime()
  const today = toStartOfDay(now).getTime()

  return reviewDay <= today
}

export function ensureCardScheduling(card, now = new Date()) {
  const intervalDays = Number.isFinite(card.intervalDays) ? Math.max(0, card.intervalDays) : 0
  const easinessFactor = Number.isFinite(card.easinessFactor)
    ? Math.max(MIN_EASINESS, card.easinessFactor)
    : 2.5
  const repetitions = Number.isFinite(card.repetitions) ? Math.max(0, card.repetitions) : 0
  const score = Number.isFinite(card.score) ? clampQuality(card.score) : 0
  const nextReviewDate = card.nextReviewDate || toStartOfDay(now).toISOString()

  return {
    ...card,
    score,
    intervalDays,
    easinessFactor,
    repetitions,
    nextReviewDate,
  }
}

export function applySm2Review(card, quality, now = new Date()) {
  const safeCard = ensureCardScheduling(card, now)
  const normalizedQuality = clampQuality(quality)

  let repetitions = safeCard.repetitions
  let intervalDays

  if (normalizedQuality < 3) {
    repetitions = 0
    intervalDays = 1
  } else {
    repetitions += 1

    if (repetitions === 1) {
      intervalDays = 1
    } else if (repetitions === 2) {
      intervalDays = 6
    } else {
      intervalDays = Math.max(1, Math.round(safeCard.intervalDays * safeCard.easinessFactor))
    }
  }

  const easinessFactor = getEasinessAfterReview(safeCard.easinessFactor, normalizedQuality)
  const nextReviewDate = addDays(now, intervalDays).toISOString()

  return {
    ...safeCard,
    score: normalizedQuality,
    intervalDays,
    easinessFactor,
    repetitions,
    nextReviewDate,
  }
}

export function sortByDueFirst(cards, now = new Date()) {
  return [...cards].sort((left, right) => {
    const leftDue = isDueToday(left.nextReviewDate, now)
    const rightDue = isDueToday(right.nextReviewDate, now)

    if (leftDue !== rightDue) {
      return leftDue ? -1 : 1
    }

    const leftTime = new Date(left.nextReviewDate).getTime()
    const rightTime = new Date(right.nextReviewDate).getTime()

    return leftTime - rightTime
  })
}
