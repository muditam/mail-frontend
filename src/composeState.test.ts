import { describe, expect, it } from 'vitest'
import { createAttachmentQueue, draftSeedFromMessage, sendSuccessNotice } from './composeState'
import type { Message } from './types'

describe('composer regressions', () => {
  it('restores Bcc recipients when reopening a draft', () => {
    const draft = { id: 'd1', to: [{ email: 'to@example.com' }], cc: [], bcc: [{ email: 'hidden@example.com' }], subject: 'Hi', bodyText: 'Hello', attachments: [] } as unknown as Message
    expect(draftSeedFromMessage(draft).bcc).toBe('hidden@example.com')
  })

  it('shows the requested success confirmation after submission', () => {
    expect(sendSuccessNotice).toBe('Message sent.')
  })

  it('counts pending uploads across overlapping selections and allows a retry after failure', () => {
    const queue = createAttachmentQueue()
    const files = Array.from({ length: 9 }, (_, index) => new File(['x'], `file-${index}.txt`))
    expect(queue.reserve(files, 0)).toHaveLength(9)
    expect(queue.reserve([new File(['x'], 'tenth.txt')], 0)).toHaveLength(1)
    expect(queue.reserve([new File(['x'], 'eleventh.txt')], 0)).toBeNull()
    queue.finish(10)
    expect(queue.reserve([new File(['x'], 'retry.txt')], 0)).toHaveLength(1)
  })

  it('uses separate upload IDs for files with the same name', () => {
    const queue = createAttachmentQueue()
    const selected = queue.reserve([new File(['a'], 'same.txt'), new File(['b'], 'same.txt')], 0)!
    expect(selected[0].id).not.toBe(selected[1].id)
    queue.finish(selected[0].id)
    expect(queue.pendingCount).toBe(1)
  })
})
