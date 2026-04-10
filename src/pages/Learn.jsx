import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useLocation } from 'react-router-dom'
import { useMistral } from '../hooks/useMistral'
import { getSystemPromptByMode, LEARNING_MODES } from '../services/prompts'
import { buildSessionFromMessages, saveSession } from '../services/sessions'
import { recordStudyActivity } from '../services/dashboard'
import { useAppContext } from '../store/AppContext'
import styles from './Learn.module.css'

function Learn() {
  const { selectedSubject, notifySessionsChanged } = useAppContext()
  const location = useLocation()
  const restoredSession = location.state?.restoredSession ?? null
  const { send, isLoading, error } = useMistral()
  const [messages, setMessages] = useState(() =>
    Array.isArray(restoredSession?.messages) ? restoredSession.messages : []
  )
  const [input, setInput] = useState('')
  const [mode, setMode] = useState(() => restoredSession?.mode || 'chat-libre')
  const sessionIdRef = useRef(restoredSession?.id || null)
  const endOfMessagesRef = useRef(null)

  const activeSubject = selectedSubject?.name || 'General'

  const systemPrompt = useMemo(
    () => getSystemPromptByMode(mode, activeSubject),
    [mode, activeSubject]
  )

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    if (messages.length === 0) {
      return
    }

    const nextSessionId = sessionIdRef.current || `session-${Date.now()}`
    sessionIdRef.current = nextSessionId

    const nextSession = buildSessionFromMessages({
      id: nextSessionId,
      subject: activeSubject,
      mode,
      messages,
    })

    saveSession(nextSession)
    notifySessionsChanged()
  }, [activeSubject, messages, mode, notifySessionsChanged])

  const handleSend = async () => {
    const content = input.trim()
    if (!content || isLoading) {
      return
    }

    const userMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content,
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    recordStudyActivity()

    try {
      const mistralMessages = updatedMessages.map((message) => ({
        role: message.role,
        content: message.content,
      }))

      const aiAnswer = await send(mistralMessages, systemPrompt)

      setMessages((previous) => [
        ...previous,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: aiAnswer,
        },
      ])
    } catch {
      // Error state is handled by useMistral and displayed in the UI.
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h2 className={styles.title}>Learn</h2>
        <p className={styles.subtitle}>
          Matiere active: <strong>{activeSubject}</strong>
        </p>
        <div className={styles.modeRow}>
          <label className={styles.modeLabel} htmlFor="learning-mode">
            Mode d apprentissage
          </label>
          <select
            id="learning-mode"
            className={styles.modeSelect}
            value={mode}
            onChange={(event) => setMode(event.target.value)}
          >
            {LEARNING_MODES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className={styles.messages}>
        {messages.length === 0 && (
          <div className={styles.emptyState}>
            Pose ta premiere question pour commencer la conversation.
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.row} ${message.role === 'user' ? styles.userRow : styles.aiRow}`}
          >
            <article
              className={`${styles.bubble} ${
                message.role === 'user' ? styles.userBubble : styles.aiBubble
              }`}
            >
              {message.role === 'assistant' ? (
                <ReactMarkdown>{message.content}</ReactMarkdown>
              ) : (
                <p className={styles.userText}>{message.content}</p>
              )}
            </article>
          </div>
        ))}

        {isLoading && (
          <div className={`${styles.row} ${styles.aiRow}`}>
            <article className={`${styles.bubble} ${styles.aiBubble}`}>
              <div className={styles.typing} aria-label="L'IA ecrit une reponse">
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
              </div>
            </article>
          </div>
        )}

        <div ref={endOfMessagesRef}></div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.composer}>
        <textarea
          className={styles.textarea}
          placeholder="Ecris ta question ici..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
        />
        <button
          type="button"
          className={styles.sendButton}
          onClick={handleSend}
          disabled={isLoading || input.trim().length === 0}
        >
          Envoyer
        </button>
      </div>
    </section>
  )
}

export default Learn
