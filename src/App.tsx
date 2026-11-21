import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  ArrowRight,
  Bell,
  Calendar,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Command,
  Download,
  Filter,
  Grid,
  KeyRound,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Paperclip,
  Plus,
  RotateCcw,
  Search,
  Shield,
  ShieldCheck,
  Table,
  User,
  Users,
  X
} from 'lucide-react'
import { NotificationMenu } from './components/NotificationMenu'
import { ProfileModal } from './components/ProfileModal'
import { Sidebar, type AppSection } from './components/Sidebar'
import { TaskCard } from './components/TaskCard'
import { TaskDetailModal } from './components/TaskDetailModal'
import { TaskDialog } from './components/TaskDialog'
import { TeamPanel } from './components/TeamPanel'
import { api, refreshCsrf } from './lib/api'
import type { CurrentUser, Developer, Priority, Status, TaskItem } from './types'

const columns: { id: Status; label: string; color: string }[] = [
  { id: 'new', label: 'Yangi', color: 'column-mint' },
  { id: 'progress', label: 'Jarayonda', color: 'column-blue' },
  { id: 'review', label: 'Tekshiruvda', color: 'column-amber' },
  { id: 'done', label: 'Bajarildi', color: 'column-green' },
]

const priorityValues = ['Barchasi', 'Yuqori', 'O‘rta', 'Past']
const categoryValues = ['Barchasi', 'Frontend', 'Backend', 'Dizayn', 'Tahlil', 'Boshqa']

function LoginScreen({ onLogin }: { onLogin: (username: string, password: string) => Promise<string | null> }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    const message = await onLogin(username, password)
    setError(message || '')
    setLoading(false)
  }

  return (
    <main className="login-page animate-fade-in">
      <div className="login-card animate-scale-in">
        <div className="brand login-brand">
          <div className="brand-mark">
            <Command size={22} />
          </div>
          <span>
            qadam<span className="brand-period">.</span>
          </span>
        </div>
        <div className="login-heading">
          <span className="eyebrow">TIZIMGA KIRISH</span>
          <h1>Xush kelibsiz</h1>
          <p>Ish maydoningizga kirish uchun login va parolingizni kiriting.</p>
        </div>

        <form onSubmit={submit}>
          <label className="form-label">
            Login
            <input
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Foydalanuvchi logini"
              required
            />
          </label>
          <label className="form-label">
            Parol
            <input
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Parolingizni kiriting"
              required
            />
          </label>
          {error && <div className="login-error animate-shake" role="alert">{error}</div>}
          <button className="primary-button full-button" disabled={loading}>
            {loading ? 'Tekshirilmoqda…' : 'Tizimga kirish'}
          </button>
        </form>

        <div className="login-security">
          <ShieldCheck size={16} /> Himoyalangan xavfsiz tizim
        </div>
      </div>
      <span className="login-foot">© 2026 Qadam Platformasi · Jamoa vazifalar boshqaruvi</span>
    </main>
  )
}

function PasswordScreen({ onSave }: { onSave: (current: string, next: string) => Promise<string | null> }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (next !== confirm) {
      setError('Yangi parollar bir-biriga mos kelmadi.')
      return
    }
    setLoading(true)
    const message = await onSave(current, next)
    setError(message || '')
    setLoading(false)
  }

  return (
    <main className="login-page animate-fade-in">
      <div className="login-card animate-scale-in">
        <div className="brand login-brand">
          <div className="brand-mark">
            <ShieldCheck size={22} />
          </div>
          <span>
            qadam<span className="brand-period">.</span>
          </span>
        </div>
        <div className="login-heading">
          <span className="eyebrow">XAVFSIZLIK</span>
          <h1>Yangi parol o‘rnating</h1>
          <p>Tizimga birinchi kirishingiz. Vaqtinchalik parolni doimiy parolingizga almashtiring.</p>
        </div>
        <form onSubmit={submit}>
          <label className="form-label">
            Vaqtinchalik parol
            <input
              autoComplete="current-password"
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
          </label>
          <label className="form-label">
            Yangi parol
            <input
              autoComplete="new-password"
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              minLength={8}
              required
            />
            <small className="field-hint">Kamida 8 ta belgi bo‘lishi lozim.</small>
          </label>
          <label className="form-label">
            Yangi parolni takrorlang
            <input
              autoComplete="new-password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
              required
            />
          </label>
          {error && <div className="login-error animate-shake" role="alert">{error}</div>}
          <button className="primary-button full-button" disabled={loading}>
            {loading ? 'Saqlanmoqda…' : 'Parolni yangilash'}
          </button>
        </form>
      </div>
    </main>
  )
}

