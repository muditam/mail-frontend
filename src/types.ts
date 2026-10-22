export type Address = { email: string; name?: string }
export type User = { email: string; displayName?: string }
export type Session = { user: User; csrfToken: string }
export type Mailbox = { id: string; name: string; role?: string; unreadCount: number; totalCount: number }
export type Attachment = { id: string; name: string; type: string; size: number }
export type MessageSummary = { id: string; mailboxIds: string[]; from: Address[]; to?: Address[]; subject: string; preview: string; receivedAt: string; isRead: boolean; hasAttachment: boolean; keywords?: Record<string, boolean> }
export type Message = MessageSummary & { to: Address[]; cc?: Address[]; bcc?: Address[]; bodyText: string; bodyHtml?: string; attachments: Attachment[] }
export type MessagePage = { messages: MessageSummary[]; nextCursor?: string }
export type DraftPayload = { draftId?: string; to: string[]; cc?: string[]; bcc?: string[]; subject: string; bodyText: string; attachmentIds: string[] }
export type ApiErrorCode = 'INVALID_CREDENTIALS'|'MFA_REQUIRED'|'SESSION_EXPIRED'|'CSRF_FAILED'|'MAILBOX_NOT_FOUND'|'MESSAGE_NOT_FOUND'|'DRAFT_NOT_FOUND'|'ATTACHMENT_NOT_FOUND'|'ATTACHMENT_TOO_LARGE'|'INVALID_REQUEST'|'SEND_REJECTED'|'SEND_STATUS_UNKNOWN'|'RATE_LIMITED'|'UPSTREAM_UNAVAILABLE'
export class ApiError extends Error { constructor(public code: ApiErrorCode|string, message: string, public status = 0) { super(message); this.name = 'ApiError' } }
