import { FormEvent, useState, useRef } from 'react'
import { Calendar, FileText, ImagePlus, Trash2, User, X } from 'lucide-react'
import type { Developer, Priority } from '../types'

interface TaskDialogProps {
  onClose: () => void
  developers: Developer[]
  onCreate: (task: {
    title: string
    description: string
    category: string
    priority: Priority
    due: string
    due_date?: string
    assignee_id?: number
    attachmentFiles?: File[]
  }) => void
}

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.pdf']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function TaskDialog({ onClose, onCreate, developers }: TaskDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Frontend')
  const [priority, setPriority] = useState<Priority>('O‘rta')
  const [dueType, setDueType] = useState('Bugun')
  const [customDate, setCustomDate] = useState('')
  const [assigneeId, setAssigneeId] = useState<number | undefined>(developers[0]?.id)
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFilesChange(newFiles: FileList | null) {
    if (!newFiles || newFiles.length === 0) return
    setFileError(null)

    const validFiles: File[] = []
    const errors: string[] = []

    Array.from(newFiles).forEach((file) => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        errors.push(`"${file.name}": Faqat PNG, JPG, WEBP yoki PDF formatlari ruxsat etilgan.`)
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`"${file.name}": Fayl hajmi 10 MB dan oshmasligi kerak.`)
        return
      }
      // Duplikat bo'lmasligi uchun
      const isAlreadyAdded = attachmentFiles.some(
        (f) => f.name === file.name && f.size === file.size
      )
      if (!isAlreadyAdded) {
        validFiles.push(file)
      }
    })

    if (errors.length > 0) {
      setFileError(errors[0])
    }

    if (validFiles.length > 0) {
      setAttachmentFiles((prev) => [...prev, ...validFiles])
    }

    // Input qiymatini tozalab qo'yamiz (bir xil faylni qayta tanlay olish uchun)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function removeFile(index: number) {
    setAttachmentFiles((prev) => prev.filter((_, i) => i !== index))
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) return

    let calculatedDue = dueType
    let calculatedDate: string | undefined = undefined

    if (dueType === 'Custom' && customDate) {
      calculatedDue = customDate
      calculatedDate = customDate
    } else if (dueType === 'Bugun') {
      calculatedDate = new Date().toISOString().slice(0, 10)
    } else if (dueType === 'Ertaga') {
      calculatedDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    }

    onCreate({
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      due: calculatedDue,
      due_date: calculatedDate,
      assignee_id: assigneeId,
      attachmentFiles: attachmentFiles.length > 0 ? attachmentFiles : undefined,
    })
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section className="task-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <div className="dialog-header">
          <div>
            <span className="eyebrow">YANGI TOPSHIRIQ</span>
            <h2 id="dialog-title">Vazifa yaratish</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Yopish">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit}>
          <label className="form-label">
            Vazifa nomi
            <input
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Masalan: To‘lov tizimi API integratsiyasi"
              required
              maxLength={180}
            />
          </label>

          <label className="form-label">
            Batafsil tavsif
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Vazifa talablari, bajarish bosqichlari va qabul mezonlari..."
              rows={4}
              maxLength={4000}
            />
          </label>

          <div className="form-row">
            <label className="form-label">
              Yo‘nalish
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                {['Frontend', 'Backend', 'Dizayn', 'Tahlil', 'Boshqa'].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="form-label">
              Muhimlik darajasi
              <select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>
                {['Yuqori', 'O‘rta', 'Past'].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row">
            <label className="form-label">
              Muddati
              <div style={{ display: 'flex', gap: '6px' }}>
                <select
                  value={dueType}
                  onChange={(event) => setDueType(event.target.value)}
                  style={{ flex: dueType === 'Custom' ? '0 0 100px' : '1' }}
                >
                  <option value="Bugun">Bugun</option>
                  <option value="Ertaga">Ertaga</option>
                  <option value="Custom">Sana tanlash</option>
                </select>
                {dueType === 'Custom' && (
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    required
                    style={{ flex: '1' }}
                  />
                )}
              </div>
            </label>

            <label className="form-label">
              Mas’ul dasturchi
              <select
                value={assigneeId ?? ''}
                onChange={(event) => setAssigneeId(Number(event.target.value) || undefined)}
                required
              >
                {developers.length > 0 ? (
                  developers.map((developer) => (
                    <option key={developer.id} value={developer.id}>
                      {developer.name} (@{developer.username})
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    Faol dasturchi mavjud emas
                  </option>
                )}
              </select>
            </label>
          </div>

          {/* Fayllar yuklash zonasi */}
          <div className="form-label" style={{ marginBottom: '8px' }}>
            Biriktirilgan fayllar ({attachmentFiles.length})
          </div>

          {attachmentFiles.length > 0 && (
            <div className="dialog-attached-files">
              {attachmentFiles.map((file, idx) => (
                <div key={`${file.name}-${idx}`} className="dialog-attached-file">
                  <div className="dialog-attached-file-info">
                    <FileText size={15} className="file-icon" />
                    <span className="file-name" title={file.name}>{file.name}</span>
                    <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                  <button
                    type="button"
                    className="file-remove-btn"
                    onClick={() => removeFile(idx)}
                    title="Faylni o‘chirish"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="attachment-drop">
            <ImagePlus size={19} />
            <span>
              <strong>
                {attachmentFiles.length > 0
                  ? '+ Yana fayl qo‘shish'
                  : 'Fayl yoki rasmlar biriktirish (bir nechta tanlash mumkin)'}
              </strong>
              <small>PNG, JPG, WEBP yoki PDF · Har biri 10 MB gacha</small>
            </span>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,application/pdf"
              aria-label="Fayllar biriktirish"
              onChange={(event) => handleFilesChange(event.target.files)}
            />
          </label>

          {fileError && (
            <div className="login-error animate-fade-in" style={{ margin: '-12px 0 16px', fontSize: '12px' }}>
              {fileError}
            </div>
          )}

          <div className="dialog-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Bekor qilish
            </button>
            <button type="submit" className="primary-button">
              Vazifani yaratish <span>→</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
