import { Bell, Check, Clock, FileText, X } from 'lucide-react'
import type { TaskItem } from '../types'

interface NotificationMenuProps {
  tasks: TaskItem[]
  onSelectTask: (task: TaskItem) => void
  onClose: () => void
}

export function NotificationMenu({ tasks, onSelectTask, onClose }: NotificationMenuProps) {
  // Aggregate recent activities from all tasks
  const notifications = tasks
    .flatMap((task) =>
      (task.activities || []).map((act) => ({
        id: `${task.id}-${act.id}`,
        taskId: task.id,
        taskTitle: task.title,
        actor: act.actor_name,
        action: act.action,
        fromStatus: act.from_status,
        toStatus: act.to_status,
        note: act.note,
        time: act.created_at,
        task,
      }))
    )
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 8)

  return (
    <div className="notification-dropdown">
      <div className="notif-header">
        <div className="notif-title">
          <Bell size={15} />
          <strong>Bildirishnomalar</strong>
        </div>
        <button className="icon-btn notif-close" onClick={onClose}>
          <X size={14} />
        </button>
      </div>

      <div className="notif-list">
        {notifications.length > 0 ? (
          notifications.map((item) => (
            <div
              key={item.id}
              className="notif-item"
              onClick={() => {
                onSelectTask(item.task)
                onClose()
              }}
            >
              <div className="notif-icon">
                {item.action === 'created' ? (
                  <FileText size={14} />
                ) : item.toStatus === 'done' ? (
                  <Check size={14} />
                ) : (
                  <Clock size={14} />
                )}
              </div>
              <div className="notif-content">
                <div className="notif-text">
                  <strong>{item.actor}</strong>{' '}
                  {item.action === 'created'
                    ? 'yangi vazifa yaratdi'
                    : item.action === 'status_changed'
                    ? `vazifa holatini o‘zgartirdi`
                    : 'sharh qoldirdi'}
                  : <span className="notif-task-name">{item.taskTitle}</span>
                </div>
                {item.note && <small className="notif-note">{item.note}</small>}
                <span className="notif-time">
                  {new Date(item.time).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="notif-empty">Hozircha yangi bildirishnomalar yo‘q.</div>
        )}
      </div>
    </div>
  )
}

