import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useMistral } from '../hooks/useMistral'
import { getDashboardSnapshot } from '../services'
import { formatSessionDate } from '../services/sessions'
import styles from './Dashboard.module.css'

const MOTIVATION_PROMPT =
  'Tu es un coach pédagogique concis et encourageant. A partir des statistiques fournies, rédige un message de motivation en francais en 2 ou 3 phrases maximum. Ne fais aucune liste, ne mentionne pas JSON, et reste concret sur les points forts et le prochain pas.'

const FLASHCARD_COLORS = ['#2563eb', '#16a34a']

function Dashboard() {
  const { send, isLoading } = useMistral()
  const [motivation, setMotivation] = useState('')
  const [motivationError, setMotivationError] = useState('')

  const snapshot = useMemo(() => getDashboardSnapshot(), [])
  const { streak, sessions, flashcards } = snapshot

  const flashcardChartData = useMemo(
    () => [
      { name: 'A revoir', value: flashcards.reviewCards },
      { name: 'Maîtrisées', value: flashcards.masteredCards },
    ],
    [flashcards.masteredCards, flashcards.reviewCards]
  )

  let motivationContent
  if (isLoading) {
    motivationContent = <p className={styles.loading}>Génération du message en cours...</p>
  } else if (motivation) {
    motivationContent = <p className={styles.motivation}>{motivation}</p>
  } else {
    motivationContent = (
      <p className={styles.motivationFallback}>
        {motivationError || 'Aucune motivation disponible pour le moment.'}
      </p>
    )
  }

  const summaryPrompt = useMemo(
    () =>
      [
        `Streak actuel: ${streak.streak} jour(s).`,
        `Sessions totales: ${sessions.totalSessions}.`,
        `Sessions par matiere: ${sessions.sessionsBySubject
          .map((item) => `${item.subject}=${item.count}`)
          .join(', ') || 'aucune'}.`,
        `Flashcards: ${flashcards.masteredCards} maîtrisees et ${flashcards.reviewCards} a revoir sur ${flashcards.totalCards} au total.`,
      ].join(' '),
    [flashcards.masteredCards, flashcards.reviewCards, flashcards.totalCards, sessions.sessionsBySubject, sessions.totalSessions, streak.streak]
  )

  useEffect(() => {
    let isMounted = true

    const generateMotivation = async () => {
      try {
        setMotivationError('')
        const answer = await send(
          [
            {
              role: 'user',
              content: summaryPrompt,
            },
          ],
          MOTIVATION_PROMPT
        )

        if (isMounted) {
          setMotivation(answer)
        }
      } catch (error) {
        if (!isMounted) {
          return
        }

        setMotivation('')
        const message = error instanceof Error ? error.message : 'Impossible de generer le message de motivation.'
        setMotivationError(message)
      }
    }

    generateMotivation()

    return () => {
      isMounted = false
    }
  }, [send, summaryPrompt])

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Progression</p>
          <h2 className={styles.title}>Dashboard</h2>
          <p className={styles.subtitle}>Suivi du streak, des sessions, des flashcards et des derniers etats de travail.</p>
        </div>

        <div className={styles.streakCard}>
          <span className={styles.streakValue}>{streak.streak}</span>
          <span className={styles.streakLabel}>jour(s) de streak</span>
          {streak.lastActiveDate && (
            <span className={styles.streakMeta}>Derniere activite: {formatSessionDate(streak.lastActiveDate)}</span>
          )}
        </div>
      </header>

      <div className={styles.statsGrid}>
        <article className={styles.statCard}>
          <h3 className={styles.sectionTitle}>Messages de motivation</h3>
          {motivationContent}
        </article>

        <article className={styles.statCard}>
          <h3 className={styles.sectionTitle}>Flashcards</h3>
          <div className={styles.flashcardNumbers}>
            <div>
              <span className={styles.number}>{flashcards.masteredCards}</span>
              <span className={styles.numberLabel}>Maîtrisées</span>
            </div>
            <div>
              <span className={styles.number}>{flashcards.reviewCards}</span>
              <span className={styles.numberLabel}>A revoir</span>
            </div>
          </div>
          {flashcards.totalCards === 0 ? (
            <p className={styles.emptyState}>Aucune flashcard enregistrée pour le moment.</p>
          ) : (
            <div className={styles.chartBox}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Tooltip />
                  <Pie
                    data={flashcardChartData.map((entry, index) => ({
                      ...entry,
                      fill: FLASHCARD_COLORS[index],
                    }))}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={90}
                    paddingAngle={2}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>
      </div>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Sessions par matière</h3>
          <p className={styles.sectionHint}>Le graphique affiche le volume de sessions enregistrées par sujet.</p>
        </div>
        {sessions.sessionsBySubject.length === 0 ? (
          <p className={styles.emptyState}>Aucune session enregistrée pour le moment.</p>
        ) : (
          <div className={styles.chartBoxLarge}>
            <ResponsiveContainer width="100%" height={Math.max(240, sessions.sessionsBySubject.length * 56)}>
              <BarChart data={sessions.sessionsBySubject} layout="vertical" margin={{ top: 10, right: 24, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dbe3ee" />
                <XAxis type="number" allowDecimals={false} stroke="#64748b" />
                <YAxis type="category" dataKey="subject" width={110} stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 8, 8, 0]} fill="#2563eb" barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Dernières sessions</h3>
          <p className={styles.sectionHint}>Clique pour reprendre exactement la conversation.</p>
        </div>
        {sessions.latestSessions.length === 0 ? (
          <p className={styles.emptyState}>Aucune session récente à reprendre.</p>
        ) : (
          <div className={styles.sessionsList}>
            {sessions.latestSessions.map((session) => (
              <article key={session.id} className={styles.sessionCard}>
                <div className={styles.sessionHeader}>
                  <div>
                    <p className={styles.sessionSubject}>{session.subject}</p>
                    <h4 className={styles.sessionTitle}>{session.title}</h4>
                  </div>
                  <span className={styles.sessionMode}>{session.mode}</span>
                </div>
                <p className={styles.sessionMeta}>
                  {formatSessionDate(session.date)} · {session.messages.length} message(s)
                </p>
                <Link
                  className={styles.sessionLink}
                  to="/learn"
                  state={{ restoredSession: session }}
                >
                  Reprendre
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}

export default Dashboard
