// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest'
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
import {Composer} from './App'
import {api} from './api'
import {ApiError} from './types'

afterEach(()=>{cleanup();vi.restoreAllMocks()})
function setup(){
 const done=vi.fn(),close=vi.fn()
 render(<QueryClientProvider client={new QueryClient()}><Composer initial={{draftId:'D1',to:'to@example.test',bcc:'hidden@example.test',subject:'Smoke',bodyText:'Keep this body',attachments:[{id:'A1',name:'notes.txt',type:'text/plain',size:123}]}} onDone={done} onClose={close}/></QueryClientProvider>)
 return {done,close}
}
for(const [code,message] of [
 ['SEND_REJECTED','Message not sent: the mail server rate limit was reached. Your message remains in Drafts. Try again later.'],
 ['SEND_PARTIAL_FAILURE','The message was not sent to all recipients. A copy is in Sent. Do not resend to everyone; some recipients may already have received it.'],
 ['SEND_STATUS_UNKNOWN','Could not confirm send.'],
])it(`${code} keeps composer content and never fires success`,async()=>{
 const send=vi.spyOn(api,'send').mockRejectedValue(new ApiError(code,message,422,code==='SEND_REJECTED'?{draftId:'D2'}:undefined))
 const {done,close}=setup();fireEvent.click(screen.getByRole('button',{name:'Send'}))
 await waitFor(()=>expect(send).toHaveBeenCalledTimes(1))
 await waitFor(()=>expect(screen.getByRole('status').textContent).toContain(code==='SEND_STATUS_UNKNOWN'?'Check Sent and Drafts':message))
 expect(done).not.toHaveBeenCalled();expect(close).not.toHaveBeenCalled();expect(screen.queryByText('Message sent.')).toBeNull()
 expect((screen.getByLabelText('Message body') as HTMLTextAreaElement).value).toBe('Keep this body')
 expect((screen.getByLabelText('Bcc') as HTMLInputElement).value).toBe('hidden@example.test')
 expect(screen.getByText('notes.txt')).toBeTruthy()
 if(code==='SEND_REJECTED'){fireEvent.click(screen.getByRole('button',{name:'Send'}));await waitFor(()=>expect(send).toHaveBeenCalledTimes(2));expect(send.mock.calls[1][0].draftId).toBe('D2')}
})
it('accepted send fires success only after the request resolves',async()=>{
 let resolve!:(v:{submissionId:string;status:'queued'})=>void
 vi.spyOn(api,'send').mockImplementation(()=>new Promise(r=>{resolve=r}))
 const {done}=setup();fireEvent.click(screen.getByRole('button',{name:'Send'}))
 await waitFor(()=>expect(api.send).toHaveBeenCalledTimes(1));expect(done).not.toHaveBeenCalled()
 resolve({submissionId:'S1',status:'queued'})
 await waitFor(()=>expect(done).toHaveBeenCalledWith('Message sent.'))
})
it('automatic retry acceptance closes composer with delayed notice, not Message sent',async()=>{
 vi.spyOn(api,'send').mockResolvedValue({submissionId:'S1',status:'retrying',messageId:'D2',failedRecipients:0})
 const {done}=setup();fireEvent.click(screen.getByRole('button',{name:'Send'}))
 await waitFor(()=>expect(done).toHaveBeenCalledWith('Delivery delayed. Retrying automatically; do not resend.'))
 expect(done).not.toHaveBeenCalledWith('Message sent.')
})
