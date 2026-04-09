import { useEffect, useMemo, useState } from 'react'
import { useMistral } from '../hooks/useMistral'
import styles from './Flashcards.module.css'

const STORAGE_KEY = 'prof.flashcards'
const SYSTEM_PROMPT =
  'Tu es un générateur de flashcards pédagogiques. Réponds UNIQUEMENT en JSON valide, format : [{"front":"question","back":"réponse"}]. Génère 8 flashcards sur le sujet donné.'

function normalizeFlashcards(raw) {
  if (!Array.isArray(raw)) {
    throw new TypeError('Le format retourne doit etre un tableau JSON.')
  }

  const cards = raw
    .filter((item) => item && typeof item.front === 'string' && typeof item.back === 'string')
    .map((item, index) => ({
      id: `card-${Date.now()}-${index}`,
      front: item.front.trim(),
      back: item.back.trim(),
    }))
    .filter((item) => item.front.length > 0 && item.back.length > 0)

  if (cards.length === 0) {
    throw new Error('Aucune flashcard valide n a ete retournee.')
  }

  return cards
}

function parseFlashcardsResponse(answer) {
  const content = answer.trim()

  try {
    return normalizeFlashcards(JSON.parse(content))
  } catch {
    // Tolerance in case the model wraps JSON in code fences.
    const withoutFences = content
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')

    return normalizeFlashcards(JSON.parse(withoutFences))
  }
}

function Flashcards() {
  const { send, isLoading, error } = useMistral()
  const [topic, setTopic] = useState('')
  const [cards, setCards] = useState([])
  const [savedTopic, setSavedTopic] = useState('')
  const [parseError, setParseError] = useState('')
  const [flippedIds, setFlippedIds] = useState([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) {
        return
      }

      const parsed = JSON.parse(saved)
      if (parsed && Array.isArray(parsed.cards)) {
        setCards(parsed.cards)
        setSavedTopic(typeof parsed.topic === 'string' ? parsed.topic : '')
      }
    } catch {
      // Ignore invalid localStorage payload.
    }
  }, [])

  useEffect(() => {
    if (cards.length === 0 && !savedTopic) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ topic: savedTopic, cards }))
  }, [cards, savedTopic])

  const canGenerate = useMemo(() => topic.trim().length > 0 && !isLoading, [topic, isLoading])

  const handleGenerate = async () => {
    const normalizedTopic = topic.trim()
    if (!normalizedTopic || isLoading) {
      return
    }

    setParseError('')

    try {
      const answer = await send(
        [
          {
            role: 'user',
            content: normalizedTopic,
          },
        ],
        SYSTEM_PROMPT
      )

      const nextCards = parseFlashcardsResponse(answer)
      setCards(nextCards)
      setSavedTopic(normalizedTopic)
      setFlippedIds([])
    } catch (err) {
      if (err instanceof SyntaxError) {
        setParseError('La reponse de Mistral n est pas un JSON valide.')
        return
      }

      const message = err instanceof Error ? err.message : ''
      if (message.toLowerCase().includes('json')) {
        setParseError('La reponse de Mistral n est pas au format JSON attendu.')
      }
    }
  }

  const toggleCard = (cardId) => {
    setFlippedIds((previous) =>
      previous.includes(cardId)
        ? previous.filter((id) => id !== cardId)
        : [...previous, cardId]
    )
  }

  const handleClearCards = () => {
    setCards([])
    setSavedTopic('')
    setFlippedIds([])
    setParseError('')
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h2 className={styles.title}>Flashcards</h2>
        <p className={styles.subtitle}>Genere des cartes de revision en un clic.</p>
      </header>

      <div className={styles.controls}>
        <label className={styles.label} htmlFor="flashcards-topic">
          Sujet precis
        </label>
        <div className={styles.inputRow}>
          <input
            id="flashcards-topic"
            className={styles.input}
            type="text"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="Ex: Thermodynamique, Guerre froide, React Hooks..."
          />
          <button
            type="button"
            className={styles.generateButton}
            onClick={handleGenerate}
            disabled={!canGenerate}
          >
            {isLoading ? 'Generation...' : 'Generer'}
          </button>
          <button
            type="button"
            className={styles.clearButton}
            onClick={handleClearCards}
            disabled={cards.length === 0 && !savedTopic}
          >
            Effacer les cartes
          </button>
        </div>
      </div>

      {savedTopic && cards.length > 0 && (
        <p className={styles.meta}>
          Derniere generation: <strong>{savedTopic}</strong> ({cards.length} cartes)
        </p>
      )}

      {error && <p className={styles.error}>{error}</p>}
      {parseError && <p className={styles.error}>{parseError}</p>}

      {cards.length === 0 ? (
        <div className={styles.emptyState}>
          Aucune flashcard pour le moment. Saisis un sujet puis clique sur Generer.
        </div>
      ) : (
        <div className={styles.grid}>
          {cards.map((card) => {
            const isFlipped = flippedIds.includes(card.id)
            return (
              <button
                key={card.id}
                type="button"
                className={styles.card}
                onClick={() => toggleCard(card.id)}
                aria-pressed={isFlipped}
              >
                <div className={`${styles.cardInner} ${isFlipped ? styles.flipped : ''}`}>
                  <article className={`${styles.face} ${styles.front}`}>
                    <h3 className={styles.faceLabel}>Question</h3>
                    <p className={styles.faceText}>{card.front}</p>
                  </article>
                  <article className={`${styles.face} ${styles.back}`}>
                    <h3 className={styles.faceLabel}>Reponse</h3>
                    <p className={styles.faceText}>{card.back}</p>
                  </article>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default Flashcards
