import { useMemo, useState } from 'react'
import { useAppContext } from '../store/AppContext'
import styles from './SubjectPicker.module.css'

const predefinedSubjects = [
  { name: 'Maths', emoji: '📐' },
  { name: 'Physique', emoji: '⚛️' },
  { name: 'Histoire', emoji: '🏛️' },
  { name: 'Francais', emoji: '📚' },
  { name: 'Anglais', emoji: '🇬🇧' },
  { name: 'Informatique', emoji: '💻' },
  { name: 'Biologie', emoji: '🧬' },
  { name: 'Philosophie', emoji: '🧠' },
  { name: 'Economie', emoji: '📊' },
  { name: 'Geographie', emoji: '🌍' },
  { name: 'Chimie', emoji: '🧪' },
  { name: 'Arts', emoji: '🎨' },
]

function SubjectPicker() {
  const [customSubject, setCustomSubject] = useState('')
  const [customSubjects, setCustomSubjects] = useState([])
  const { selectedSubject, setSelectedSubject } = useAppContext()

  const allSubjects = useMemo(
    () => [...predefinedSubjects, ...customSubjects],
    [customSubjects]
  )

  const handleAddSubject = (event) => {
    event.preventDefault()

    const cleanName = customSubject.trim()
    if (!cleanName) {
      return
    }

    const exists = allSubjects.some(
      (subject) => subject.name.toLowerCase() === cleanName.toLowerCase()
    )

    if (!exists) {
      const newSubject = { name: cleanName, emoji: '✨' }
      setCustomSubjects((previous) => [...previous, newSubject])
      setSelectedSubject(newSubject)
    }

    setCustomSubject('')
  }

  return (
    <section className={styles.wrapper}>
      <h3 className={styles.title}>Choisis une matiere</h3>

      <div className={styles.grid}>
        {allSubjects.map((subject) => {
          const isActive = selectedSubject?.name === subject.name
          return (
            <button
              key={subject.name}
              type="button"
              className={`${styles.card} ${isActive ? styles.active : ''}`}
              onClick={() => setSelectedSubject(subject)}
            >
              <span className={styles.emoji}>{subject.emoji}</span>
              <span className={styles.name}>{subject.name}</span>
            </button>
          )
        })}
      </div>

      <form className={styles.form} onSubmit={handleAddSubject}>
        <input
          className={styles.input}
          type="text"
          placeholder="Ajouter une matiere personnalisee"
          value={customSubject}
          onChange={(event) => setCustomSubject(event.target.value)}
        />
        <button className={styles.addButton} type="submit">
          Ajouter
        </button>
      </form>
    </section>
  )
}

export default SubjectPicker
