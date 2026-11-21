import { FormEvent, useState } from 'react'
import {
  Activity,
  ArrowRight,
  Calendar,
  Check,
  Clock,
  Download,
  Edit2,
  FileText,
  Image,
  Paperclip,
  Plus,
  Send,
  Trash2,
  UploadCloud,
  User,
  X
} from 'lucide-react'
import type { CurrentUser, Developer, Status, TaskItem } from '../types'

interface TaskDetailModalProps {
  task: TaskItem
  currentUser: CurrentUser
  developers: Developer[]
  onClose: () => void
  onStatusChange: (id: number, status: Status, note?: string) => Promise<void>
  onUpdateTask: (id: number, data: Partial<TaskItem> & { assignee_id?: number }) => Promise<void>
  onDeleteTask: (id: number) => Promise<void>
  onUploadAttachment: (id: number, file: File) => Promise<void>
  onAddComment: (id: number, note: string) => Promise<void>
}

const statusLabels: Record<Status, string> = {
  new: 'Yangi',
  progress: 'Jarayonda',
  review: 'Tekshiruvda',
  done: 'Bajarildi',
}

const priorityClasses: Record<string, string> = {
  Yuqori: 'priority-high',
  'O‘rta': 'priority-medium',
  Past: 'priority-low',
}

