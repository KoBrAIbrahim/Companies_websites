import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const adminLinks = [
  { to: '/admin', label: 'Dashboard', end: true, icon: 'dashboard' },
  { to: '/admin/users', label: 'Users', icon: 'users' },
  { to: '/admin/companies', label: 'Companies', icon: 'companies' },
  { to: '/admin/orders', label: 'Orders', icon: 'orders' },
  { to: '/admin/salary', label: 'Salary', icon: 'salary' },
  { to: '/admin/analysis', label: 'Analysis', icon: 'analysis' },
]

const salesLinks = [
  { to: '/sales', label: 'Dashboard', end: true, icon: 'dashboard' },
  { to: '/sales/orders', label: 'Orders', icon: 'orders' },
  { to: '/sales/salary', label: 'Salary', icon: 'salary' },
]

const icons = {
  dashboard: <><rect x="3" y="3" width="7.5" height="9" rx="1.8" /><rect x="13.5" y="3" width="7.5" height="5.5" rx="1.8" /><rect x="13.5" y="11.5" width="7.5" height="9.5" rx="1.8" /><rect x="3" y="15" width="7.5" height="6" rx="1.8" /></>,
  users: <><path d="M15.5 21v-1.8a3.8 3.8 0 0 0-3.8-3.8H6.3a3.8 3.8 0 0 0-3.8 3.8V21" /><circle cx="9.15" cy="7.6" r="3.6" /><path d="M21.5 21v-1.8a3.8 3.8 0 0 0-2.85-3.68" /><path d="M15.65 3.14a3.8 3.8 0 0 1 0 7.36" /></>,
  companies: <><rect x="4" y="2.5" width="16" height="19" rx="1.4" /><path d="M9.5 21.5v-4.2h5v4.2" /><path d="M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01" /></>,
  orders: <><rect x="8" y="2.5" width="8" height="4" rx="1.2" /><path d="M8.5 4.5H7a2.2 2.2 0 0 0-2.2 2.2v13a2.2 2.2 0 0 0 2.2 2.2h10a2.2 2.2 0 0 0 2.2-2.2v-13A2.2 2.2 0 0 0 17 4.5h-1.5" /><path d="M8.3 12.5h7.4M8.3 16.5h7.4" /></>,
  salary: <><rect x="2.5" y="6" width="19" height="13" rx="2" /><path d="M2.5 10.5h19" /><path d="M17 15.2h2" /></>,
  analysis: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>,
  logout: <><path d="M10 21H6a2.2 2.2 0 0 1-2.2-2.2V5.2A2.2 2.2 0 0 1 6 3h4" /><path d="M16 16.5 21 12l-5-4.5" /><path d="M21 12H9" /></>,
  menu: <><line x1="3.5" y1="6.5" x2="20.5" y2="6.5" /><line x1="3.5" y1="12" x2="20.5" y2="12" /><line x1="3.5" y1="17.5" x2="20.5" y2="17.5" /></>,
  close: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
}

function Icon({ name, className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icons[name]}
    </svg>
  )
}

function initialsFor(profile) {
  const source = profile.name || profile.email || '?'
  const parts = source.trim().split(/\s+/)
  const letters = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : source.slice(0, 2)
  return letters.toUpperCase()
}

export default function Layout() {
  const { profile, logout } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const toggleRef = useRef(null)
  const links = profile.role === 'admin' ? adminLinks : salesLinks
  const closeDrawer = () => setDrawerOpen(false)

  useEffect(() => {
    document.body.classList.toggle('no-scroll', drawerOpen)
    return () => document.body.classList.remove('no-scroll')
  }, [drawerOpen])

  useEffect(() => {
    if (!drawerOpen) return undefined
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setDrawerOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [drawerOpen])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>

      {drawerOpen && <div className="sidebar-backdrop" onClick={() => setDrawerOpen(false)} />}

      <aside id="app-sidebar" className={`sidebar${drawerOpen ? ' is-open' : ''}`}>
        <div className="sidebar-header">
          <img src="/favicon.svg" alt="" width="26" height="26" className="brand-mark" />
          <span className="brand-name">Companies</span>
          <button type="button" className="sidebar-close" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
            <Icon name="close" />
          </button>
        </div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} onClick={closeDrawer} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <Icon name={link.icon} />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="avatar" aria-hidden="true">{initialsFor(profile)}</span>
            <div className="sidebar-user-meta">
              <strong>{profile.name || profile.email}</strong>
              <small>{profile.role === 'admin' ? 'Admin' : 'Sales'}</small>
            </div>
          </div>
          <button type="button" className="sidebar-logout" onClick={logout}>
            <Icon name="logout" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <button ref={toggleRef} type="button" className="menu-toggle" onClick={() => setDrawerOpen(true)} aria-label="Open menu" aria-controls="app-sidebar" aria-expanded={drawerOpen}>
            <Icon name="menu" />
          </button>
          <span className="topbar-brand">
            <img src="/favicon.svg" alt="" width="22" height="22" />
            Companies
          </span>
        </header>
        <main id="main-content" className="app-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
