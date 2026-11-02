// @vitest-environment jsdom
import {afterEach,expect,it} from 'vitest'
import {cleanup,render,screen} from '@testing-library/react'
import {DeliveryRetryNotice} from './DeliveryRetryNotice'
import type {DeliveryRetry} from './types'
afterEach(cleanup)
const base={attempts:1,pending:1,failed:0,accepted:1}
it('shows pending retry time without claiming the message was sent',()=>{
 render(<DeliveryRetryNotice retry={{...base,state:'waiting',nextAttemptAt:'2026-11-02T10:30:00Z'}}/>);
 expect(screen.getByRole('status').textContent).toContain('Retrying automatically after');expect(screen.getByRole('status').textContent).toContain('Do not resend');expect(screen.queryByText('Message sent.')).toBeNull()
})
it.each(['failed','attention'] as DeliveryRetry['state'][])('shows persistent %s outcome without prompting a duplicate send',state=>{
 render(<DeliveryRetryNotice retry={{...base,state,failed:1}}/>);expect(screen.getByRole('status').textContent).toMatch(/resend/)
})
it('labels completion as provider acceptance, not final recipient delivery',()=>{
 render(<DeliveryRetryNotice retry={{...base,state:'completed',pending:0}}/>);expect(screen.getByRole('status').textContent).toContain('mail server accepted')
})