export function TaskDetailModal({
  task,
  currentUser,
  developers,
  onClose,
  onStatusChange,
  onUpdateTask,
  onDeleteTask,
  onUploadAttachment,
  onAddComment,
}: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDescription, setEditDescription] = useState(task.description || '')
  const [editCategory, setEditCategory] = useState(task.category || 'Frontend')
  const [editPriority, setEditPriority] = useState(task.priority || 'O‘rta')
  const [editAssigneeId, setEditAssigneeId] = useState<number>(task.assignee_id || developers[0]?.id || 1)
  const [editDueDate, setEditDueDate] = useState(task.due_date || '')

  const [commentText, setCommentText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isAssigned = currentUser.id === task.assignee_id
  const canManage = currentUser.is_superuser
  const canInteract = canManage || isAssigned

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault()
    if (!editTitle.trim()) return
    setSavingEdit(true)
    try {
      await onUpdateTask(task.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        category: editCategory,
        priority: editPriority,
        assignee_id: editAssigneeId,
        due_date: editDueDate || undefined,
      })
      setIsEditing(false)
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleAddComment(e: FormEvent) {
    e.preventDefault()
    if (!commentText.trim()) return
    setSubmittingComment(true)
    try {
      await onAddComment(task.id, commentText.trim())
      setCommentText('')
    } finally {
      setSubmittingComment(false)
    }
  }

  async function handleFileUpload(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      alert('Fayl hajmi 10 MB dan oshmasligi kerak!')
      return
    }
    setUploading(true)
    try {
      await onUploadAttachment(task.id, file)
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Haqiqatan ham bu vazifani butunlay o‘chirib tashlamoqchimisiz?')) return
    setDeleting(true)
    try {
      await onDeleteTask(task.id)
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <section className="task-dialog task-detail-dialog" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="dialog-header">
          <div>
            <div className="detail-tags-top">
              <span className={`status-pill status-${task.status}`}>
                <span />
                {statusLabels[task.status] || task.status}
              </span>
              <span className={`priority ${priorityClasses[task.priority] || 'priority-medium'}`}>
                <span />
                {task.priority}
              </span>
              <span className="task-category-badge">{task.category}</span>
              <span className="task-id-tag">ID: #{task.id}</span>
            </div>
            {!isEditing && <h2 className="detail-title">{task.title}</h2>}
          </div>
          <div className="detail-header-actions">
            {canManage && !isEditing && (
              <button className="icon-btn" onClick={() => setIsEditing(true)} title="Tahrirlash">
                <Edit2 size={16} />
              </button>
            )}
            {canManage && (
              <button className="icon-btn delete-icon-btn" onClick={handleDelete} disabled={deleting} title="O‘chirish">
                <Trash2 size={16} />
              </button>
            )}
            <button className="icon-btn" onClick={onClose} aria-label="Yopish">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Edit Form or Normal Content */}
        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="detail-edit-form">
            <label className="form-label">
              Vazifa nomi
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                maxLength={180}
              />
            </label>
            <label className="form-label">
              Tavsif
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={5}
                maxLength={4000}
              />
            </label>
            <div className="form-row">
              <label className="form-label">
                Yo‘nalish
                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                  {['Frontend', 'Backend', 'Dizayn', 'Tahlil', 'Boshqa'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="form-label">
                Muhimlik
                <select value={editPriority} onChange={(e) => setEditPriority(e.target.value as any)}>
                  {['Yuqori', 'O‘rta', 'Past'].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-row">
              <label className="form-label">
                Mas’ul dasturchi
                <select value={editAssigneeId} onChange={(e) => setEditAssigneeId(Number(e.target.value))}>
                  {developers.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} (@{d.username})</option>
                  ))}
                </select>
              </label>
              <label className="form-label">
                Muddati
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                />
              </label>
            </div>
            <div className="dialog-actions">
              <button type="button" className="secondary-button" onClick={() => setIsEditing(false)}>
                Bekor qilish
              </button>
              <button type="submit" className="primary-button" disabled={savingEdit}>
                {savingEdit ? 'Saqlanmoqda…' : 'Saqlash'}
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* Quick Status Workflow Bar */}
            <div className="status-flow-box">
              <span className="flow-label">Bosqichni o‘zgartirish:</span>
              <div className="flow-buttons">
                {currentUser.is_superuser ? (
                  // Superuser can set any status
                  <>
                    <button
                      className={`flow-btn ${task.status === 'new' ? 'flow-btn-current' : ''}`}
                      onClick={() => onStatusChange(task.id, 'new', 'Administrator holatni Yangiga qaytardi')}
                    >
                      Yangi
                    </button>
                    <ArrowRight size={13} className="flow-arrow" />
                    <button
                      className={`flow-btn ${task.status === 'progress' ? 'flow-btn-current' : ''}`}
                      onClick={() => onStatusChange(task.id, 'progress', 'Administrator holatni Jarayondaga o‘tkazdi')}
                    >
                      Jarayonda
                    </button>
                    <ArrowRight size={13} className="flow-arrow" />
                    <button
                      className={`flow-btn ${task.status === 'review' ? 'flow-btn-current' : ''}`}
                      onClick={() => onStatusChange(task.id, 'review', 'Administrator holatni Tekshiruvdaga o‘tkazdi')}
                    >
                      Tekshiruvda
                    </button>
                    <ArrowRight size={13} className="flow-arrow" />
                    <button
                      className={`flow-btn ${task.status === 'done' ? 'flow-btn-current' : ''}`}
                      onClick={() => onStatusChange(task.id, 'done', 'Administrator vazifani Bajarildi deb tasdiqladi')}
                    >
                      Bajarildi
                    </button>
                  </>
                ) : isAssigned ? (
                  // Developer workflow
                  <>
                    {task.status === 'new' && (
                      <button
                        className="primary-button flow-action-btn"
                        onClick={() => onStatusChange(task.id, 'progress', 'Dasturchi vazifani bajarishni boshladi')}
                      >
                        ▶ Ishni boshlash (Jarayonda)
                      </button>
                    )}
                    {task.status === 'progress' && (
                      <button
                        className="primary-button flow-action-btn"
                        onClick={() => onStatusChange(task.id, 'review', 'Dasturchi vazifani tekshiruvga topshirdi')}
                      >
                        📤 Tekshiruvga yuborish
                      </button>
                    )}
                    {task.status === 'review' && (
                      <div className="review-wait-box">
                        <Clock size={15} />
                        <span>Administrator tekshiruvida kutilyapti...</span>
                        <button
                          className="secondary-button"
                          onClick={() => onStatusChange(task.id, 'progress', 'Dasturchi qayta ishlash uchun qaytarib oldi')}
                        >
                          ↩ Qayta ishlashga qaytarish
                        </button>
                      </div>
                    )}
                    {task.status === 'done' && (
                      <div className="done-badge-box">
                        <Check size={16} />
                        <span>Vazifa to‘liq bajarildi va tasdiqlandi</span>
                      </div>
                    )}
                  </>
                ) : (
                  <span className="muted-text">Bu vazifa boshqa a’zoga biriktirilgan.</span>
                )}
              </div>
            </div>

            {/* Task Description */}
            <div className="detail-section">
              <span className="section-title">Vazifa tavsifi</span>
              <p className="detail-description">
                {task.description || <em className="text-muted">Tavsif kiritilmagan.</em>}
              </p>
            </div>

            {/* Metadata Grid */}
            <div className="detail-meta-grid">
              <div className="meta-card">
                <span className="meta-card-label">Mas’ul dasturchi</span>
                <div className="meta-user">
                  <span className="avatar avatar-small" style={{ backgroundColor: task.color }}>
                    {task.initials}
                  </span>
                  <div>
                    <strong>{task.assignee}</strong>
                    {task.assignee_username && <small>@{task.assignee_username}</small>}
                  </div>
                </div>
              </div>
              <div className="meta-card">
                <span className="meta-card-label">Muddati</span>
                <div className="meta-value">
                  <Calendar size={15} />
                  <span>{task.due_date || task.due || 'Belgilanmagan'}</span>
                </div>
              </div>
              <div className="meta-card">
                <span className="meta-card-label">Topshiriq beruvchi</span>
                <div className="meta-value">
                  <User size={15} />
                  <span>{task.creator || 'Administrator'}</span>
                </div>
              </div>
              <div className="meta-card">
                <span className="meta-card-label">Yaratilgan vaqti</span>
                <div className="meta-value">
                  <Clock size={15} />
                  <span>
                    {task.created_at ? new Date(task.created_at).toLocaleDateString('uz-UZ') : 'Yaqinda'}
                  </span>
                </div>
              </div>
            </div>

            {/* Attachments Section */}
            <div className="detail-section">
              <div className="section-header">
                <span className="section-title">
                  <Paperclip size={14} /> Biriktirilgan fayllar ({task.attachments?.length || 0})
                </span>
                {canInteract && (
                  <label className="secondary-button upload-trigger-btn">
                    <UploadCloud size={14} />
                    <span>{uploading ? 'Yuklanmoqda…' : 'Fayl qo‘shish'}</span>
                    <input
                      type="file"
                      style={{ display: 'none' }}
                      accept="image/png,image/jpeg,image/webp,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) void handleFileUpload(file)
                      }}
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>

              {task.attachments && task.attachments.length > 0 ? (
                <div className="attachments-list">
                  {task.attachments.map((att) => {
                    const isPdf = att.original_name.toLowerCase().endsWith('.pdf')
                    const isImg = /\.(png|jpe?g|webp)$/i.test(att.original_name)
                    const sizeKb = (att.size / 1024).toFixed(0)
                    return (
                      <div key={att.id} className="attachment-row">
                        <div className="attachment-icon">
                          {isPdf ? <FileText size={17} /> : isImg ? <Image size={17} /> : <Paperclip size={17} />}
                        </div>
                        <div className="attachment-info">
                          <strong className="attachment-filename">{att.original_name}</strong>
                          <small>
                            {sizeKb} KB · {att.uploaded_by_name || 'A’zo'} ·{' '}
                            {new Date(att.created_at).toLocaleDateString('uz-UZ')}
                          </small>
                        </div>
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          download={att.original_name}
                          className="icon-btn download-btn"
                          title="Faylni yuklab olish"
                        >
                          <Download size={15} />
                        </a>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="empty-box">Hozircha biriktirilgan fayl yo‘q.</div>
              )}
            </div>

            {/* Activity History & Comments */}
            <div className="detail-section">
              <span className="section-title">
                <Activity size={14} /> Jarayon tarixi va sharhlar
              </span>

              {/* Add Comment Input */}
              {canInteract && (
                <form onSubmit={handleAddComment} className="comment-form">
                  <input
                    type="text"
                    placeholder="Vazifa bo‘yicha izoh yoki hisobot qoldiring..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    maxLength={1000}
                  />
                  <button type="submit" className="primary-button" disabled={submittingComment || !commentText.trim()}>
                    <Send size={14} />
                    <span>Yuborish</span>
                  </button>
                </form>
              )}

              {/* Timeline */}
              {task.activities && task.activities.length > 0 ? (
                <div className="timeline-list">
                  {task.activities.map((act) => (
                    <div key={act.id} className="timeline-item">
                      <div className="timeline-dot" />
                      <div className="timeline-content">
                        <div className="timeline-head">
                          <strong>{act.actor_name}</strong>
                          <span className="timeline-action">
                            {act.action === 'created'
                              ? 'vazifani yaratdi'
                              : act.action === 'status_changed'
                              ? `holatni o‘zgartirdi: ${statusLabels[act.from_status as Status] || act.from_status} → ${statusLabels[act.to_status as Status] || act.to_status}`
                              : act.action === 'attachment_uploaded'
                              ? 'fayl yukladi'
                              : 'sharh qoldirdi'}
                          </span>
                          <small className="timeline-time">
                            {new Date(act.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                          </small>
                        </div>
                        {act.note && <div className="timeline-note">{act.note}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-box">Hali amallar tarixi mavjud emas.</div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  )
}

