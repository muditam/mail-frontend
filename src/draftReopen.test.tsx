// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest'
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
import {Composer} from './App'
import {draftSeedFromMessage} from './composeState'
import {api} from './api'
import type {Message} from './types'

afterEach(()=>{cleanup();vi.restoreAllMocks()})
it('opens BCC from fetched draft details and preserves all fields on resave and send',async()=>{
 const message={id:'D1',to:[{email:'to@example.test'}],cc:[{email:'cc@example.test'}],bcc:[{email:'hidden1@example.test'},{email:'hidden2@example.test'}],subject:'Saved subject',bodyText:'Saved body',attachments:[{id:'upload',name:'notes.txt',size:12,type:'text/plain'}]} as Message
 const save=vi.spyOn(api,'saveDraft').mockResolvedValue({draftId:'D2'})
 const send=vi.spyOn(api,'send').mockResolvedValue({submissionId:'S1',status:'queued'})
 const done=vi.fn(),client=new QueryClient()
 render(<QueryClientProvider client={client}><Composer initial={draftSeedFromMessage(JSON.parse(JSON.stringify(message)))} onClose={()=>{}} onDone={done}/></QueryClientProvider>)
 expect(screen.getByLabelText('Bcc')).toHaveProperty('value','hidden1@example.test, hidden2@example.test')
 expect(screen.getByLabelText('To')).toHaveProperty('value','to@example.test')
 expect(screen.getByLabelText('Cc')).toHaveProperty('value','cc@example.test')
 const payload={draftId:'D1',to:['to@example.test'],cc:['cc@example.test'],bcc:['hidden1@example.test','hidden2@example.test'],subject:'Saved subject',bodyText:'Saved body',attachmentIds:['upload']}
 fireEvent.click(screen.getByRole('button',{name:'Save draft'}))
 await screen.findByText('Draft saved to Drafts.')
 expect(save).toHaveBeenCalledWith(payload)
 fireEvent.click(screen.getByRole('button',{name:'Send'}))
 await waitFor(()=>expect(done).toHaveBeenCalledWith('Message sent.'))
 expect(send).toHaveBeenCalledWith({...payload,draftId:'D2'})
 client.clear()
})
