import {
  Activity,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Command,
  KeyRound,
  LayoutDashboard,
  ListTodo,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  ShieldCheck,
  User,
  Users,
  X
} from 'lucide-react'
import type { CurrentUser } from '../types'

export type SuperuserSection = 'dashboard' | 'tasks' | 'team'
export type DeveloperSection = 'my-tasks' | 'reviews' | 'completed' | 'profile'
export type AppSection = SuperuserSection | DeveloperSection

interface SidebarProps {
  section: AppSection
  setSection: (section: AppSection) => void
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
  onLogout: () => void
  onOpenProfile?: () => void
  currentUser: CurrentUser
  pendingReviewCount?: number
  activeTaskCount?: number
}

export function Sidebar({
  section,
  setSection,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  onLogout,
  onOpenProfile,
  currentUser,
  pendingReviewCount = 0,
  activeTaskCount = 0,
}: SidebarProps) {
  const isSuperuser = currentUser.is_superuser

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <button
          className="mobile-scrim"
          aria-label="Menyuni yopish"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${
          mobileOpen ? 'sidebar-open' : ''
        }`}
      >
        {/* Brand & Collapse Header */}
        <div className="brand" onClick={collapsed ? onToggleCollapse : undefined} style={{ cursor: collapsed ? 'pointer' : 'default' }}>
          <div
            className="brand-mark"
            title={collapsed ? 'Yon panelni kengaytirish uchun bosing' : undefined}
          >
            <Activity size={20} strokeWidth={2.4} />
          </div>

          {!collapsed && (
            <span>
              qadam<span className="brand-period">.</span>
            </span>
          )}

          {/* Single clean header action: collapses on desktop, closes drawer on mobile */}
          {!collapsed && (
            <button
              className="icon-btn sidebar-header-action"
              onClick={(e) => {
                e.stopPropagation()
                if (mobileOpen) {
                  onCloseMobile()
                } else {
                  onToggleCollapse()
                }
              }}
              title={mobileOpen ? 'Menyuni yopish' : 'Yon panelni yig‘ish'}
              aria-label={mobileOpen ? 'Menyuni yopish' : 'Yon panelni yig‘ish'}
            >
              {mobileOpen ? <X size={18} /> : <PanelLeftClose size={18} />}
            </button>
          )}
        </div>

        {/* When collapsed: prominent expand button right below the logo */}
        {collapsed && (
          <button
            className="sidebar-expand-pill"
            onClick={onToggleCollapse}
            title="Yon panelni kengaytirish"
            aria-label="Yon panelni kengaytirish"
          >
            <PanelLeftOpen size={18} />
          </button>
        )}

        {/* User Role Card */}
        {!collapsed && (
          <div className={`sidebar-role-card ${isSuperuser ? 'role-card-admin' : 'role-card-dev'}`}>
            <div className="role-avatar-badge">
              {isSuperuser ? <Shield size={16} /> : <User size={16} />}
            </div>
            <div className="role-text-info">
              <strong>{isSuperuser ? 'Super Administrator' : 'Dasturchi'}</strong>
              <span>{isSuperuser ? 'Tizim boshqaruvchisi' : 'Loyiha ijrochisi'}</span>
            </div>
          </div>
        )}

        {/* Navigation Sections */}
        {!collapsed && (
          <div className="nav-label">{isSuperuser ? 'BOSHQARUV PANELI' : 'MENING ISH MAYDONIM'}</div>
        )}

        <nav aria-label="Asosiy navigatsiya" className="nav-links">
          {isSuperuser ? (
            // Superuser Menu
            <>
              <button
                className={`nav-link ${section === 'dashboard' ? 'nav-link-active' : ''}`}
                onClick={() => {
                  setSection('dashboard')
                  onCloseMobile()
                }}
                title={collapsed ? 'Boshqaruv va tahlil' : undefined}
              >
                <LayoutDashboard size={19} />
                {!collapsed && <span>Boshqaruv va tahlil</span>}
                {pendingReviewCount > 0 && (
                  <span
                    className="nav-count nav-count-amber"
                    title={`${pendingReviewCount} ta tekshiruv kutilmoqda`}
                  >
                    {pendingReviewCount}
                  </span>
                )}
              </button>

              <button
                className={`nav-link ${section === 'tasks' ? 'nav-link-active' : ''}`}
                onClick={() => {
                  setSection('tasks')
                  onCloseMobile()
                }}
                title={collapsed ? 'Vazifalar taxtasi' : undefined}
              >
                <Command size={19} />
                {!collapsed && <span>Vazifalar taxtasi</span>}
                {activeTaskCount > 0 && <span className="nav-count">{activeTaskCount}</span>}
              </button>

              <button
                className={`nav-link ${section === 'team' ? 'nav-link-active' : ''}`}
                onClick={() => {
                  setSection('team')
                  onCloseMobile()
                }}
                title={collapsed ? 'Jamoa boshqaruvi' : undefined}
              >
                <Users size={19} />
                {!collapsed && <span>Jamoa boshqaruvi</span>}
              </button>
            </>
          ) : (
            // Developer Menu
            <>
              <button
                className={`nav-link ${section === 'my-tasks' ? 'nav-link-active' : ''}`}
                onClick={() => {
                  setSection('my-tasks')
                  onCloseMobile()
                }}
                title={collapsed ? 'Mening vazifalarim' : undefined}
              >
                <ListTodo size={19} />
                {!collapsed && <span>Mening vazifalarim</span>}
                {activeTaskCount > 0 && <span className="nav-count">{activeTaskCount}</span>}
              </button>

              <button
                className={`nav-link ${section === 'reviews' ? 'nav-link-active' : ''}`}
                onClick={() => {
                  setSection('reviews')
                  onCloseMobile()
                }}
                title={collapsed ? 'Tekshiruvdagi ishlar' : undefined}
              >
                <Clock size={19} />
                {!collapsed && <span>Tekshiruvdagi ishlar</span>}
                {pendingReviewCount > 0 && (
                  <span className="nav-count nav-count-amber">{pendingReviewCount}</span>
                )}
              </button>

              <button
                className={`nav-link ${section === 'completed' ? 'nav-link-active' : ''}`}
                onClick={() => {
                  setSection('completed')
                  onCloseMobile()
                }}
                title={collapsed ? 'Bajarilgan ishlarim' : undefined}
              >
                <CheckCircle2 size={19} />
                {!collapsed && <span>Bajarilgan ishlarim</span>}
              </button>

              {!collapsed && <div className="nav-label nav-label-space">SOZLAMALAR</div>}

              <button
                className={`nav-link ${section === 'profile' ? 'nav-link-active' : ''}`}
                onClick={() => {
                  setSection('profile')
                  onCloseMobile()
                }}
                title={collapsed ? 'Profil va xavfsizlik' : undefined}
              >
                <KeyRound size={19} />
                {!collapsed && <span>Profil va xavfsizlik</span>}
              </button>
            </>
          )}
        </nav>

        <div className="sidebar-spacer" />

        {/* Sidebar Collapse/Expand Toggle Footer Bar */}
        <div className="sidebar-toggle-row">
          <button
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            title={collapsed ? 'Yon panelni kengaytirish' : 'Yon panelni yig‘ish'}
            aria-label={collapsed ? 'Kengaytirish' : 'Yig‘ish'}
          >
            {collapsed ? (
              <ChevronRight size={18} />
            ) : (
              <>
                <ChevronLeft size={16} />
                <span>Panelni yig‘ish</span>
              </>
            )}
          </button>
        </div>

        {/* Sidebar Footer User Info */}
        <div
          className="sidebar-profile clickable-profile"
          onClick={onOpenProfile}
          title="Profilni tahrirlash va sozlamalar"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onOpenProfile?.()
            }
          }}
        >
          <div className={`avatar ${isSuperuser ? 'avatar-admin' : 'avatar-dev'}`}>
            {currentUser.initials || currentUser.name.slice(0, 2).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="profile-details">
              <strong>{currentUser.name}</strong>
              <span className="profile-role-sub">@{currentUser.username}</span>
            </div>
          )}
          <button
            className="profile-logout"
            aria-label="Tizimdan chiqish"
            onClick={(e) => {
              e.stopPropagation()
              onLogout()
            }}
            title="Tizimdan chiqish"
          >
            <LogOut size={17} />
          </button>
        </div>

        {!collapsed && (
          <div className="security-note">
            <ShieldCheck size={13} /> Xavfsiz ish maydoni
          </div>
        )}
      </aside>
    </>
  )
}
