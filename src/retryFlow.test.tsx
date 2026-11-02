// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest'
import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
import {MemoryRouter} from 'react-router-dom'
import App from './App'
import {api} from './api'
import type {Message} from './types'
afterEach(()=>{cleanup();vi.restoreAllMocks()})
it('opens an automatically retried draft as read-only status after a fresh login',async()=>{
 const message:Message={id:'E1',mailboxIds:['drafts'],from:[{email:'sender@example.test'}],to:[{email:'recipient@example.test'}],subject:'Delayed email',preview:'Body',bodyText:'Body',receivedAt:'2026-11-02T12:00:00Z',isRead:true,keywords:{$draft:true},attachments:[],hasAttachment:false,deliveryRetry:{state:'waiting',attempts:0,pending:1,accepted:0,failed:0,nextAttemptAt:'2026-11-02T12:05:00Z'}}
 vi.spyOn(api,'session').mockResolvedValue({user:{email:'sender@example.test'},csrfToken:'csrf'})
 vi.spyOn(api,'mailboxes').mockResolvedValue([{id:'drafts',name:'Drafts',role:'drafts',unreadCount:0,totalCount:1}])
 vi.spyOn(api,'messages').mockResolvedValue({messages:[message]})
 vi.spyOn(api,'message').mockResolvedValue(message)
 const client=new QueryClient({defaultOptions:{queries:{retry:false}}})
 const view=render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/mail/drafts']}><App/></MemoryRouter></QueryClientProvider>)
 fireEvent.click(await screen.findByText('Delayed email'))
 expect((await screen.findByRole('status')).textContent).toContain('Retrying automatically')
 expect(screen.queryByRole('dialog',{name:/Compose|Edit draft/})).toBeNull()
 expect(screen.getByRole('button',{name:'Move to Trash'})).toHaveProperty('disabled',true)
 view.unmount();client.clear()
})
