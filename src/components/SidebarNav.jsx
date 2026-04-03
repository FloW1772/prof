import { NavLink } from 'react-router-dom'
import styles from './SidebarNav.module.css'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/learn', label: 'Learn' },
]

function SidebarNav() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>prof</h1>
      <nav className={styles.nav}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default SidebarNav
