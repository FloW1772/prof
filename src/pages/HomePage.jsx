import SubjectPicker from '../components/SubjectPicker'
import { useAppContext } from '../store/AppContext'
import styles from './HomePage.module.css'

function HomePage() {
  const { selectedSubject } = useAppContext()

  return (
    <section className={styles.page}>
      <h2 className={styles.title}>Home</h2>
      <p className={styles.text}>Bienvenue sur la page d'accueil du projet prof.</p>
      <p className={styles.current}>
        Matiere selectionnee:{' '}
        <strong>{selectedSubject ? selectedSubject.name : 'Aucune pour le moment'}</strong>
      </p>
      <SubjectPicker />
    </section>
  )
}

export default HomePage
