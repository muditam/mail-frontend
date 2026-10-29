// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest'
import {cleanup,render,screen,waitFor,within} from '@testing-library/react'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
import {MemoryRouter} from 'react-router-dom'
import App from './App'
import {api} from './api'

afterEach(()=>{cleanup();vi.restoreAllMocks()})
it('renders the approved sequence in the shared desktop/mobile sidebar across accounts',async()=>{
 vi.spyOn(api,'session').mockResolvedValue({user:{email:'test@example.test'},csrfToken:'csrf'})
 vi.spyOn(api,'messages').mockResolvedValue({messages:[]})
 const boxes=vi.spyOn(api,'mailboxes')
 for(const roles of [['drafts','junk','trash','inbox','sent'],['sent','inbox','junk','drafts','trash']]){
  boxes.mockResolvedValue(roles.map((role,i)=>({id:role,name:role,role,totalCount:i,unreadCount:0})))
  const client=new QueryClient({defaultOptions:{queries:{retry:false}}})
  const view=render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/mail/inbox']}><App/></MemoryRouter></QueryClientProvider>)
  const sidebar=await screen.findByLabelText('Mailbox navigation')
  await waitFor(()=>expect(within(sidebar).getByRole('button',{name:'Inbox'})).toBeTruthy())
  expect(Array.from(sidebar.querySelectorAll('.folders button')).map(b=>b.textContent)).toEqual(['Inbox','Starred','Sent','Drafts','Junk','Trash'])
  view.unmount();client.clear()
 }
})
