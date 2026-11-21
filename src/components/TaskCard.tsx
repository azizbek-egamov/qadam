import { useRef, useState } from 'react'
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  Check,
  GripVertical,
  Paperclip
} from 'lucide-react'
import type { Status, TaskItem } from '../types'

const statusMeta: Record<Status, { label: string; next?: Status }> = {
  new: { label: 'Yangi', next: 'progress' },
  progress: { label: 'Jarayonda', next: 'review' },
  review: { label: 'Tekshiruvda', next: 'done' },
  done: { label: 'Bajarildi' },
}

const priorityClass: Record<string, string> = {
  Yuqori: 'priority-high',
  'O‘rta': 'priority-medium',
  Past: 'priority-low',
}

const uzbekMonths = ['yan', 'fev', 'mar', 'apr', 'may', 'iyun', 'iyul', 'avg', 'sen', 'okt', 'noy', 'dek']

interface TaskCardProps {
  task: TaskItem
  onSelect: (task: TaskItem) => void
  onAdvance?: (id: number, status: Status) => void
  draggable?: boolean
  index?: number
}

export function TaskCard({ task, onSelect, onAdvance, draggable = true, index = 0 }: TaskCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const dragOccurredRef = useRef(false)
  const status = statusMeta[task.status] || { label: task.status }
  const dueDateMatch = (task.due_date || task.due || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const dueLabel = dueDateMatch
    ? `${Number(dueDateMatch[3])}-${uzbekMonths[Number(dueDateMatch[2]) - 1]}`
    : task.due || 'Belgilanmagan'

  const firstAttachment = task.attachments?.[0]
  const attachmentName = firstAttachment?.original_name || task.attachment

  function handleDragStart(e: React.DragEvent) {
    if (!draggable) return
    dragOccurredRef.current = true
    setIsDragging(true)
    e.dataTransfer.setData('application/json', JSON.stringify({ id: task.id, currentStatus: task.status }))
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: task.id, currentStatus: task.status }))
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragEnd() {
    setIsDragging(false)
    // Keep flag true for 120ms so accidental onClick is ignored after drop
    setTimeout(() => {
      dragOccurredRef.current = false
    }, 120)
  }

  function handleClick() {
    if (dragOccurredRef.current) return
    onSelect(task)
  }

  return (
    <article
      className={`task-card animate-card-enter ${isDragging ? 'task-card-dragging' : ''}`}
      style={{ animationDelay: `${Math.min(index * 0.05, 0.4)}s` }}
      onClick={handleClick}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(task)
        }
      }}
    >
      <div className="task-card-top">
        <span className="task-category">
          <span
            className={`category-dot ${
              task.category === 'Dizayn'
                ? 'dot-violet'
                : task.category === 'Backend'
                ? 'dot-blue'
                : task.category === 'Tahlil'
                ? 'dot-amber'
                : 'dot-mint'
            }`}
          />
          {task.category}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <span className="card-drag-grip" title="Boshqa ustunga tortib o‘tish">
            <GripVertical size={14} />
          </span>
          <button
            className="task-menu"
            aria-label={`${task.title} uchun amallar`}
            onClick={(e) => {
              e.stopPropagation()
              onSelect(task)
            }}
            title="Tafsilotlar"
          >
            <span>···</span>
          </button>
        </div>
      </div>

      <h3>{task.title}</h3>
      <p className="task-description">{task.description || 'Tavsif kiritilmagan'}</p>

      {/* Attachment Preview if exists */}
      {attachmentName && (
        <div
          className="attachment-preview"
          onClick={(e) => {
            if (firstAttachment?.url) {
              e.stopPropagation()
              window.open(firstAttachment.url, '_blank')
            }
          }}
          title="Faylni ko‘rish"
        >
          <div className="attachment-thumbnail">
            <div className="thumbnail-top" />
            <div className="thumbnail-lines">
              <i />
              <i />
              <i />
            </div>
            <div className="thumbnail-button" />
          </div>
          <div className="attachment-meta">
            <span className="attachment-name">{attachmentName}</span>
            <span>
              {firstAttachment?.size ? `${(firstAttachment.size / 1024).toFixed(0)} KB` : 'Fayl biriktirilgan'}
            </span>
          </div>
          <Paperclip size={14} className="attachment-clip" />
        </div>
      )}

      <div className="task-tags">
        <span className={`priority ${priorityClass[task.priority] || 'priority-medium'}`}>
          <span />
          {task.priority}
        </span>
        <span className={`status-pill status-${task.status}`}>
          <span />
          {status.label}
        </span>
      </div>

      <div className="task-card-footer">
        <div className="task-person">
          <div className="avatar avatar-small" style={{ backgroundColor: task.color }}>
            {task.initials}
          </div>
          <span>{task.assignee}</span>
        </div>
        <div className="task-meta">
          <span>
            <CalendarDays size={13} />
            {dueLabel}
          </span>
          <span aria-label={`${task.updates} ta yangilanish`}>
            <Activity size={13} />
            {task.updates || task.activities?.length || 0}
          </span>
        </div>
      </div>

      {status.next && onAdvance && (
        <button
          className="task-advance"
          onClick={(e) => {
            e.stopPropagation()
            onAdvance(task.id, status.next!)
          }}
          aria-label={`Vazifani ${statusMeta[status.next]?.label || status.next} holatiga o‘tkazish`}
          title={`Bosqich: ${statusMeta[status.next]?.label || status.next}`}
        >
          <ArrowUpRight size={14} />
        </button>
      )}

      {task.status === 'done' && (
        <div className="done-mark" title="Bajarilgan">
          <Check size={14} />
        </div>
      )}
    </article>
  )
}
