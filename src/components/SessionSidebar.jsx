import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteSession, formatSessionDate, getSessions, groupSessionsBySubject } from '../services/sessions'
import { useAppContext } from '../store/AppContext'
import styles from './SessionSidebar.module.css'

function SessionSidebar() {
  const navigate = useNavigate()
  const { sessionsRefreshToken, notifySessionsChanged, setSelectedSubject } = useAppContext()
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    setSessions(getSessions())
  }, [sessionsRefreshToken])

  const groupedSessions = useMemo(() => groupSessionsBySubject(sessions), [sessions])

  const handleRestore = (session) => {
    setSelectedSubject(session.subject ? { name: session.subject, emoji: '📚' } : null)
    navigate('/learn', { state: { restoredSession: session } })
  }

  const handleDelete = (event, sessionId) => {
    event.stopPropagation()
    deleteSession(sessionId)
    setSessions(getSessions())
    notifySessionsChanged()
  }

  const handleItemKeyDown = (event, session) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleRestore(session)
    }
  }

  return (
    <section className={styles.wrapper} aria-label="Sessions recentes">
      <h2 className={styles.title}>Sessions recentes</h2>

      {groupedSessions.length === 0 ? (
        <p className={styles.emptyState}>Aucune session enregistree.</p>
      ) : (
        <div className={styles.groups}>
          {groupedSessions.map((group) => (
            <div key={group.subject} className={styles.group}>
              <h3 className={styles.groupTitle}>{group.subject}</h3>
              <div className={styles.items}>
                {group.sessions.map((session) => (
                  <div
                    key={session.id}
                    className={styles.item}
                  >
                    <button
                      type="button"
                      className={styles.itemButton}
                      onClick={() => handleRestore(session)}
                      onKeyDown={(event) => handleItemKeyDown(event, session)}
                    >
                      <div className={styles.itemHeader}>
                        <strong className={styles.itemTitle}>{session.title}</strong>
                        <span className={styles.itemMode}>{session.mode}</span>
                      </div>
                      <div className={styles.itemMeta}>
                        <span>{formatSessionDate(session.date)}</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={(event) => handleDelete(event, session.id)}
                      aria-label={`Supprimer la session ${session.title}`}
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default SessionSidebar
