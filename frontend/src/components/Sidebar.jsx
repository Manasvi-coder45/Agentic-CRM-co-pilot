import { NavLink } from 'react-router-dom'

const links = [
  { to: '/',         label: 'Dashboard',     icon: '▦' },
  { to: '/agent',    label: 'AI Agent',      icon: '◈' },
  { to: '/deals',    label: 'Pipeline',      icon: '◎' },
  { to: '/contacts', label: 'Contacts',      icon: '◉' },
  { to: '/activity', label: 'Activity Log',  icon: '◷' },
]

export default function Sidebar() {
  return (
    <aside style={{
      width: 232, minHeight: '100vh', background: 'var(--white)',
      borderRight: '1px solid var(--gray-200)', display: 'flex',
      flexDirection: 'column', flexShrink: 0, zIndex: 10,
      boxShadow: 'var(--shadow-sm)'
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--gray-100)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: 'var(--primary)',
            borderRadius: 8, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 16, color: 'white', flexShrink: 0
          }}>⬡</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-900)', lineHeight: 1.2 }}>CRM Co-Pilot</div>
            <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 1 }}>Powered by LLaMA 3.3</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--gray-400)', padding: '4px 10px 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Main Menu
        </div>
        {links.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 'var(--radius)',
              fontSize: 13.5, fontWeight: isActive ? 500 : 400,
              color: isActive ? 'var(--primary)' : 'var(--gray-600)',
              background: isActive ? 'var(--primary-light)' : 'transparent',
              transition: 'all 0.12s',
            })}>
            <span style={{ fontSize: 15, opacity: 0.8 }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--gray-100)' }}>
        <div style={{ fontSize: 11, color: 'var(--gray-400)', lineHeight: 1.6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }}></span>
            Backend connected
          </div>
          <div style={{ color: 'var(--gray-300)', marginTop: 2 }}>localhost:8000</div>
        </div>
      </div>
    </aside>
  )
}