import styles from './HomePage.module.css'

function HomePage() {
  return (
    <section className={styles.page}>
      <h2 className={styles.title}>Home</h2>
      <p className={styles.text}>Bienvenue sur la page d'accueil du projet prof.</p>
    </section>
  )
}

export default HomePage
