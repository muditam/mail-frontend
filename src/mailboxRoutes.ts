import type { Mailbox } from './types'

const standardRoles = new Set(['inbox', 'trash', 'sent', 'drafts', 'junk'])

export function mailboxPath(box: Mailbox): string {
  const segment = box.role && standardRoles.has(box.role) ? box.role : `~${encodeURIComponent(box.id)}`
  return `/mail/${segment}`
}

export function resolveMailbox(boxes: Mailbox[], segment?: string): Mailbox | undefined {
  if (!segment) return undefined
  if (standardRoles.has(segment)) {
    const byRole = boxes.find(box => box.role === segment)
    if (byRole) return byRole
  }
  if (segment.startsWith('~')) return boxes.find(box => box.id === segment.slice(1))
  // Existing links used the raw Stalwart mailbox ID.
  return boxes.find(box => box.id === segment)
}
