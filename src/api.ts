import { ApiError, type Attachment, type DraftPayload, type Mailbox, type Message, type MessagePage, type Session } from './types'
import { mockApi } from './mockApi'

const configuredBase = import.meta.env.VITE_API_BASE_URL
if (!configuredBase || !configuredBase.startsWith('/') || configuredBase.startsWith('//')) throw new Error('VITE_API_BASE_URL must be a same-origin path')
const base = configuredBase.replace(/\/$/, '')
const mock = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_API === 'true'
let csrfToken = ''
let onExpired: (() => void) | undefined
export const setCsrfToken = (token: string) => { csrfToken = token }
export const onSessionExpired = (handler: () => void) => { onExpired = handler }

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = init.method || 'GET'
  const headers = new Headers(init.headers)
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  if (!['GET', 'HEAD'].includes(method.toUpperCase()) && csrfToken) headers.set('X-CSRF-Token', csrfToken)
  let response: Response
  try { response = await fetch(`${base}${path}`, { ...init, headers, credentials: 'include' }) }
  catch { throw new ApiError('UPSTREAM_UNAVAILABLE', 'Cannot reach the mail service. Check your connection and try again.') }
  if (!response.ok) {
    const envelope = await response.json().catch(() => null)
    const error = envelope?.error
    if (response.status === 401 && path !== '/auth/session' && path !== '/auth/login') onExpired?.()
    throw new ApiError(error?.code || (response.status === 401 ? 'SESSION_EXPIRED' : 'UPSTREAM_UNAVAILABLE'), error?.message || 'Something went wrong. Please try again.', response.status)
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>
}

const liveApi = {
  session: () => request<Session>('/auth/session'),
  login: (email: string, password: string) => request<Session>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  mailboxes: async () => (await request<{mailboxes: Mailbox[]}>('/mailboxes')).mailboxes,
  messages: (mailboxId: string, cursor?: string) => request<MessagePage>(`/messages?${new URLSearchParams({ mailboxId, limit: '30', ...(cursor ? { cursor } : {}) })}`),
  message: async (id: string) => (await request<{message: Message}>(`/messages/${encodeURIComponent(id)}`)).message,
  read: async (id: string, isRead: boolean) => (await request<{message: {id: string; isRead: boolean}}>(`/messages/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ isRead }) })).message,
  upload: async (file: File, onProgress?: (percent: number) => void): Promise<Attachment> => {
    const data = new FormData(); data.append('file', file)
    // XMLHttpRequest exposes upload progress and still sends the session cookie.
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest(); xhr.open('POST', `${base}/attachments`); xhr.withCredentials = true
      if (csrfToken) xhr.setRequestHeader('X-CSRF-Token', csrfToken)
      xhr.upload.onprogress = event => { if (event.lengthComputable) onProgress?.(Math.round(event.loaded / event.total * 100)) }
      xhr.onload = () => { try { const json = JSON.parse(xhr.responseText); if (xhr.status >= 200 && xhr.status < 300) resolve(json.attachment); else { if (xhr.status === 401) onExpired?.(); reject(new ApiError(json?.error?.code || 'UPSTREAM_UNAVAILABLE', json?.error?.message || 'Upload failed.', xhr.status)) } } catch { reject(new ApiError('UPSTREAM_UNAVAILABLE', 'Upload failed.')) } }
      xhr.onerror = () => reject(new ApiError('UPSTREAM_UNAVAILABLE', 'Upload failed. Check your connection.'))
      xhr.send(data)
    })
  },
  download: async (attachment: Attachment) => {
    const response = await fetch(`${base}/attachments/${encodeURIComponent(attachment.id)}`, { credentials: 'include' })
    if (!response.ok) throw new ApiError('ATTACHMENT_NOT_FOUND', 'Could not download this attachment.', response.status)
    const blob = await response.blob(); const url = URL.createObjectURL(blob)
    const link = document.createElement('a'); link.href = url; link.download = attachment.name; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  },
  report: (id: string) => request<{status: 'queued'; submissionId: string}>(`/messages/${encodeURIComponent(id)}/report`, { method: 'POST', body: '{}' }),
  saveDraft: (payload: DraftPayload) => request<{draftId: string}>('/drafts', { method: 'POST', body: JSON.stringify(payload) }),
  deleteDraft: (id: string) => request<void>(`/drafts/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  send: (payload: DraftPayload) => request<{submissionId: string; status: 'queued'}>('/messages/send', { method: 'POST', body: JSON.stringify(payload) }),
}
export const api = mock ? mockApi : liveApi
