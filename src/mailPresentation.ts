import type {Mailbox} from './types'

export function formatFileSize(bytes: number): string {
 if (!Number.isFinite(bytes) || bytes < 0) return 'Size unknown'
 if (bytes < 1024) return `${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`
 if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
 return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const roles = ['inbox', 'sent', 'drafts', 'junk', 'trash']
export function orderMailboxes(boxes: Mailbox[]): Mailbox[] {
 const rank = (box: Mailbox) => {const index=roles.indexOf(box.role || '');return index < 0 ? roles.length : index}
 return [...boxes].sort((a,b)=>rank(a)-rank(b)||a.name.localeCompare(b.name,'en')||a.id.localeCompare(b.id,'en'))
}
