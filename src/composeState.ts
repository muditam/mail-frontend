import type { Message } from './types'

export const draftSeedFromMessage = (message: Message) => ({
  draftId: message.id,
  to: message.to.map(address => address.email).join(', '),
  cc: message.cc?.map(address => address.email).join(', ') || '',
  bcc: message.bcc?.map(address => address.email).join(', ') || '',
  subject: message.subject,
  bodyText: message.bodyText,
  attachments: message.attachments,
})

export const queuedSendNotice = 'Message queued for sending.'

export function createAttachmentQueue(limit = 10) {
  let nextId = 0
  const pending = new Map<number, string>()
  return {
    reserve(files: File[], attachedCount: number) {
      if (attachedCount + pending.size + files.length > limit) return null
      return files.map(file => {
        const id = ++nextId
        pending.set(id, file.name)
        return { id, file }
      })
    },
    finish(id: number) { pending.delete(id) },
    get pendingCount() { return pending.size },
  }
}

export type UploadProgress = Record<number, { name: string; percent: number }>
