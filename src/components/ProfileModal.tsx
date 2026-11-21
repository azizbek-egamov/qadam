import { FormEvent, useState } from 'react'
import { Check, Edit3, KeyRound, Lock, LogOut, Shield, User, Users, X } from 'lucide-react'
import type { CurrentUser } from '../types'

interface ProfileModalProps {
  currentUser: CurrentUser
  onClose: () => void
  onUpdateProfile: (payload: {
    name?: string
    username?: string
    new_password?: string
    current_password?: string
  }) => Promise<string | null>
  onLogout: () => void
}

export function ProfileModal({
  currentUser,
  onClose,
  onUpdateProfile,
  onLogout,
}: ProfileModalProps) {
  const [name, setName] = useState(currentUser.name || '')
  const [username, setUsername] = useState(currentUser.username || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!name.trim()) {
      setError('Ism bo‘sh bo‘lishi mumkin emas.')
      return
    }
    if (!username.trim()) {
      setError('Login bo‘sh bo‘lishi mumkin emas.')
      return
    }

    if (newPassword) {
      if (newPassword.length < 8) {
        setError('Yangi parol kamida 8 ta belgidan iborat bo‘lishi kerak.')
        return
      }
      if (newPassword !== confirmPassword) {
        setError('Yangi parollar bir-biriga mos kelmadi.')
        return
      }
      if (!currentUser.is_superuser && !currentPassword) {
        setError('Parolni o‘zgartirish uchun joriy parolingizni kiriting.')
        return
      }
    }

    setLoading(true)
    try {
      const err = await onUpdateProfile({
        name: name.trim(),
        username: username.trim(),
        new_password: newPassword || undefined,
        current_password: currentPassword || undefined,
      })
      if (err) {
        setError(err)
      } else {
        setSuccess('Maʼlumotlar muvaffaqiyatli saqlandi!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <section className="task-dialog profile-dialog" role="dialog" aria-modal="true">
        <div className="dialog-header">
          <div>
            <span className="eyebrow">FOYDALANUVCHI SOZLAMALARI</span>
            <h2>Mening hisobim</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Yopish">
            <X size={18} />
          </button>
        </div>

        {/* Profile Card Banner */}
        <div className={`profile-hero-card ${currentUser.is_superuser ? 'hero-admin' : 'hero-developer'}`}>
          <div className="profile-hero-avatar">
            {currentUser.initials || (currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : 'U')}
          </div>
          <div className="profile-hero-info">
            <div className="profile-hero-name">
              <h3>{currentUser.name}</h3>
              <span className={`role-badge ${currentUser.is_superuser ? 'badge-admin' : 'badge-developer'}`}>
                {currentUser.is_superuser ? <Shield size={12} /> : <User size={12} />}
                {currentUser.is_superuser ? 'Super Administrator' : 'Dasturchi (Ijrochi)'}
              </span>
            </div>
            <p className="profile-hero-username">@{currentUser.username}</p>
            <p className="profile-hero-desc">
              {currentUser.is_superuser
                ? 'Tizim boshqaruvchisi: vazifalar yaratish, barcha aʼzolar maʼlumotlarini boshqarish huquqiga ega.'
                : 'Loyiha dasturchisi: o‘ziga biriktirilgan vazifalarni bajarish va hisobot berish huquqiga ega.'}
            </p>
          </div>
        </div>

        {/* Edit Profile Form */}
        <form onSubmit={handleSubmit} className="profile-edit-form">
          <div className="form-row">
            <label className="form-label">
              To‘liq ism
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ismingiz va familiyangiz"
              />
            </label>
            <label className="form-label">
              Login (Username)
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Foydalanuvchi logini"
              />
            </label>
          </div>

          <div className="profile-password-section" style={{ marginTop: '16px', borderTop: '1px solid #28342c', paddingTop: '16px' }}>
            <span className="section-title">
              <KeyRound size={14} /> Parolni o‘zgartirish (ixtiyoriy)
            </span>
            <p className="field-hint" style={{ fontSize: '11.5px', color: '#7a8c80', margin: '4px 0 10px' }}>
              Parolni o‘zgartirishni istamasangiz, ushbu maydonlarni bo‘sh qoldiring.
            </p>

            {(!currentUser.is_superuser || currentPassword) && (
              <label className="form-label">
                Joriy parol
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Amaldagi parolingiz"
                />
              </label>
            )}

            <div className="form-row">
              <label className="form-label">
                Yangi parol
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  placeholder="Kamida 8 belgi"
                />
              </label>
              <label className="form-label">
                Yangi parolni takrorlang
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  placeholder="Takrorlang"
                />
              </label>
            </div>
          </div>

          {error && <div className="login-error animate-fade-in" style={{ marginTop: '10px' }}>{error}</div>}
          {success && (
            <div className="login-success animate-fade-in" style={{ marginTop: '10px' }}>
              <Check size={14} /> {success}
            </div>
          )}

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Saqlanmoqda…' : 'O‘zgarishlarni saqlash'}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="dialog-actions profile-footer">
          <button type="button" className="danger-button" onClick={onLogout}>
            <LogOut size={15} /> Tizimdan chiqish
          </button>
          <button type="button" className="secondary-button" onClick={onClose}>
            Yopish
          </button>
        </div>
      </section>
    </div>
  )
}
