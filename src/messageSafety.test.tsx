import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MessageSafetyControls } from './MessageSafetyControls'
import { downloadsAllowed, externalWarning } from './messageSafety'
import { Reader } from './App'
import type { Message, MessageSafety } from './types'

const internal:MessageSafety={classification:'internal',fromDomain:'muditam.com'}
const render=(safety?:MessageSafety,trusted=false)=>renderToStaticMarkup(<MessageSafetyControls safety={safety} trusted={trusted} onTrust={()=>{}} report={async()=>({status:'queued',submissionId:'1'})}/> )
describe('message sender safety',()=>{
  it('unlocks an internal domain verdict without authentication fields',()=>{
    expect(downloadsAllowed(internal,false)).toBe(true)
    for(const safety of [undefined,{...internal,classification:'external' as const},{...internal,classification:'suspicious' as const},{...internal,fromDomain:null}]){
      expect(downloadsAllowed(safety,false)).toBe(false)
      expect(downloadsAllowed(safety,true)).toBe(true)
    }
  })
  it('keeps the external banner after explicit trust',()=>{
    const safety={...internal,classification:'external' as const}
    expect(render(safety)).toContain(externalWarning)
    expect(render(safety)).toContain('enable attachment downloads')
    expect(render(safety,true)).toContain(externalWarning)
    expect(render(safety,true)).toContain('Attachment downloads enabled')
  })
  it('warns more strongly for suspicious or missing data',()=>{
    expect(render()).toContain('The sender domain could not be determined')
    expect(render({...internal,classification:'suspicious'})).toContain('The sender domain could not be determined')
    expect(render(internal)).not.toContain(externalWarning)
    expect(render(internal)).toContain('Report to IT')
  })
})

 it('renders a locked attachment and keeps body URLs and HTML as text',()=>{
   const message:Message={id:'1',mailboxIds:['inbox'],from:[],to:[],subject:'Test',preview:'',receivedAt:'2026-10-23T00:00:00Z',isRead:true,hasAttachment:true,bodyText:'https://example.com <a href="https://example.com">click</a>',attachments:[{id:'a',name:'file.pdf',type:'application/pdf',size:1}]}
   const html=renderToStaticMarkup(<Reader message={message} onBack={()=>{}} onToggleRead={()=>{}} onReply={()=>{}} onToast={()=>{}}/>)
   expect(html).toMatch(/class="attachment-chip" disabled=""/)
   expect(html).not.toContain('<a ')
   expect(html).toContain('&lt;a href=')
   expect(html).toContain('The sender domain could not be determined')
 })
