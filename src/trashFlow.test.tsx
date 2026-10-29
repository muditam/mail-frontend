// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest'
import {cleanup,fireEvent,render,screen,within} from '@testing-library/react'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
import {MemoryRouter} from 'react-router-dom'
import App from './App'
import {api} from './api'
import {ApiError,type Message} from './types'

afterEach(()=>{cleanup();vi.restoreAllMocks()})
for(const source of ['inbox','sent'])it(`moves ${source} mail only after success and restores it from a fresh Trash view`,async()=>{
 let membership=source
 const message=()=>({id:'E1',mailboxIds:[membership],from:[{email:'sender@example.test'}],to:[{email:'recipient@example.test'}],subject:'Keep this message',preview:'Content',bodyText:'Unchanged content',receivedAt:'2026-10-28T12:00:00Z',isRead:true,keywords:{'$seen':true},attachments:[],hasAttachment:false} as Message)
 vi.spyOn(api,'session').mockResolvedValue({user:{email:'user@example.test'},csrfToken:'csrf'})
 vi.spyOn(api,'mailboxes').mockImplementation(async()=>['inbox','sent','trash'].map(role=>({id:role,name:role,role,unreadCount:0,totalCount:membership===role?1:0})))
 vi.spyOn(api,'messages').mockImplementation(async box=>({messages:box===membership?[message()]:[]}))
 vi.spyOn(api,'message').mockImplementation(async()=>message())
 const move=vi.spyOn(api,'moveMessage').mockRejectedValueOnce(new ApiError('UPSTREAM_UNAVAILABLE','Move failed.',503)).mockImplementation(async(id,action)=>{membership=action==='trash'?'trash':'inbox';return {id,mailboxIds:[membership]}})
 const mount=(path:string)=>{
  const client=new QueryClient({defaultOptions:{queries:{retry:false}}})
  const view=render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><App/></MemoryRouter></QueryClientProvider>)
  return ()=>{view.unmount();client.clear()}
 }
 let unmount=mount(`/mail/${source}/E1`)
 fireEvent.click(await screen.findByRole('button',{name:'Move to Trash'}))
 await screen.findByText('Move failed.')
 expect(membership).toBe(source)
 expect(screen.getByText('Unchanged content')).toBeTruthy()
 fireEvent.click(screen.getByRole('button',{name:'Move to Trash'}))
 await screen.findByText('Message moved to Trash.')
 await screen.findByText(`No messages in ${source==='inbox'?'Inbox':'Sent'}`)
 expect(move).toHaveBeenLastCalledWith('E1','trash')
 const sidebar=screen.getByLabelText('Mailbox navigation')
 fireEvent.click(within(sidebar).getByRole('button',{name:'Trash'}))
 await screen.findByText('1 conversation')
 unmount()
 // Fresh component tree and query cache must retrieve the persisted membership.
 unmount=mount('/mail/trash/E1')
 fireEvent.click(await screen.findByRole('button',{name:'Restore to Inbox'}))
 await screen.findByText('Message restored to Inbox.')
 expect(move).toHaveBeenLastCalledWith('E1','restore');expect(membership).toBe('inbox')
 unmount()
})