export default function App() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [section, setSection] = useState<AppSection>('dashboard')
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [developers, setDevelopers] = useState<Developer[]>([])

  const [loggedOut, setLoggedOut] = useState(false)
  const [passwordRequired, setPasswordRequired] = useState(false)

  // Sidebar controls with persistence
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('qadam_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })
  const [mobileMenu, setMobileMenu] = useState(false)

  // Persist sidebar state
  useEffect(() => {
    try {
      localStorage.setItem('qadam_sidebar_collapsed', String(sidebarCollapsed))
    } catch {
      // ignore
    }
  }, [sidebarCollapsed])

  const [flash, setFlash] = useState('')

  // Drag and Drop state
  const [dragOverColumn, setDragOverColumn] = useState<Status | null>(null)

  // Modals state
  const [showTaskDialog, setShowTaskDialog] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)

  // Filters & Sorting & View
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('Barchasi')
  const [categoryFilter, setCategoryFilter] = useState('Barchasi')
  const [assigneeFilter, setAssigneeFilter] = useState('Barchasi')
  const [sortBy, setSortBy] = useState<'newest' | 'priority' | 'due' | 'title'>('newest')
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban')
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  // Search input ref for Ctrl+K shortcut
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Global hotkeys (Ctrl+K and Escape)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      } else if (e.key === 'Escape') {
        setSelectedTask(null)
        setShowTaskDialog(false)
        setShowNotifications(false)
        setShowProfileModal(false)
        setFilterOpen(false)
        setSortOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Profile page form state (for developer)
  const [oldPassword, setOldPassword] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [passError, setPassError] = useState('')
  const [passSuccess, setPassSuccess] = useState('')
  const [savingPass, setSavingPass] = useState(false)

  // Initial load
  useEffect(() => {
    let active = true
    async function init() {
      const csrfOk = await refreshCsrf()
      if (!active || !csrfOk) return
      try {
        const session = await api.me()
        if (!active) return
        if (!session.authenticated || !session.user) {
          setLoggedOut(true)
          return
        }
        setUser(session.user)
        setPasswordRequired(Boolean(session.user.must_change_password))
        setLoggedOut(false)

        if (session.user.is_superuser) {
          setSection('dashboard')
        } else {
          setSection('my-tasks')
        }

        const [remoteTasks, team] = await Promise.all([
          api.tasks(),
          session.user.is_superuser ? api.developers() : Promise.resolve([]),
        ])
        if (active) {
          setTasks(remoteTasks)
          setDevelopers(team)
        }
      } catch {
        if (active) setLoggedOut(true)
      }
    }
    void init()
    return () => {
      active = false
    }
  }, [])

  // Flash timer
  useEffect(() => {
    if (!flash) return
    const timer = window.setTimeout(() => setFlash(''), 3400)
    return () => window.clearTimeout(timer)
  }, [flash])

  // Reload tasks helper
  async function reloadData() {
    try {
      const [remoteTasks, team] = await Promise.all([
        api.tasks(),
        user?.is_superuser ? api.developers() : Promise.resolve([]),
      ])
      setTasks(remoteTasks)
      if (user?.is_superuser) setDevelopers(team)
      if (selectedTask) {
        const refreshed = remoteTasks.find((t) => t.id === selectedTask.id)
        if (refreshed) setSelectedTask(refreshed)
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Filtered & Sorted Tasks
  const visibleTasks = useMemo(() => {
    let list = tasks.filter((task) => {
      const matchesSearch = `${task.title} ${task.description || ''} ${task.assignee}`
        .toLowerCase()
        .includes(search.toLowerCase())
      const matchesPriority = priorityFilter === 'Barchasi' || task.priority === priorityFilter
      const matchesCategory = categoryFilter === 'Barchasi' || task.category === categoryFilter
      const matchesAssignee =
        assigneeFilter === 'Barchasi' ||
        String(task.assignee_id) === assigneeFilter ||
        task.assignee === assigneeFilter

      return matchesSearch && matchesPriority && matchesCategory && matchesAssignee
    })

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'priority') {
        const rank: Record<string, number> = { Yuqori: 3, 'O‘rta': 2, Past: 1 }
        return (rank[b.priority] || 0) - (rank[a.priority] || 0)
      }
      if (sortBy === 'due') {
        return (a.due_date || '9999').localeCompare(b.due_date || '9999')
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title)
      }
      // newest
      return b.id - a.id
    })

    return list
  }, [tasks, search, priorityFilter, categoryFilter, assigneeFilter, sortBy])

  const counts = useMemo(
    () =>
      Object.fromEntries(
        columns.map(({ id }) => [id, visibleTasks.filter((task) => task.status === id).length])
      ) as Record<Status, number>,
    [visibleTasks]
  )

  const pendingReviews = useMemo(() => tasks.filter((t) => t.status === 'review'), [tasks])
  const completedTasks = useMemo(() => tasks.filter((t) => t.status === 'done'), [tasks])
  const progressTasks = useMemo(() => tasks.filter((t) => t.status === 'progress'), [tasks])
  const percent = tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0

  // Drag and Drop handler with optimistic UI updates
  async function handleDropOnColumn(e: React.DragEvent, targetStatus: Status) {
    e.preventDefault()
    setDragOverColumn(null)
    try {
      const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain')
      if (!raw) return
      const parsed = JSON.parse(raw)
      const taskId = Number(parsed.id)
      const currentStatus = parsed.currentStatus as Status

      if (currentStatus === targetStatus) return

      // Validate transitions for developer
      if (!user?.is_superuser) {
        const allowed: Record<Status, Status[]> = {
          new: ['progress'],
          progress: ['review'],
          review: ['progress'],
          done: [],
        }
        if (!allowed[currentStatus]?.includes(targetStatus)) {
          const fromName = columns.find((c) => c.id === currentStatus)?.label
          const toName = columns.find((c) => c.id === targetStatus)?.label
          if (targetStatus === 'done') {
            setFlash('Dasturchi vazifani to‘g‘ridan-to‘g‘ri «Bajarildi» qila olmaydi. Administrator tekshiruvi shart.')
          } else {
            setFlash(`Dasturchi vazifani «${fromName}» holatidan «${toName}» holatiga o‘tkaza olmaydi.`)
          }
          return
        }
      }

      const toName = columns.find((c) => c.id === targetStatus)?.label
      const note = user?.is_superuser
        ? `Administrator vazifani «${toName}» ustuniga tortib o‘tkazdi`
        : `Dasturchi vazifani «${toName}» holatiga o‘tkazdi`

      // OPTIMISTIC UPDATE: Move card instantly on screen
      const prevTasks = [...tasks]
      setTasks((curr) =>
        curr.map((t) =>
          t.id === taskId
            ? { ...t, status: targetStatus, status_display: toName }
            : t
        )
      )
      setFlash(`Vazifa «${toName}» ustuniga ko‘chirildi`)

      try {
        const updated = await api.changeStatus(taskId, targetStatus, note)
        setTasks((curr) => curr.map((t) => (t.id === taskId ? updated : t)))
        if (selectedTask?.id === taskId) setSelectedTask(updated)
      } catch (apiErr) {
        // Rollback on failure
        setTasks(prevTasks)
        setFlash(apiErr instanceof Error ? apiErr.message : 'Holatni yangilab bo‘lmadi')
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Actions
  async function addTask(input: {
    title: string
    description: string
    category: string
    priority: Priority
    due: string
    due_date?: string
    assignee_id?: number
    attachmentFiles?: File[]
  }) {
    try {
      const { attachmentFiles, ...taskInput } = input
      const created = await api.createTask({ ...taskInput, status: 'new' })
      if (attachmentFiles && attachmentFiles.length > 0) {
        for (const file of attachmentFiles) {
          await api.uploadAttachment(created.id, file)
        }
      }
      await reloadData()
      setShowTaskDialog(false)
      setFlash('Vazifa muvaffaqiyatli yaratildi va dasturchiga biriktirildi!')
    } catch (error) {
      setFlash(error instanceof Error ? error.message : 'Vazifa yaratilmadi')
    }
  }

  async function advanceTask(id: number, status: Status, note?: string) {
    try {
      const updated = await api.changeStatus(id, status, note)
      setTasks((curr) => curr.map((t) => (t.id === id ? updated : t)))
      if (selectedTask?.id === id) setSelectedTask(updated)
      setFlash(`Vazifa holati yangilandi: ${columns.find((c) => c.id === status)?.label}`)
    } catch (error) {
      setFlash(error instanceof Error ? error.message : 'Holatni yangilab bo‘lmadi')
    }
  }

  async function updateTask(id: number, data: Partial<TaskItem> & { assignee_id?: number }) {
    try {
      const updated = await api.updateTask(id, data)
      setTasks((curr) => curr.map((t) => (t.id === id ? updated : t)))
      setSelectedTask(updated)
      setFlash('Vazifa ma’lumotlari saqlandi!')
    } catch (error) {
      setFlash(error instanceof Error ? error.message : 'Vazifani yangilab bo‘lmadi')
    }
  }

  async function deleteTask(id: number) {
    try {
      await api.deleteTask(id)
      setTasks((curr) => curr.filter((t) => t.id !== id))
      setSelectedTask(null)
      setFlash('Vazifa butunlay o‘chirildi')
    } catch (error) {
      setFlash(error instanceof Error ? error.message : 'O‘chirishda xatolik yuz berdi')
    }
  }

  async function uploadAttachment(id: number, file: File) {
    try {
      await api.uploadAttachment(id, file)
      await reloadData()
      setFlash('Fayl yuklandi!')
    } catch (error) {
      setFlash(error instanceof Error ? error.message : 'Faylni yuklab bo‘lmadi')
    }
  }

  async function addComment(id: number, note: string) {
    try {
      await api.addComment(id, note)
      await reloadData()
      setFlash('Sharh qo‘shildi!')
    } catch (error) {
      setFlash(error instanceof Error ? error.message : 'Sharhni saqlab bo‘lmadi')
    }
  }

  async function addDeveloper(name: string, username: string) {
    try {
      const result = await api.createDeveloper({ name, username })
      setDevelopers((current) => [result.developer, ...current])
      setFlash(`Dasturchi @${username} qo‘shildi!`)
      return result.temporary_password
    } catch (error) {
      setFlash(error instanceof Error ? error.message : 'Dasturchi yaratilmadi')
      return null
    }
  }

  async function toggleDeveloperActive(id: number, active: boolean) {
    try {
      const updated = await api.toggleDeveloperActive(id, active)
      setDevelopers((curr) => curr.map((d) => (d.id === id ? updated : d)))
      setFlash(`Dasturchi ${active ? 'faollashtirildi' : 'nofaol qilindi'}`)
    } catch (error) {
      setFlash(error instanceof Error ? error.message : 'Holatni o‘zgartirib bo‘lmadi')
    }
  }

  async function resetDeveloperPassword(id: number) {
    try {
      const result = await api.resetDeveloperPassword(id)
      setFlash('Vaqtinchalik yangi parol yaratildi!')
      return result.temporary_password
    } catch (error) {
      setFlash(error instanceof Error ? error.message : 'Parolni tiklab bo‘lmadi')
      return null
    }
  }

  async function updateDeveloper(
    id: number,
    payload: { name?: string; username?: string; password?: string; active?: boolean }
  ) {
    try {
      await api.updateDeveloper(id, payload)
      await reloadData()
      setFlash('Dasturchi maʼlumotlari muvaffaqiyatli saqlandi!')
      return null
    } catch (error) {
      return error instanceof Error ? error.message : 'Maʼlumotlarni saqlab bo‘lmadi'
    }
  }

  async function handleUpdateProfile(payload: {
    name?: string
    username?: string
    new_password?: string
    current_password?: string
  }) {
    try {
      const result = await api.updateProfile(payload)
      setUser(result.user)
      await reloadData()
      setFlash('Profilingiz muvaffaqiyatli yangilandi!')
      return null
    } catch (error) {
      return error instanceof Error ? error.message : 'Profilni yangilab bo‘lmadi'
    }
  }

  async function handlePasswordChangeSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPassError('')
    setPassSuccess('')
    if (newPass !== confirmPass) {
      setPassError('Yangi parollar bir-biriga mos kelmadi.')
      return
    }
    if (newPass.length < 8) {
      setPassError('Yangi parol kamida 8 ta belgidan iborat bo‘lishi lozim.')
      return
    }
    setSavingPass(true)
    try {
      await api.changePassword(oldPassword, newPass)
      setPassSuccess('Parolingiz muvaffaqiyatli yangilandi!')
      setOldPassword('')
      setNewPass('')
      setConfirmPass('')
    } catch (err) {
      setPassError(err instanceof Error ? err.message : 'Parolni o‘zgartirib bo‘lmadi')
    } finally {
      setSavingPass(false)
    }
  }

  async function login(username: string, password: string) {
    try {
      const result = await api.login(username, password)
      const session = await api.refreshSession()
      setUser(result.user)
      setPasswordRequired(Boolean(session.user?.must_change_password))
      if (result.user.is_superuser) {
        setSection('dashboard')
      } else {
        setSection('my-tasks')
      }
      if (!session.user?.must_change_password) {
        const [nextTasks, nextTeam] = await Promise.all([
          api.tasks(),
          result.user.is_superuser ? api.developers() : Promise.resolve([]),
        ])
        setTasks(nextTasks)
        setDevelopers(nextTeam)
      }
      setLoggedOut(false)
      setFlash(`Xush kelibsiz, ${result.user.name || result.user.username}!`)
      return null
    } catch (error) {
      return error instanceof Error ? error.message : 'Login yoki parol noto‘g‘ri'
    }
  }

  async function updateFirstPassword(current: string, next: string) {
    try {
      await api.changePassword(current, next)
      setPasswordRequired(false)
      await reloadData()
      setFlash('Parolingiz muvaffaqiyatli o‘rnatildi!')
      return null
    } catch (error) {
      return error instanceof Error ? error.message : 'Parolni yangilab bo‘lmadi'
    }
  }

  async function logout() {
    try {
      await api.logout()
    } catch {
      // ignore
    }
    setLoggedOut(true)
    setUser(null)
    setTasks([])
    setDevelopers([])
  }

  // Toggle sidebar on desktop or drawer on mobile
  function handleSidebarToggle() {
    if (window.innerWidth <= 980) {
      setMobileMenu((prev) => !prev)
    } else {
      setSidebarCollapsed((prev) => !prev)
    }
  }

  if (loggedOut || !user) return <LoginScreen onLogin={login} />
  if (passwordRequired) return <PasswordScreen onSave={updateFirstPassword} />

  const isSuperuser = user.is_superuser

  return (
    <div className="app-shell">
      {/* Sidebar with strictly separated buttons for each role */}
      <Sidebar
        section={section}
        setSection={(s) => setSection(s)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        mobileOpen={mobileMenu}
        onCloseMobile={() => setMobileMenu(false)}
        onLogout={logout}
        onOpenProfile={() => setShowProfileModal(true)}
        currentUser={user}
        pendingReviewCount={pendingReviews.length}
        activeTaskCount={tasks.filter((t) => t.status !== 'done').length}
      />

      <main className={`main-area ${sidebarCollapsed ? 'main-area-collapsed' : ''}`}>
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            {/* Sidebar toggle button (works on desktop & mobile) */}
            <button
              className="icon-btn sidebar-toggle-btn"
              aria-label="Yon panelni ochish / yopish"
              title={sidebarCollapsed ? 'Yon panelni kengaytirish' : 'Yon panelni yig‘ish'}
              onClick={handleSidebarToggle}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            </button>

            <span className="breadcrumb">Qadam</span>
            <span style={{ color: '#556057' }}>/</span>
            <strong>
              {isSuperuser
                ? section === 'dashboard'
                  ? 'Boshqaruv va tahlil'
                  : section === 'tasks'
                  ? 'Vazifalar taxtasi'
                  : 'Jamoa boshqaruvi'
                : section === 'my-tasks'
                ? 'Mening vazifalarim'
                : section === 'reviews'
                ? 'Tekshiruvdagi ishlar'
                : section === 'completed'
                ? 'Bajarilgan ishlar'
                : 'Profil va xavfsizlik'}
            </strong>
          </div>

          <div className="topbar-actions">
            {/* Notification Menu Button */}
            <div style={{ position: 'relative' }}>
              <button
                className="icon-btn notification-button"
                aria-label="Bildirishnomalar"
                onClick={() => setShowNotifications((prev) => !prev)}
                title="Bildirishnomalar"
              >
                <Bell size={18} />
                <i />
              </button>
              {showNotifications && (
                <NotificationMenu
                  tasks={tasks}
                  onSelectTask={(t) => setSelectedTask(t)}
                  onClose={() => setShowNotifications(false)}
                />
              )}
            </div>

            <span className="topbar-divider" />

            {/* User Profile Info & Logout */}
            <div className="topbar-user">
              <div className={`avatar ${isSuperuser ? 'avatar-admin' : 'avatar-dev'}`}>
                {user.initials || user.name.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <strong style={{ fontSize: '13px', color: '#edf2ee' }}>{user.name}</strong>
                <small style={{ fontSize: '11px', color: '#88938b' }}>
                  {isSuperuser ? 'Super Administrator' : 'Dasturchi'}
                </small>
              </div>
              <button
                className="icon-btn"
                onClick={logout}
                title="Chiqish"
                style={{ marginLeft: '6px', color: '#9da7a0' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content animate-fade-in">
          {/* ========================================================
              SUPERUSER VIEW 1: DASHBOARD & ANALYTICS
              ======================================================== */}
          {isSuperuser && section === 'dashboard' && (
            <div className="page-flow">
              <div className="page-heading">
                <div>
                  <div className="eyebrow">ADMINISTRATOR BOSHQARUV MARKAZI</div>
                  <h1>Loyiha va jamoa tahlili</h1>
                  <p>Barcha topshiriqlar holati, jamoa a’zolari faolligi va tasdiqlash navbatini kuzating.</p>
                </div>
                <button className="primary-button" onClick={() => setShowTaskDialog(true)}>
                  <Plus size={18} /> Yangi vazifa yaratish
                </button>
              </div>

              {/* Stats Grid */}
              <section className="stats-grid">
                <div className="stat-card">
                  <div className="stat-card-top">
                    <span>Jami vazifalar</span>
                    <span className="stat-icon icon-violet"><Command size={18} /></span>
                  </div>
                  <div className="stat-number">{tasks.length.toString().padStart(2, '0')}<span className="stat-inline-muted">ta</span></div>
                  <div className="stat-foot"><span>loyihadagi barcha topshiriqlar</span></div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-top">
                    <span>Jarayondagi ishlar</span>
                    <span className="stat-icon icon-blue"><CalendarClock size={18} /></span>
                  </div>
                  <div className="stat-number">{progressTasks.length.toString().padStart(2, '0')}<span className="stat-inline-muted">faol</span></div>
                  <div className="stat-foot"><span>hozir dasturchilar ishlayotgan vazifalar</span></div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-top">
                    <span>Tekshiruv kutayotganlar</span>
                    <span className="stat-icon icon-amber"><Clock size={18} /></span>
                  </div>
                  <div className="stat-number" style={{ color: pendingReviews.length ? '#f5cf8e' : 'inherit' }}>
                    {pendingReviews.length.toString().padStart(2, '0')}
                    <span className="stat-inline-muted">kutilmoqda</span>
                  </div>
                  <div className="stat-foot"><span>tasdiqlashingiz kerak bo‘lgan ishlar</span></div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-top">
                    <span>Yakunlanganlar</span>
                    <span className="stat-icon icon-green"><Check size={18} /></span>
                  </div>
                  <div className="stat-number">{completedTasks.length.toString().padStart(2, '0')}<span className="stat-change change-positive">{percent}%</span></div>
                  <div className="stat-foot">
                    <div className="progress-track"><span style={{ width: `${percent}%` }} /></div>
                    <span>{percent}% muvaffaqiyatli yakunlandi</span>
                  </div>
                </div>
              </section>

              {/* Pending Review Queue (CRITICAL FOR SUPERUSER) */}
              <section className="dashboard-card animate-slide-up" style={{ marginBottom: '24px' }}>
                <div className="dashboard-card-head">
                  <div>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={18} color="#dfbe82" /> Tasdiqlashni kutayotgan topshiriqlar ({pendingReviews.length})
                    </h3>
                    <p>Dasturchilar tomonidan bajarilib, tekshiruvga topshirilgan ishlar ro‘yxati</p>
                  </div>
                </div>

                {pendingReviews.length > 0 ? (
                  <div className="team-table-wrap">
                    <table className="team-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>VAZIFA NOMI</th>
                          <th>YO‘NALISH</th>
                          <th>MAS’UL DASTURCHI</th>
                          <th>MUDDATI</th>
                          <th style={{ textAlign: 'right', paddingRight: '22px' }}>AMALLAR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingReviews.map((t) => (
                          <tr key={t.id} className="table-row-hover">
                            <td>#{t.id}</td>
                            <td>
                              <strong
                                onClick={() => setSelectedTask(t)}
                                style={{ cursor: 'pointer', color: '#edf2ee', textDecoration: 'underline' }}
                              >
                                {t.title}
                              </strong>
                              {t.attachments && t.attachments.length > 0 && (
                                <span style={{ marginLeft: '8px', fontSize: '11px', color: '#9fe2b4' }}>
                                  <Paperclip size={12} /> {t.attachments.length} ta fayl
                                </span>
                              )}
                            </td>
                            <td><span className="task-category-badge">{t.category}</span></td>
                            <td>
                              <div className="team-person">
                                <span className="avatar avatar-tiny" style={{ backgroundColor: t.color }}>{t.initials}</span>
                                <strong>{t.assignee}</strong>
                              </div>
                            </td>
                            <td>{t.due_date || t.due}</td>
                            <td style={{ textAlign: 'right', paddingRight: '18px' }}>
                              <div style={{ display: 'inline-flex', gap: '8px' }}>
                                <button
                                  className="primary-button"
                                  style={{ height: '32px', fontSize: '11.5px', padding: '0 12px' }}
                                  onClick={() => advanceTask(t.id, 'done', 'Administrator tomonidan tasdiqlandi')}
                                  title="Bajarildi deb qabul qilish"
                                >
                                  <Check size={14} /> Tasdiqlash
                                </button>
                                <button
                                  className="secondary-button"
                                  style={{ height: '32px', fontSize: '11.5px', padding: '0 12px' }}
                                  onClick={() => advanceTask(t.id, 'progress', 'Tuzatish uchun qaytarildi')}
                                  title="Qayta ishlashga qaytarish"
                                >
                                  ↩ Qaytarish
                                </button>
                                <button
                                  className="secondary-button"
                                  style={{ height: '32px', fontSize: '11.5px', padding: '0 10px' }}
                                  onClick={() => setSelectedTask(t)}
                                  title="Tafsilotlarni ko‘rish"
                                >
                                  Ko‘rish
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-box" style={{ margin: '16px' }}>
                    Hozircha tekshiruv talab qiladigan vazifalar yo‘q. Barcha topshiriqlar o‘z vaqtida ko‘rib chiqilgan.
                  </div>
                )}
              </section>

              {/* Team Workload Table */}
              <section className="dashboard-card animate-slide-up">
                <div className="dashboard-card-head">
                  <div>
                    <h3>Dasturchilar yuklamasi</h3>
                    <p>Har bir a’zoning hozirgi topshiriqlari va faolligi</p>
                  </div>
                  <button className="secondary-button" onClick={() => setSection('team')}>
                    Jamoani boshqarish <ArrowRight size={14} />
                  </button>
                </div>

                <div className="team-table-wrap">
                  <table className="team-table">
                    <thead>
                      <tr>
                        <th>DASTURCHI</th>
                        <th>FAOL ISHLAR</th>
                        <th>BAJARILGAN</th>
                        <th>HOLAT</th>
                        <th style={{ textAlign: 'right', paddingRight: '22px' }}>AMAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {developers.map((dev) => {
                        const devActive = tasks.filter((t) => t.assignee_id === dev.id && t.status !== 'done').length
                        return (
                          <tr key={dev.id} className="table-row-hover">
                            <td>
                              <div className="team-person">
                                <span className="avatar" style={{ backgroundColor: dev.color }}>{dev.initials}</span>
                                <div>
                                  <strong>{dev.name}</strong>
                                  <small>@{dev.username}</small>
                                </div>
                              </div>
                            </td>
                            <td><strong style={{ color: '#9ab9e8' }}>{devActive} ta vazifa</strong></td>
                            <td><strong style={{ color: '#9fe2b4' }}>{dev.completed || 0} ta</strong></td>
                            <td>
                              <span className={`member-status ${dev.active ? 'status-active' : 'status-inactive'}`}>
                                <i /> {dev.active ? 'Faol' : 'Nofaol'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', paddingRight: '18px' }}>
                              <button
                                className="secondary-button"
                                style={{ height: '30px', fontSize: '11px' }}
                                onClick={() => {
                                  setAssigneeFilter(String(dev.id))
                                  setSection('tasks')
                                }}
                              >
                                Vazifalarini ko‘rish →
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* ========================================================
              SUPERUSER VIEW 2: ALL TASKS (KANBAN / TABLE WITH DRAG AND DROP)
              ======================================================== */}
          {isSuperuser && section === 'tasks' && (
            <div className="page-flow">
              <div className="page-heading">
                <div>
                  <div className="eyebrow">VAZIFALAR BOSHQARUVI</div>
                  <h1>Vazifalar taxtasi ({visibleTasks.length})</h1>
                  <p>Vazifalarni tortib turib (Drag & Drop) boshqa ustunga olib o‘tishingiz mumkin.</p>
                </div>
                <button className="primary-button" onClick={() => setShowTaskDialog(true)}>
                  <Plus size={18} /> Yangi vazifa yaratish
                </button>
              </div>

              {/* Toolbar */}
              <div className="board-section animate-fade-in">
                <div className="board-heading">
                  <div>
                    <h2>Topshiriqlar oqimi</h2>
                    <p>Vazifalarni ustunlararo tortib o‘tkazing</p>
                  </div>
                  <div className="board-tools">
                    <div className="search-box">
                      <Search size={16} />
                      <input
                        ref={searchInputRef}
                        placeholder="Vazifa yoki dasturchi qidirish (Ctrl+K)..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                      {search && (
                        <button className="clear-search-btn" onClick={() => setSearch('')} title="Tozalash">
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Developer Filter */}
                    <select
                      className="toolbar-select"
                      value={assigneeFilter}
                      onChange={(e) => setAssigneeFilter(e.target.value)}
                    >
                      <option value="Barchasi">Dasturchi: Barchasi</option>
                      {developers.map((d) => (
                        <option key={d.id} value={String(d.id)}>{d.name}</option>
                      ))}
                    </select>

                    {/* Category Filter */}
                    <select
                      className="toolbar-select"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      {categoryValues.map((c) => (
                        <option key={c} value={c}>{c === 'Barchasi' ? 'Yo‘nalish: Barchasi' : c}</option>
                      ))}
                    </select>

                    {/* Priority Filter */}
                    <div className="filter-wrap">
                      <button
                        className={`toolbar-button ${priorityFilter !== 'Barchasi' ? 'filter-selected' : ''}`}
                        onClick={() => setFilterOpen((prev) => !prev)}
                      >
                        <Filter size={15} />
                        <span>{priorityFilter === 'Barchasi' ? 'Muhimlik' : priorityFilter}</span>
                      </button>
                      {filterOpen && (
                        <div className="filter-menu animate-scale-in">
                          <span>Muhimlik darajasi</span>
                          {priorityValues.map((p) => (
                            <button
                              key={p}
                              className={priorityFilter === p ? 'filter-option-active' : ''}
                              onClick={() => {
                                setPriorityFilter(p)
                                setFilterOpen(false)
                              }}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Sort Menu */}
                    <div className="filter-wrap">
                      <button className="toolbar-button" onClick={() => setSortOpen((prev) => !prev)}>
                        <span>{sortBy === 'newest' ? 'Eng yangi' : sortBy === 'priority' ? 'Muhimligi' : sortBy === 'due' ? 'Muddati' : 'Nomi'}</span>
                      </button>
                      {sortOpen && (
                        <div className="filter-menu animate-scale-in">
                          <span>Tartiblash</span>
                          <button onClick={() => { setSortBy('newest'); setSortOpen(false) }}>Eng yangi</button>
                          <button onClick={() => { setSortBy('priority'); setSortOpen(false) }}>Muhimlik</button>
                          <button onClick={() => { setSortBy('due'); setSortOpen(false) }}>Muddati</button>
                          <button onClick={() => { setSortBy('title'); setSortOpen(false) }}>Nomi (A-Z)</button>
                        </div>
                      )}
                    </div>

                    {/* Reset Filters button if any active */}
                    {(search || priorityFilter !== 'Barchasi' || categoryFilter !== 'Barchasi' || assigneeFilter !== 'Barchasi') && (
                      <button
                        className="secondary-button"
                        style={{ height: '38px', padding: '0 12px', fontSize: '12px' }}
                        onClick={() => {
                          setSearch('')
                          setPriorityFilter('Barchasi')
                          setCategoryFilter('Barchasi')
                          setAssigneeFilter('Barchasi')
                        }}
                        title="Filtrlarni tozalash"
                      >
                        <RotateCcw size={14} /> Tozalash
                      </button>
                    )}

                    {/* View Switcher */}
                    <div className="view-mode-buttons">
                      <button
                        className={`view-btn ${viewMode === 'kanban' ? 'view-btn-active' : ''}`}
                        onClick={() => setViewMode('kanban')}
                        title="Kanban doskasi"
                      >
                        <Grid size={18} />
                      </button>
                      <button
                        className={`view-btn ${viewMode === 'table' ? 'view-btn-active' : ''}`}
                        onClick={() => setViewMode('table')}
                        title="Jadval ro‘yxati"
                      >
                        <Table size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Kanban with Drag and Drop / Table */}
                {viewMode === 'kanban' ? (
                  <div className="kanban-board">
                    {columns.map((column) => {
                      const cards = visibleTasks.filter((task) => task.status === column.id)
                      const isOver = dragOverColumn === column.id
                      return (
                        <section
                          className={`kanban-column ${isOver ? 'kanban-column-dragover' : ''}`}
                          key={column.id}
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.dataTransfer.dropEffect = 'move'
                            setDragOverColumn(column.id)
                          }}
                          onDragLeave={(e) => {
                            if (e.currentTarget.contains(e.relatedTarget as Node)) return
                            setDragOverColumn(null)
                          }}
                          onDrop={(e) => handleDropOnColumn(e, column.id)}
                        >
                          <header className="column-heading">
                            <div className={`column-state ${column.color}`}>
                              <i />
                              {column.label}
                              <span>{counts[column.id] || 0}</span>
                            </div>
                            <button
                              className="column-add"
                              onClick={() => setShowTaskDialog(true)}
                              title="Yangi vazifa"
                            >
                              <Plus size={18} />
                            </button>
                          </header>

                          <div className="task-list">
                            {isOver && (
                              <div className="kanban-drop-placeholder animate-scale-in">
                                <span>↓ Shu ustunga tashlang</span>
                              </div>
                            )}
                            {cards.length ? (
                              cards.map((task, idx) => (
                                <TaskCard
                                  key={task.id}
                                  task={task}
                                  index={idx}
                                  onSelect={(t) => setSelectedTask(t)}
                                  onAdvance={(id, status) => void advanceTask(id, status)}
                                  draggable={true}
                                />
                              ))
                            ) : (
                              !isOver && (
                                <div className="column-empty">
                                  Vazifa yo‘q
                                </div>
                              )
                            )}
                          </div>
                        </section>
                      )
                    })}
                  </div>
                ) : (
                  <div className="team-table-wrap">
                    <table className="team-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>VAZIFA NOMI</th>
                          <th>YO‘NALISH</th>
                          <th>MUHIMLIK</th>
                          <th>HOLAT</th>
                          <th>MAS’UL DASTURCHI</th>
                          <th>MUDDATI</th>
                          <th style={{ textAlign: 'right', paddingRight: '22px' }}>AMAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleTasks.map((t) => (
                          <tr key={t.id} onClick={() => setSelectedTask(t)} className="table-row-hover" style={{ cursor: 'pointer' }}>
                            <td>#{t.id}</td>
                            <td><strong>{t.title}</strong></td>
                            <td><span className="task-category-badge">{t.category}</span></td>
                            <td><span className={`priority priority-${t.priority === 'Yuqori' ? 'high' : t.priority === 'Past' ? 'low' : 'medium'}`}>{t.priority}</span></td>
                            <td><span className={`status-pill status-${t.status}`}>{t.status_display || t.status}</span></td>
                            <td>
                              <div className="team-person">
                                <span className="avatar avatar-tiny" style={{ backgroundColor: t.color }}>{t.initials}</span>
                                <strong>{t.assignee}</strong>
                              </div>
                            </td>
                            <td>{t.due_date || t.due}</td>
                            <td style={{ textAlign: 'right', paddingRight: '18px' }}>
                              <button className="secondary-button" style={{ height: '32px', fontSize: '11.5px' }}>
                                Ko‘rish →
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              SUPERUSER VIEW 3: TEAM MANAGEMENT
              ======================================================== */}
          {isSuperuser && section === 'team' && (
            <div className="page-flow animate-fade-in">
              <div className="page-heading compact-heading">
                <div>
                  <div className="eyebrow">JAMOA BOSHQARUVI</div>
                  <h1>Jamoa a’zolari va hisoblar</h1>
                  <p>Dasturchilar hisoblari, yangi a’zo qo‘shish va xavfsizlikni boshqarish</p>
                </div>
              </div>
              <TeamPanel
                developers={developers}
                onAddDeveloper={addDeveloper}
                onToggleActive={toggleDeveloperActive}
                onResetPassword={resetDeveloperPassword}
                onUpdateDeveloper={updateDeveloper}
              />
            </div>
          )}

          {/* ========================================================
              DEVELOPER VIEW 1: MY ACTIVE TASKS (WITH DRAG & DROP)
              ======================================================== */}
          {!isSuperuser && section === 'my-tasks' && (
            <div className="page-flow animate-fade-in">
              <div className="page-heading">
                <div>
                  <div className="eyebrow">DASTURCHI ISH MAYDONI</div>
                  <h1>Salom, {user.name} — Mening vazifalarim</h1>
                  <p>Vazifangizni boshlash yoki tekshiruvga yuborish uchun ustunlararo tortib o‘tkazing.</p>
                </div>
              </div>

              {/* Developer stats */}
              <section className="stats-grid">
                <div className="stat-card">
                  <div className="stat-card-top">
                    <span>Mening topshiriqlarim</span>
                    <span className="stat-icon icon-violet"><ListTodo size={18} /></span>
                  </div>
                  <div className="stat-number">{tasks.length.toString().padStart(2, '0')}<span className="stat-inline-muted">ta</span></div>
                  <div className="stat-foot"><span>sizga biriktirilgan vazifalar</span></div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-top">
                    <span>Jarayonda</span>
                    <span className="stat-icon icon-blue"><CalendarClock size={18} /></span>
                  </div>
                  <div className="stat-number">{tasks.filter((t) => t.status === 'progress').length.toString().padStart(2, '0')}<span className="stat-inline-muted">faol</span></div>
                  <div className="stat-foot"><span>bajarilayotgan ishlar</span></div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-top">
                    <span>Tekshiruvda</span>
                    <span className="stat-icon icon-amber"><Clock size={18} /></span>
                  </div>
                  <div className="stat-number">{tasks.filter((t) => t.status === 'review').length.toString().padStart(2, '0')}<span className="stat-inline-muted">kutilmoqda</span></div>
                  <div className="stat-foot"><span>administrator tekshiruvida</span></div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-top">
                    <span>Bajarilgan</span>
                    <span className="stat-icon icon-green"><CheckCircle2 size={18} /></span>
                  </div>
                  <div className="stat-number">{tasks.filter((t) => t.status === 'done').length.toString().padStart(2, '0')}<span className="stat-inline-muted">tasdiqlangan</span></div>
                  <div className="stat-foot"><span>muvaffaqiyatli topshirilgan</span></div>
                </div>
              </section>

              {/* Board */}
              <div className="board-section">
                <div className="board-heading">
                  <div>
                    <h2>Topshiriqlar taxtasi</h2>
                    <p>Vazifalarni tortib o‘tkazish (Drag & Drop) orqali holatini o‘zgartiring</p>
                  </div>
                  <div className="board-tools">
                    <div className="search-box">
                      <Search size={16} />
                      <input
                        ref={searchInputRef}
                        placeholder="Vazifa nomi bo‘yicha (Ctrl+K)..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                      {search && (
                        <button className="clear-search-btn" onClick={() => setSearch('')} title="Tozalash">
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Category Filter */}
                    <select
                      className="toolbar-select"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      {categoryValues.map((c) => (
                        <option key={c} value={c}>{c === 'Barchasi' ? 'Yo‘nalish: Barchasi' : c}</option>
                      ))}
                    </select>

                    {/* Priority Filter */}
                    <div className="filter-wrap">
                      <button
                        className={`toolbar-button ${priorityFilter !== 'Barchasi' ? 'filter-selected' : ''}`}
                        onClick={() => setFilterOpen((prev) => !prev)}
                      >
                        <Filter size={15} />
                        <span>{priorityFilter === 'Barchasi' ? 'Muhimlik' : priorityFilter}</span>
                      </button>
                      {filterOpen && (
                        <div className="filter-menu animate-scale-in">
                          <span>Muhimlik darajasi</span>
                          {priorityValues.map((p) => (
                            <button
                              key={p}
                              className={priorityFilter === p ? 'filter-option-active' : ''}
                              onClick={() => {
                                setPriorityFilter(p)
                                setFilterOpen(false)
                              }}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Sort Menu */}
                    <div className="filter-wrap">
                      <button className="toolbar-button" onClick={() => setSortOpen((prev) => !prev)}>
                        <span>{sortBy === 'newest' ? 'Eng yangi' : sortBy === 'priority' ? 'Muhimligi' : sortBy === 'due' ? 'Muddati' : 'Nomi'}</span>
                      </button>
                      {sortOpen && (
                        <div className="filter-menu animate-scale-in">
                          <span>Tartiblash</span>
                          <button onClick={() => { setSortBy('newest'); setSortOpen(false) }}>Eng yangi</button>
                          <button onClick={() => { setSortBy('priority'); setSortOpen(false) }}>Muhimlik</button>
                          <button onClick={() => { setSortBy('due'); setSortOpen(false) }}>Muddati</button>
                          <button onClick={() => { setSortBy('title'); setSortOpen(false) }}>Nomi (A-Z)</button>
                        </div>
                      )}
                    </div>

                    {/* Reset button if any filter applied */}
                    {(search || priorityFilter !== 'Barchasi' || categoryFilter !== 'Barchasi') && (
                      <button
                        className="secondary-button"
                        style={{ height: '38px', padding: '0 12px', fontSize: '12px' }}
                        onClick={() => {
                          setSearch('')
                          setPriorityFilter('Barchasi')
                          setCategoryFilter('Barchasi')
                        }}
                        title="Filtrlarni tozalash"
                      >
                        <RotateCcw size={14} /> Tozalash
                      </button>
                    )}

                    <div className="view-mode-buttons">
                      <button
                        className={`view-btn ${viewMode === 'kanban' ? 'view-btn-active' : ''}`}
                        onClick={() => setViewMode('kanban')}
                        title="Kanban doskasi"
                      >
                        <Grid size={18} />
                      </button>
                      <button
                        className={`view-btn ${viewMode === 'table' ? 'view-btn-active' : ''}`}
                        onClick={() => setViewMode('table')}
                        title="Jadval ro‘yxati"
                      >
                        <Table size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {viewMode === 'kanban' ? (
                  <div className="kanban-board">
                    {columns.map((column) => {
                      const cards = visibleTasks.filter((task) => task.status === column.id)
                      const isOver = dragOverColumn === column.id
                      return (
                        <section
                          className={`kanban-column ${isOver ? 'kanban-column-dragover' : ''}`}
                          key={column.id}
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.dataTransfer.dropEffect = 'move'
                            setDragOverColumn(column.id)
                          }}
                          onDragLeave={(e) => {
                            if (e.currentTarget.contains(e.relatedTarget as Node)) return
                            setDragOverColumn(null)
                          }}
                          onDrop={(e) => handleDropOnColumn(e, column.id)}
                        >
                          <header className="column-heading">
                            <div className={`column-state ${column.color}`}>
                              <i />
                              {column.label}
                              <span>{cards.length}</span>
                            </div>
                          </header>

                          <div className="task-list">
                            {isOver && (
                              <div className="kanban-drop-placeholder animate-scale-in">
                                <span>↓ Shu ustunga tashlang</span>
                              </div>
                            )}
                            {cards.length ? (
                              cards.map((task, idx) => (
                                <TaskCard
                                  key={task.id}
                                  task={task}
                                  index={idx}
                                  onSelect={(t) => setSelectedTask(t)}
                                  onAdvance={(id, status) => void advanceTask(id, status)}
                                  draggable={true}
                                />
                              ))
                            ) : (
                              !isOver && (
                                <div className="column-empty">
                                  Vazifa yo‘q
                                </div>
                              )
                            )}
                          </div>
                        </section>
                      )
                    })}
                  </div>
                ) : (
                  <div className="team-table-wrap">
                    <table className="team-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>VAZIFA NOMI</th>
                          <th>YO‘NALISH</th>
                          <th>MUHIMLIK</th>
                          <th>HOLAT</th>
                          <th>MUDDATI</th>
                          <th style={{ textAlign: 'right', paddingRight: '22px' }}>AMAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleTasks.map((t) => (
                          <tr key={t.id} onClick={() => setSelectedTask(t)} className="table-row-hover" style={{ cursor: 'pointer' }}>
                            <td>#{t.id}</td>
                            <td><strong>{t.title}</strong></td>
                            <td><span className="task-category-badge">{t.category}</span></td>
                            <td><span className={`priority priority-${t.priority === 'Yuqori' ? 'high' : t.priority === 'Past' ? 'low' : 'medium'}`}>{t.priority}</span></td>
                            <td><span className={`status-pill status-${t.status}`}>{t.status_display || t.status}</span></td>
                            <td>{t.due_date || t.due}</td>
                            <td style={{ textAlign: 'right', paddingRight: '18px' }}>
                              <button className="secondary-button" style={{ height: '32px', fontSize: '11.5px' }}>
                                Ko‘rish →
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              DEVELOPER VIEW 2: REVIEWS (PENDING APPROVAL)
              ======================================================== */}
          {!isSuperuser && section === 'reviews' && (
            <div className="page-flow animate-fade-in">
              <div className="page-heading">
                <div>
                  <div className="eyebrow">TEKSHIRUVDAGI TOPSHIRIQLAR</div>
                  <h1>Administrator ko‘rib chiqayotgan ishlar</h1>
                  <p>Siz topshirgan va tekshiruvda turgan vazifalar ro‘yxati</p>
                </div>
              </div>

              <div className="dashboard-card animate-slide-up">
                <div className="dashboard-card-head">
                  <div>
                    <h3>Tekshiruv navbati ({pendingReviews.length})</h3>
                    <p>Ushbu vazifalar administrator tomonidan tekshirilib tasdiqlangach «Bajarildi» holatiga o‘tadi</p>
                  </div>
                </div>

                {pendingReviews.length > 0 ? (
                  <div className="team-table-wrap">
                    <table className="team-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>VAZIFA NOMI</th>
                          <th>YO‘NALISH</th>
                          <th>MUDDATI</th>
                          <th>BIRIKTIRILGAN FAYLLAR</th>
                          <th style={{ textAlign: 'right', paddingRight: '22px' }}>AMAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingReviews.map((t) => (
                          <tr key={t.id} className="table-row-hover">
                            <td>#{t.id}</td>
                            <td>
                              <strong onClick={() => setSelectedTask(t)} style={{ cursor: 'pointer', color: '#edf2ee', textDecoration: 'underline' }}>
                                {t.title}
                              </strong>
                            </td>
                            <td><span className="task-category-badge">{t.category}</span></td>
                            <td>{t.due_date || t.due}</td>
                            <td>
                              {t.attachments && t.attachments.length > 0 ? (
                                <span style={{ color: '#9fe2b4' }}><Paperclip size={13} /> {t.attachments.length} ta fayl</span>
                              ) : (
                                <span style={{ color: '#828d85' }}>Fayl yo‘q</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right', paddingRight: '18px' }}>
                              <div style={{ display: 'inline-flex', gap: '8px' }}>
                                <button
                                  className="secondary-button"
                                  style={{ height: '32px', fontSize: '11.5px' }}
                                  onClick={() => advanceTask(t.id, 'progress', 'Dasturchi qayta ishlash uchun qaytarib oldi')}
                                >
                                  ↩ Qayta ishlashga qaytarish
                                </button>
                                <button
                                  className="primary-button"
                                  style={{ height: '32px', fontSize: '11.5px', padding: '0 12px' }}
                                  onClick={() => setSelectedTask(t)}
                                >
                                  Tafsilotlar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-box" style={{ margin: '16px' }}>
                    Hozircha tekshiruvda kutayotgan vazifangiz yo‘q. Faol vazifalaringizni bitkazib, tekshiruvga topshirishingiz mumkin.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              DEVELOPER VIEW 3: COMPLETED ARCHIVE
              ======================================================== */}
          {!isSuperuser && section === 'completed' && (
            <div className="page-flow animate-fade-in">
              <div className="page-heading">
                <div>
                  <div className="eyebrow">YAKUNLANGAN ISHLAR</div>
                  <h1>Bajarilgan topshiriqlar arxivi</h1>
                  <p>Administrator tomonidan muvaffaqiyatli qabul qilingan va tasdiqlangan topshiriqlaringiz</p>
                </div>
              </div>

              <div className="dashboard-card animate-slide-up">
                <div className="dashboard-card-head">
                  <div>
                    <h3>Muvaffaqiyatli yakunlanganlar ({completedTasks.length})</h3>
                    <p>Bajarilgan barcha vazifalar va ularning biriktirilgan hisobot fayllari</p>
                  </div>
                </div>

                {completedTasks.length > 0 ? (
                  <div className="team-table-wrap">
                    <table className="team-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>VAZIFA NOMI</th>
                          <th>YO‘NALISH</th>
                          <th>MUHIMLIK</th>
                          <th>HOLAT</th>
                          <th style={{ textAlign: 'right', paddingRight: '22px' }}>AMAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {completedTasks.map((t) => (
                          <tr key={t.id} className="table-row-hover">
                            <td>#{t.id}</td>
                            <td><strong onClick={() => setSelectedTask(t)} style={{ cursor: 'pointer', color: '#edf2ee', textDecoration: 'underline' }}>{t.title}</strong></td>
                            <td><span className="task-category-badge">{t.category}</span></td>
                            <td><span className={`priority priority-${t.priority === 'Yuqori' ? 'high' : t.priority === 'Past' ? 'low' : 'medium'}`}>{t.priority}</span></td>
                            <td><span className="status-pill status-done"><Check size={12} /> Bajarildi</span></td>
                            <td style={{ textAlign: 'right', paddingRight: '18px' }}>
                              <button
                                className="secondary-button"
                                style={{ height: '32px', fontSize: '11.5px' }}
                                onClick={() => setSelectedTask(t)}
                              >
                                Ko‘rish →
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-box" style={{ margin: '16px' }}>
                    Hozircha bajarilgan vazifalar mavjud emas.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              DEVELOPER VIEW 4: PROFILE & SECURITY (DIRECT PAGE)
              ======================================================== */}
          {!isSuperuser && section === 'profile' && (
            <div className="page-flow animate-fade-in">
              <div className="page-heading">
                <div>
                  <div className="eyebrow">SHAXSIY PROFIL</div>
                  <h1>Profil va xavfsizlik sozlamalari</h1>
                  <p>Shaxsiy ma’lumotlaringiz va hisobingiz xavfsizlik parolini boshqaring</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
                {/* Profile Details Card */}
                <div className="dashboard-card animate-slide-up" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                    <div className="avatar avatar-dev" style={{ width: '56px', height: '56px', fontSize: '20px' }}>
                      {user.initials || user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h2 style={{ margin: '0 0 4px', fontSize: '20px' }}>{user.name}</h2>
                      <span className="role-badge badge-developer"><User size={13} /> Dasturchi (Ijrochi)</span>
                      <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#88938b' }}>@{user.username}</p>
                    </div>
                  </div>

                  <div className="detail-meta-grid" style={{ marginTop: '20px' }}>
                    <div className="meta-card">
                      <span className="meta-card-label">Biriktirilgan topshiriqlar</span>
                      <strong style={{ fontSize: '18px', color: '#edf2ee' }}>{tasks.length} ta</strong>
                    </div>
                    <div className="meta-card">
                      <span className="meta-card-label">Bajarilgan ishlar</span>
                      <strong style={{ fontSize: '18px', color: '#9fe2b4' }}>{completedTasks.length} ta</strong>
                    </div>
                  </div>

                  <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #28302b' }}>
                    <button className="danger-button" onClick={logout} style={{ width: '100%' }}>
                      <LogOut size={16} /> Tizimdan chiqish
                    </button>
                  </div>
                </div>

                {/* Change Password Card */}
                <div className="dashboard-card animate-slide-up" style={{ padding: '24px' }}>
                  <h3 style={{ margin: '0 0 8px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <KeyRound size={18} color="#9fe2b4" /> Parolni o‘zgartirish
                  </h3>
                  <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#88938b' }}>
                    Hisobingiz xavfsizligi uchun kuchli paroldan foydalaning (kamida 8 belgi).
                  </p>

                  <form onSubmit={handlePasswordChangeSubmit}>
                    <label className="form-label">
                      Joriy parol
                      <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                        placeholder="Hozirgi parolingizni kiriting"
                      />
                    </label>

                    <label className="form-label">
                      Yangi parol
                      <input
                        type="password"
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        required
                        minLength={8}
                        placeholder="Yangi kuchli parol"
                      />
                    </label>

                    <label className="form-label">
                      Yangi parolni takrorlang
                      <input
                        type="password"
                        value={confirmPass}
                        onChange={(e) => setConfirmPass(e.target.value)}
                        required
                        minLength={8}
                        placeholder="Parolni qayta tering"
                      />
                    </label>

                    {passError && <div className="login-error animate-shake">{passError}</div>}
                    {passSuccess && <div className="login-success"><Check size={16} /> {passSuccess}</div>}

                    <button className="primary-button" style={{ width: '100%', marginTop: '10px' }} disabled={savingPass}>
                      {savingPass ? 'Saqlanmoqda…' : 'Parolni saqlash'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Task Creation Dialog (Superuser only) */}
      {showTaskDialog && (
        <TaskDialog
          developers={developers}
          onClose={() => setShowTaskDialog(false)}
          onCreate={(task) => void addTask(task)}
        />
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          currentUser={user}
          developers={developers}
          onClose={() => setSelectedTask(null)}
          onStatusChange={advanceTask}
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
          onUploadAttachment={uploadAttachment}
          onAddComment={addComment}
        />
      )}

      {/* Profile & Settings Modal */}
      {showProfileModal && (
        <ProfileModal
          currentUser={user}
          onClose={() => setShowProfileModal(false)}
          onUpdateProfile={handleUpdateProfile}
          onLogout={logout}
        />
      )}

      {/* Toast Flash Notification */}
      {flash && (
        <div className="toast" role="status">
          <Check size={16} />
          {flash}
          <button aria-label="Xabarni yopish" onClick={() => setFlash('')}>
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  )
}
