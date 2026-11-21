export type Status = 'new' | 'progress' | 'review' | 'done'
export type Priority = 'Yuqori' | 'O‘rta' | 'Past'

export interface AttachmentItem {
  id: number
  original_name: string
  size: number
  created_at: string
  url: string
  uploaded_by_name?: string
}

export interface ActivityItem {
  id: number
  actor_name: string
  action: string
  from_status?: string
  to_status?: string
  note?: string
  created_at: string
}

export interface TaskItem {
  id: number
  title: string
  description: string
  category: string
  category_code?: string
  priority: Priority
  priority_code?: string
  status: Status
  status_display?: string
  assignee: string
  assignee_id?: number
  assignee_username?: string
  creator?: string
  creator_id?: number
  initials: string
  color: string
  due: string
  due_date?: string
  updates: number
  attachment?: string
  attachments?: AttachmentItem[]
  activities?: ActivityItem[]
  created_at?: string
  updated_at?: string
}

export interface Developer {
  id: number
  name: string
  username: string
  initials: string
  color: string
  active: boolean
  completed: number
  in_progress?: number
  total_tasks?: number
  date_joined?: string
}

export interface CurrentUser {
  id: number
  name: string
  username: string
  is_superuser: boolean
  initials?: string
  role_display?: string
  must_change_password?: boolean
}
