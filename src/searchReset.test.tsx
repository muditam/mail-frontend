// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest'
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
import {MemoryRouter,useLocation} from 'react-router-dom'
import App from './App'
import {MailSearch} from './MailSearch'
import {api} from './api'
import {ApiError} from './types'

afterEach(()=>{cleanup();vi.restoreAllMocks()})
function Location(){const location=useLocation();return <output data-testid="location">{location.pathname+location.search}</output>}
for(const control of ['Clear search text','Clear search'])it(`${control} clears no-match search, URL and result state back to Sent`,async()=>{
 vi.spyOn(api,'session').mockResolvedValue({user:{email:'user@example.test'},csrfToken:'csrf'})
 vi.spyOn(api,'mailboxes').mockResolvedValue(['inbox','sent'].map(role=>({id:role,name:role,role,totalCount:0,unreadCount:0})))
 const messages=vi.spyOn(api,'messages').mockResolvedValue({messages:[]})
 const client=new QueryClient({defaultOptions:{queries:{retry:false}}})
 render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/mail/sent?q=QA-NO-MATCH-9X7Z']}><App/><Location/></MemoryRouter></QueryClientProvider>)
 await screen.findByText('No matching messages')
 fireEvent.click(screen.getByRole('button',{name:control}))
 await screen.findByText('No messages in Sent')
 expect(screen.getByRole('searchbox')).toHaveProperty('value','')
 expect(screen.getByTestId('location').textContent).toBe('/mail/sent')
 expect(screen.queryByText('No matching messages')).toBeNull()
 expect(screen.queryByText(/Results for/)).toBeNull()
 await waitFor(()=>expect(messages).toHaveBeenLastCalledWith('sent',undefined,undefined,expect.any(AbortSignal),false))
 cleanup();client.clear()
})
it('keeps typing separate from applied search and supports clearing unsubmitted text',()=>{
 const search=vi.fn(),clear=vi.fn()
 render(<MailSearch query="old" busy={false} onSearch={search} onClear={clear}/>)
 const input=screen.getByRole('searchbox')
 fireEvent.change(input,{target:{value:'new text'}})
 expect(search).not.toHaveBeenCalled();expect(clear).not.toHaveBeenCalled()
 fireEvent.click(screen.getByRole('button',{name:'Search'}))
 expect(search).toHaveBeenCalledWith('new text')
 fireEvent.click(screen.getByRole('button',{name:'Clear search text'}))
 expect(clear).toHaveBeenCalledTimes(1);expect(input).toHaveProperty('value','');expect(document.activeElement).toBe(input)
})

it('shows failed search as unavailable rather than zero matches',async()=>{
 vi.spyOn(api,'session').mockResolvedValue({user:{email:'user@example.test'},csrfToken:'csrf'})
 vi.spyOn(api,'mailboxes').mockResolvedValue([{id:'inbox',name:'Inbox',role:'inbox',totalCount:10,unreadCount:0}])
 vi.spyOn(api,'messages').mockRejectedValue(new ApiError('INVALID_REQUEST','Invalid request.',400))
 const client=new QueryClient({defaultOptions:{queries:{retry:false}}})
 render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/mail/inbox?q=Hi']}><App/></MemoryRouter></QueryClientProvider>)
 await screen.findByText('Invalid request.')
 expect(screen.getByText('Search unavailable')).toBeTruthy()
 expect(screen.queryByText('0 results')).toBeNull()
 expect(screen.queryByText('No matching messages')).toBeNull()
 expect(screen.getByRole('heading',{name:'Search results—'})).toBeTruthy()
 cleanup();client.clear()
})
