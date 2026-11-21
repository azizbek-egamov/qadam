import type { CurrentUser, Developer, TaskItem } from '../types'

const API = '/api'
let csrfToken = ''

export async function refreshCsrf(): Promise<boolean> {
  try {
    const response = await fetch(`${API}/csrf/`, { credentials: 'include' })
    const data = await response.json()
    csrfToken = data.csrfToken || ''
    return true
  } catch {
    return false
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!csrfToken && options.method && options.method !== 'GET') {
    await refreshCsrf()
  }
  const response = await fetch(`${API}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.method && options.method !== 'GET' ? { 'X-CSRFToken': csrfToken } : {}),
      ...options.headers,
    },
  })
  const data = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.detail || data?.error || 'So‘rovni bajarib bo‘lmadi')
  }
  return data as T
}

export const api = {
  me: () => request<{ authenticated: boolean; user?: CurrentUser }>('/me/'),

  login: async (username: string, password: string) => {
    const result = await request<{ user: CurrentUser; csrfToken: string }>('/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    csrfToken = result.csrfToken
    return result
  },

  changePassword: async (current_password: string, new_password: string) => {
    const result = await request<{ success: boolean; csrfToken: string }>('/password/', {
      method: 'POST',
      body: JSON.stringify({ current_password, new_password }),
    })
    csrfToken = result.csrfToken
    return result
  },

  refreshSession: () => request<{ authenticated: boolean; user?: CurrentUser }>('/me/'),

  logout: () => request<void>('/logout/', { method: 'POST' }),

  tasks: (params?: { scope?: string; assignee_id?: string | number; status?: string }) => {
    const query = new URLSearchParams()
    if (params?.scope) query.set('scope', params.scope)
    if (params?.assignee_id) query.set('assignee_id', String(params.assignee_id))
    if (params?.status) query.set('status', params.status)
    const qs = query.toString() ? `?${query.toString()}` : ''
    return request<TaskItem[]>(`/tasks/${qs}`)
  },

  taskDetail: (id: number) => request<TaskItem>(`/tasks/${id}/`),

  createTask: (task: {
    title: string
    description?: string
    category?: string
    priority?: string
    status?: string
    due?: string
    due_date?: string
    assignee_id?: number
  }) => {
    return request<TaskItem>('/tasks/', {
      method: 'POST',
      body: JSON.stringify(task),
    })
  },

  updateTask: (id: number, data: Partial<TaskItem> & { assignee_id?: number }) => {
    return request<TaskItem>(`/tasks/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  deleteTask: (id: number) => {
    return request<void>(`/tasks/${id}/`, {
      method: 'DELETE',
    })
  },

  changeStatus: (id: number, status: string, note?: string) => {
    return request<TaskItem>(`/tasks/${id}/status/`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    })
  },

  addComment: (id: number, note: string) => {
    return request<any>(`/tasks/${id}/activity/`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    })
  },

  uploadAttachment: (taskId: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return request<{ id: number; name: string; url: string; size: number }>(`/tasks/${taskId}/attachments/`, {
      method: 'POST',
      body: form,
    })
  },

  developers: () => request<Developer[]>('/developers/'),

  createDeveloper: (payload: { name: string; username: string }) => {
    return request<{ developer: Developer; temporary_password: string }>('/developers/', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  toggleDeveloperActive: (id: number, active: boolean) => {
    return request<Developer>(`/developers/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    })
  },

  resetDeveloperPassword: (id: number) => {
    return request<{ temporary_password: string; developer: Developer }>(`/developers/${id}/reset-password/`, {
      method: 'POST',
    })
  },

  updateProfile: (payload: { name?: string; username?: string; new_password?: string; current_password?: string }) => {
    return request<{ user: CurrentUser; csrfToken: string }>('/me/', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  updateDeveloper: (id: number, payload: { name?: string; username?: string; password?: string; active?: boolean }) => {
    return request<Developer>(`/developers/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },
}
