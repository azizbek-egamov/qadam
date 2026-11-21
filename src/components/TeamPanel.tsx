import {
  Check,
  Copy,
  Edit3,
  KeyRound,
  MoreHorizontal,
  Plus,
  Power,
  Search,
  Shield,
  UserCheck,
  UserRoundPlus,
  UserX,
  X
} from 'lucide-react'
import { useState } from 'react'
import type { Developer } from '../types'

interface TeamPanelProps {
  developers: Developer[]
  onAddDeveloper: (name: string, username: string) => Promise<string | null>
  onToggleActive?: (id: number, active: boolean) => Promise<void>
  onResetPassword?: (id: number) => Promise<string | null>
  onUpdateDeveloper?: (
    id: number,
    payload: { name?: string; username?: string; password?: string; active?: boolean }
  ) => Promise<string | null>
}

export function TeamPanel({
  developers,
  onAddDeveloper,
  onToggleActive,
  onResetPassword,
  onUpdateDeveloper,
}: TeamPanelProps) {
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [issuedPassword, setIssuedPassword] = useState('')
  const [resetModalData, setResetModalData] = useState<{ name: string; username: string; password: string } | null>(null)
  const [activeMenu, setActiveMenu] = useState<{
    id: number
    person: Developer
    x: number
    y: number
  } | null>(null)
  const [copied, setCopied] = useState(false)

  // Edit developer modal state
  const [editingPerson, setEditingPerson] = useState<Developer | null>(null)
  const [editName, setEditName] = useState('')
  const [editUsername, setEditUsername] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editActive, setEditActive] = useState(true)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')
  const [editSuccess, setEditSuccess] = useState('')

  const filtered = developers.filter((person) =>
    `${person.name} ${person.username}`.toLowerCase().includes(query.toLowerCase())
  )

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    const password = await onAddDeveloper(name, username)
    if (password) {
      setIssuedPassword(password)
    }
  }

  function startEdit(person: Developer) {
    setActiveMenu(null)
    setEditingPerson(person)
    setEditName(person.name)
    setEditUsername(person.username)
    setEditPassword('')
    setEditActive(person.active)
    setEditError('')
    setEditSuccess('')
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingPerson || !onUpdateDeveloper) return
    setEditError('')
    setEditSuccess('')

    if (!editName.trim()) {
      setEditError('Ism bo‘sh bo‘lishi mumkin emas.')
      return
    }
    if (!editUsername.trim()) {
      setEditError('Login bo‘sh bo‘lishi mumkin emas.')
      return
    }
    if (editPassword && editPassword.length < 6) {
      setEditError('Parol kamida 6 ta belgidan iborat bo‘lishi kerak.')
      return
    }

    setEditLoading(true)
    try {
      const err = await onUpdateDeveloper(editingPerson.id, {
        name: editName.trim(),
        username: editUsername.trim(),
        password: editPassword.trim() || undefined,
        active: editActive,
      })
      if (err) {
        setEditError(err)
      } else {
        setEditSuccess('Dasturchi maʼlumotlari muvaffaqiyatli saqlandi!')
        setTimeout(() => {
          setEditingPerson(null)
        }, 1200)
      }
    } finally {
      setEditLoading(false)
    }
  }

  async function handleResetPassword(person: Developer) {
    setActiveMenu(null)
    if (!onResetPassword) return
    if (!confirm(`${person.name} (@${person.username}) uchun yangi vaqtinchalik parol yaratilsinmi?`)) return
    const newPass = await onResetPassword(person.id)
    if (newPass) {
      setResetModalData({ name: person.name, username: person.username, password: newPass })
    }
  }

  async function handleToggle(person: Developer) {
    setActiveMenu(null)
    if (!onToggleActive) return
    await onToggleActive(person.id, !person.active)
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="team-panel">
      {/* Toolbar */}
      <div className="team-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            aria-label="Jamoa a’zolaridan qidirish"
            placeholder="Ism yoki login bo‘yicha qidiring..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <button
          className="primary-button"
          onClick={() => {
            setAdding(true)
            setIssuedPassword('')
            setName('')
            setUsername('')
          }}
        >
          <Plus size={16} /> Dasturchi qo‘shish
        </button>
      </div>

      {/* Main Table Card */}
      <div className="team-card">
        <div className="team-card-head">
          <div>
            <h3>Jamoa a’zolari ro‘yxati</h3>
            <p>Dasturchilar, ularning topshiriqlari va tizimdagi faolligi</p>
          </div>
          <span className="team-total">{developers.length} ta dasturchi</span>
        </div>

        <div className="team-table-wrap">
          <table className="team-table">
            <thead>
              <tr>
                <th>ISHTIROKCHI</th>
                <th>BAJARILGAN</th>
                <th>JARAYONDA</th>
                <th>FAOLLIK</th>
                <th>HOLAT</th>
                <th style={{ textAlign: 'right', paddingRight: '20px' }}>AMALLAR</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((person) => (
                <tr key={person.id} className={!person.active ? 'row-inactive' : ''}>
                  <td>
                    <div className="team-person">
                      <span className="avatar" style={{ backgroundColor: person.color }}>
                        {person.initials}
                      </span>
                      <div>
                        <strong>{person.name}</strong>
                        <small>@{person.username}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <strong>{person.completed || 0}</strong>
                    <span className="table-sub"> ta vazifa</span>
                  </td>
                  <td>
                    <strong style={{ color: '#9cb7dd' }}>{person.in_progress || 0}</strong>
                    <span className="table-sub"> faol</span>
                  </td>
                  <td>
                    <div className="activity-indicator">
                      <span style={{ width: `${Math.min(98, 20 + (person.completed || 0) * 8)}%` }} />
                    </div>
                  </td>
                  <td>
                    <span className={`member-status ${person.active ? 'status-active' : 'status-inactive'}`}>
                      <i />
                      {person.active ? 'Faol' : 'Nofaol'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '16px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        className="icon-btn"
                        title="Tahrirlash"
                        onClick={() => startEdit(person)}
                        style={{ color: '#9fe2b4' }}
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        className="icon-btn"
                        aria-label={`${person.name} amallari`}
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect()
                          setActiveMenu((prev) =>
                            prev?.id === person.id
                              ? null
                              : {
                                  id: person.id,
                                  person,
                                  x: rect.right,
                                  y: rect.bottom + 6,
                                }
                          )
                        }}
                      >
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="team-card-foot">
          <div className="team-card-foot-left">
            <Shield size={14} />
            <span>Faqat super administrator a’zolarni boshqarishi va maʼlumotlarini tahrirlashi mumkin</span>
          </div>
          <span className="team-stat-info">Jami a’zolar: {developers.length} ta</span>
        </div>
      </div>

      {/* Edit Developer Modal */}
      {editingPerson && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEditingPerson(null)
          }}
        >
          <section className="task-dialog small-dialog" role="dialog" aria-modal="true">
            <div className="dialog-header">
              <div>
                <span className="eyebrow">JAMOA SOZLAMALARI</span>
                <h2>Dasturchini tahrirlash</h2>
              </div>
              <button className="icon-btn" onClick={() => setEditingPerson(null)} aria-label="Yopish">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <label className="form-label">
                To‘liq ism
                <input
                  autoFocus
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Masalan: Ali Valiyev"
                  maxLength={120}
                />
              </label>

              <label className="form-label">
                Login (foydalanuvchi nomi)
                <input
                  required
                  pattern="[A-Za-z0-9._-]{3,30}"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="ali.valiyev"
                  minLength={3}
                  maxLength={30}
                />
                <small className="field-hint">3–30 belgi: harflar, raqamlar, nuqta yoki chiziqcha</small>
              </label>

              <label className="form-label">
                Yangi parol (ixtiyoriy)
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Parolni o‘zgartirish uchun yangi parol yozing"
                  minLength={6}
                />
                <small className="field-hint">Parol o‘zgarmasligi uchun bo‘sh qoldiring.</small>
              </label>

              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '10px' }}>
                <input
                  type="checkbox"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#369e68' }}
                />
                <span style={{ fontSize: '13px', color: '#d8e2dc' }}>Ushbu hisob faol bo‘lsin</span>
              </label>

              {editError && (
                <div className="login-error animate-fade-in" style={{ marginTop: '12px' }}>
                  {editError}
                </div>
              )}
              {editSuccess && (
                <div className="login-success animate-fade-in" style={{ marginTop: '12px' }}>
                  <Check size={14} /> {editSuccess}
                </div>
              )}

              <div className="dialog-actions">
                <button type="button" className="secondary-button" onClick={() => setEditingPerson(null)}>
                  Bekor qilish
                </button>
                <button className="primary-button" type="submit" disabled={editLoading}>
                  {editLoading ? 'Saqlanmoqda…' : 'Saqlash'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Add Developer Modal */}
      {adding && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setAdding(false)
          }}
        >
          <section className="task-dialog small-dialog" role="dialog" aria-modal="true" aria-labelledby="member-title">
            <div className="dialog-header">
              <div>
                <span className="eyebrow">JAMOA</span>
                <h2 id="member-title">Yangi dasturchi hisobi</h2>
              </div>
              <button className="icon-btn" onClick={() => setAdding(false)} aria-label="Yopish">
                <X size={18} />
              </button>
            </div>

            {issuedPassword ? (
              <div className="password-issued">
                <div className="password-success">
                  <UserRoundPlus size={19} />
                </div>
                <h3>Hisob yaratildi!</h3>
                <p>
                  Login va vaqtinchalik parolni dasturchiga xavfsiz tarzda yuboring. Dasturchi birinchi kirishda yangi parol o‘rnatadi.
                </p>
                <div className="credential-line">
                  <span>Login</span>
                  <strong>{username}</strong>
                  <button aria-label="Loginni nusxalash" onClick={() => copyToClipboard(username)} title="Nusxalash">
                    <Copy size={14} />
                  </button>
                </div>
                <div className="credential-line">
                  <span>Parol</span>
                  <strong>{issuedPassword}</strong>
                  <button
                    aria-label="Parolni nusxalash"
                    onClick={() => copyToClipboard(issuedPassword)}
                    title="Nusxalash"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                {copied && <div className="copy-notice">✓ Nusxalandi!</div>}
                <button
                  className="primary-button full-button"
                  onClick={() => {
                    setAdding(false)
                    setName('')
                    setUsername('')
                    setIssuedPassword('')
                  }}
                >
                  Tushunarli, yakunlash
                </button>
              </div>
            ) : (
              <form onSubmit={submit}>
                <label className="form-label">
                  Dasturchining to‘liq ismi
                  <input
                    autoFocus
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Masalan: Sardor Rahimov"
                    maxLength={120}
                  />
                </label>
                <label className="form-label">
                  Login (foydalanuvchi nomi)
                  <input
                    required
                    pattern="[A-Za-z0-9._-]{3,30}"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="sardor.rahimov"
                    minLength={3}
                    maxLength={30}
                  />
                  <small className="field-hint">3–30 belgi: lotin harflari, raqam, nuqta yoki chiziqcha</small>
                </label>
                <div className="credential-notice">
                  <Shield size={15} /> Xavfsiz vaqtinchalik parol tizim tomonidan avtomatik yaratiladi.
                </div>
                <div className="dialog-actions">
                  <button type="button" className="secondary-button" onClick={() => setAdding(false)}>
                    Bekor qilish
                  </button>
                  <button className="primary-button" type="submit">
                    Hisob yaratish
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModalData && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setResetModalData(null)
          }}
        >
          <section className="task-dialog small-dialog">
            <div className="dialog-header">
              <div>
                <span className="eyebrow">XAVFSIZLIK</span>
                <h2>Yangi vaqtinchalik parol</h2>
              </div>
              <button className="icon-btn" onClick={() => setResetModalData(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="password-issued">
              <div className="password-success">
                <KeyRound size={19} />
              </div>
              <h3>Parol yangilandi</h3>
              <p>
                <strong>{resetModalData.name}</strong> (@{resetModalData.username}) uchun yangi parol o‘rnatildi:
              </p>
              <div className="credential-line">
                <span>Parol</span>
                <strong>{resetModalData.password}</strong>
                <button onClick={() => copyToClipboard(resetModalData.password)}>
                  <Copy size={14} />
                </button>
              </div>
              {copied && <div className="copy-notice">✓ Nusxalandi!</div>}
              <button className="primary-button full-button" onClick={() => setResetModalData(null)}>
                Yopish
              </button>
            </div>
          </section>
        </div>
      )}
      {/* Floating Tooltip Menu */}
      {activeMenu && (
        <>
          <div
            className="tooltip-backdrop"
            onClick={() => setActiveMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault()
              setActiveMenu(null)
            }}
          />
          <div
            className="action-tooltip-menu animate-scale-in"
            style={{
              position: 'fixed',
              top: `${activeMenu.y}px`,
              left: `${activeMenu.x}px`,
              transform: 'translateX(-100%)',
              zIndex: 9999,
            }}
          >
            <div className="tooltip-caret" />
            <button
              onClick={() => {
                const person = activeMenu.person
                setActiveMenu(null)
                startEdit(person)
              }}
            >
              <Edit3 size={13} /> Maʼlumotlarni tahrirlash
            </button>
            <button
              onClick={() => {
                const person = activeMenu.person
                setActiveMenu(null)
                handleResetPassword(person)
              }}
            >
              <KeyRound size={13} /> Parolni tiklash
            </button>
            <button
              onClick={() => {
                const person = activeMenu.person
                setActiveMenu(null)
                handleToggle(person)
              }}
            >
              {activeMenu.person.active ? (
                <>
                  <UserX size={13} /> Nofaol qilish
                </>
              ) : (
                <>
                  <UserCheck size={13} /> Faollashtirish
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
