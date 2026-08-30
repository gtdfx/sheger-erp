import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Building2, DollarSign, ShoppingCart, FolderOpen, Users, LogOut, Menu, PanelLeftClose, PanelLeft, X } from 'lucide-react'
import { useState, useEffect } from 'react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/construction', icon: Building2, label: 'Construction' },
  { to: '/finance', icon: DollarSign, label: 'Budget & Finance' },
  { to: '/sales', icon: ShoppingCart, label: 'Sales' },
  { to: '/documents', icon: FolderOpen, label: 'Documents' },
  { to: '/contacts', icon: Users, label: 'Team & Contacts' },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('sheger_user') || '{}')

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [navigate])

  function logout() {
    localStorage.removeItem('sheger_token')
    localStorage.removeItem('sheger_user')
    navigate('/login')
  }

  const sidebarWidth = isMobile ? 0 : (sidebarOpen ? 268 : 72)

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        width: isMobile ? '280px' : (sidebarOpen ? '268px' : '72px'),
        background: 'linear-gradient(165deg, #0c1829 0%, #132238 48%, #0f1a2e 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        boxShadow: isMobile ? '4px 0 32px rgba(0,0,0,0.3)' : '4px 0 32px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column',
        transition: 'transform 0.3s ease, width 0.3s ease',
        transform: isMobile ? (mobileOpen ? 'translateX(0)' : 'translateX(-100%)') : undefined,
        overflow: 'hidden',
      }}>
        {/* Sidebar toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'space-between' : 'flex-end', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 style={{ width: '16px', height: '16px', color: '#c4a35a' }} />
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>Sheger <span style={{ color: '#c4a35a' }}>ERP</span></span>
            </div>
          )}
          <button onClick={() => isMobile ? setMobileOpen(false) : setSidebarOpen(!sidebarOpen)}
            style={{ padding: '6px', borderRadius: '6px', color: 'rgba(255,255,255,0.5)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title={isMobile ? 'Close' : (sidebarOpen ? 'Collapse' : 'Expand')}
          >
            {isMobile ? <X style={{ width: '18px', height: '18px' }} /> : (sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />)}
          </button>
        </div>

        {/* Brand (desktop only) */}
        {!isMobile && (
          <div style={{ padding: sidebarOpen ? '16px 16px 14px' : '16px 8px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Building2 className="w-5 h-5" style={{ color: '#c4a35a' }} />
              </div>
              {sidebarOpen && (
                <div style={{ minWidth: 0 }}>
                  <h1 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#fff', lineHeight: 1.25, letterSpacing: '-0.02em' }}>
                    Sheger <span style={{ color: '#c4a35a' }}>ERP</span>
                  </h1>
                  <p style={{ margin: '4px 0 0', color: 'rgba(230,238,252,0.72)', fontSize: '0.72rem', fontWeight: 500 }}>Real Estate Management</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px', display: 'grid', gap: '4px' }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
            >
              {({ isActive }) => (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '11px',
                  padding: (sidebarOpen || isMobile) ? '10px 12px 10px 10px' : '10px',
                  borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500,
                  textDecoration: 'none',
                  color: isActive ? '#fff' : 'rgba(240,244,252,0.88)',
                  background: isActive ? 'linear-gradient(90deg, rgba(196,163,90,0.18) 0%, rgba(255,255,255,0.06) 100%)' : 'transparent',
                  borderLeft: isActive ? '3px solid #c4a35a' : '3px solid transparent',
                  transition: 'background 0.15s, color 0.15s',
                  justifyContent: (sidebarOpen || isMobile) ? 'flex-start' : 'center',
                }}>
                  <item.icon style={{ width: '18px', height: '18px', opacity: 0.85, flexShrink: 0, color: isActive ? '#c4a35a' : undefined }} />
                  {(sidebarOpen || isMobile) && <span>{item.label}</span>}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        {(sidebarOpen || isMobile) && (
          <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(196,163,90,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c4a35a', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                {user.name ? user.name.charAt(0) : 'A'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || 'Admin'}</p>
                <p style={{ margin: '2px 0 0', fontSize: '0.65rem', color: 'rgba(230,238,252,0.45)', textTransform: 'capitalize' }}>{user.role || 'admin'}</p>
              </div>
              <button onClick={logout} style={{ padding: '6px', color: 'rgba(255,255,255,0.3)', background: 'transparent', border: 'none', cursor: 'pointer' }} title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {(sidebarOpen || isMobile) && (
          <div style={{ padding: '12px 16px', color: 'rgba(230,238,252,0.45)', fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
            Sheger Real Estate PLC
          </div>
        )}
      </aside>

      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40, transition: 'opacity 0.3s' }} onClick={() => setMobileOpen(false)} />
      )}

      {/* Main panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, marginLeft: isMobile ? 0 : (sidebarOpen ? '268px' : '72px'), transition: 'margin-left 0.3s ease' }}>
        {/* Topbar */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 30,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          minHeight: '56px', padding: isMobile ? '10px 16px' : '12px 20px',
          background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #e9eef6',
          boxShadow: '0 1px 2px rgba(15,23,42,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button onClick={() => setMobileOpen(true)} style={{ padding: '8px', border: '1px solid #d8e0ed', borderRadius: '8px', background: '#fff', color: '#141b2d', cursor: 'pointer', display: isMobile ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center' }}>
              <Menu className="w-5 h-5" />
            </button>
            {!isMobile && (
              <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ padding: '8px', border: '1px solid #d8e0ed', borderRadius: '8px', background: '#fff', color: '#141b2d', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge-accent" style={{ fontSize: '0.7rem' }}>{user.role || 'Admin'}</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(30,77,140,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e4d8c', fontWeight: 700, fontSize: '0.875rem' }}>
              {user.name ? user.name.charAt(0) : 'A'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ padding: isMobile ? '16px' : '24px', flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
