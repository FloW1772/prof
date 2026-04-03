import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useMistral } from '../hooks/useMistral'
import { useAppContext } from '../store/AppContext'
import styles from './Learn.module.css'

function buildSystemPrompt(subjectName) {
  return [
    'Tu es un professeur pedagogue et bienveillant.',
    `La matiere courante est: ${subjectName}.`,
    'Donne des explications claires, avec exemples concrets et etapes simples.',
    'Utilise du Markdown lisible (titres courts, listes, code si utile).',
  ].join(' ')
}

function Learn() {
  const { selectedSubject } = useAppContext()
  const { send, isLoading, error } = useMistral()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const endOfMessagesRef = useRef(null)

  const activeSubject = selectedSubject?.name || 'General'

  const systemPrompt = useMemo(
    () => buildSystemPrompt(activeSubject),
    [activeSubject]
  )

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

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
