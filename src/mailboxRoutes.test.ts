import { describe, expect, it } from 'vitest'
import { mailboxPath, resolveMailbox } from './mailboxRoutes'
import type { Mailbox } from './types'

const box = (id: string, role?: string): Mailbox => ({ id, name: role || 'Projects', role, unreadCount: 0, totalCount: 0 })

describe('mailbox routes', () => {
  it('uses the same readable URL for standard folders with different account IDs', () => {
    const first = [box('a', 'inbox'), box('b', 'trash'), box('c', 'sent'), box('d', 'drafts'), box('e', 'junk')]
    const second = [box('x8', 'inbox'), box('t2', 'trash'), box('s9', 'sent'), box('d4', 'drafts'), box('j3', 'junk')]
    for (const role of ['inbox', 'trash', 'sent', 'drafts', 'junk']) {
      expect(mailboxPath(resolveMailbox(first, role)!)).toBe(`/mail/${role}`)
      expect(mailboxPath(resolveMailbox(second, role)!)).toBe(`/mail/${role}`)
    }
    expect(resolveMailbox(first, 'inbox')?.id).toBe('a')
    expect(resolveMailbox(second, 'inbox')?.id).toBe('x8')
  })

  it('resolves old ID links and keeps custom folders unambiguous', () => {
    const boxes = [box('a', 'inbox'), box('inbox'), box('folder 1')]
    expect(mailboxPath(resolveMailbox(boxes, 'a')!)).toBe('/mail/inbox')
    expect(resolveMailbox(boxes, 'inbox')?.id).toBe('a')
    expect(mailboxPath(boxes[1]!)).toBe('/mail/~inbox')
    expect(resolveMailbox(boxes, '~inbox')?.id).toBe('inbox')
    expect(mailboxPath(boxes[2]!)).toBe('/mail/~folder%201')
  })
})
