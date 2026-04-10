const STORAGE_KEY = 'prof_sessions'
const MAX_SESSIONS = 50
const TITLE_MAX_LENGTH = 48

function isBrowser() {
  return globalThis.window !== undefined && typeof localStorage !== 'undefined'
}

function toStartOfDay(date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function truncateTitle(text) {
  const compact = text.trim().replaceAll(/\s+/g, ' ')
  if (compact.length <= TITLE_MAX_LENGTH) {
    return compact
  }

  return `${compact.slice(0, TITLE_MAX_LENGTH - 1).trimEnd()}…`
}

function pickFirstUserMessage(messages) {
  if (!Array.isArray(messages)) {
    return ''
  }

  const firstUserMessage = messages.find((message) => message?.role === 'user')
  return typeof firstUserMessage?.content === 'string' ? firstUserMessage.content : ''
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) {
    return []
  }

  return messages
    .filter(
      (message) =>
        message &&
        typeof message.id === 'string' &&
        typeof message.role === 'string' &&
        typeof message.content === 'string'
    )
    .map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
    }))
}

function normalizeSession(session) {
  if (!session || typeof session.id !== 'string') {
    return null
  }

  const messages = normalizeMessages(session.messages)
  const subject = typeof session.subject === 'string' && session.subject.trim()
    ? session.subject.trim()
    : 'General'
  const mode = typeof session.mode === 'string' && session.mode.trim()
    ? session.mode.trim()
    : 'chat-libre'
  const date = typeof session.date === 'string' && !Number.isNaN(Date.parse(session.date))
    ? session.date
    : new Date().toISOString()
  const title =
    typeof session.title === 'string' && session.title.trim()
      ? truncateTitle(session.title)
      : truncateTitle(pickFirstUserMessage(messages) || 'Nouvelle session')

  return {
    id: session.id,
    subject,
    mode,
    title,
    date,
    messages,
  }
}

function readStoredSessions() {
  if (!isBrowser()) {
    return []
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.map(normalizeSession).filter(Boolean)
  } catch {
    return []
  }
}

function writeStoredSessions(sessions) {
  if (!isBrowser()) {
    return []
  }

  const normalized = sessions
    .map(normalizeSession)
    .filter(Boolean)
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, MAX_SESSIONS)

  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  return normalized
}

export function getSessions() {
  return readStoredSessions()
}

export function saveSession(session) {
  const current = readStoredSessions()
  const normalized = normalizeSession(session)

  if (!normalized) {
    return current
  }

  const nextSession = {
    ...normalized,
    title:
      normalized.title ||
      truncateTitle(pickFirstUserMessage(normalized.messages) || 'Nouvelle session'),
    date: new Date().toISOString(),
  }

  const nextSessions = [
    nextSession,
    ...current.filter((item) => item.id !== nextSession.id),
  ]

  return writeStoredSessions(nextSessions)
}

export function deleteSession(sessionId) {
  const current = readStoredSessions()
  const nextSessions = current.filter((session) => session.id !== sessionId)
  return writeStoredSessions(nextSessions)
}

export function buildSessionFromMessages({ id, subject, mode, messages, title, date }) {
  const normalizedMessages = normalizeMessages(messages)
  const resolvedTitle =
    typeof title === 'string' && title.trim()
      ? truncateTitle(title)
      : truncateTitle(pickFirstUserMessage(normalizedMessages) || 'Nouvelle session')

  return normalizeSession({
    id,
    subject,
    mode,
    title: resolvedTitle,
    date: date || new Date().toISOString(),
    messages: normalizedMessages,
  })
}

export function groupSessionsBySubject(sessions) {
  const groups = new Map()

  sessions.forEach((session) => {
    const subject = session.subject || 'General'
    if (!groups.has(subject)) {
      groups.set(subject, [])
    }

    groups.get(subject).push(session)
  })

  return [...groups.entries()]
    .map(([subject, subjectSessions]) => ({
      subject,
      sessions: subjectSessions.sort(
        (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()
      ),
      latestDate: subjectSessions.reduce((latest, session) => {
        const sessionTime = new Date(session.date).getTime()
        return Math.max(latest, sessionTime)
      }, 0),
    }))
    .sort((left, right) => right.latestDate - left.latestDate)
}

export function formatSessionDate(date) {
  const resolvedDate = new Date(date)
  if (Number.isNaN(resolvedDate.getTime())) {
    return ''
  }

  return toStartOfDay(resolvedDate).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  })
}
