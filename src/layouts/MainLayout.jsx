import { Outlet } from 'react-router-dom'
import SidebarNav from '../components/SidebarNav'
import styles from './MainLayout.module.css'

function MainLayout() {
  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <SidebarNav />
      </aside>
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
