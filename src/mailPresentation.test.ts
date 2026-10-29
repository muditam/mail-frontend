import {expect,it} from 'vitest'
import {formatFileSize,orderMailboxes} from './mailPresentation'
import type {Mailbox} from './types'
it('shows small nonempty attachments in bytes or KB',()=>{
 expect(formatFileSize(262)).toBe('262 bytes');expect(formatFileSize(1192)).toBe('1.2 KB')
 expect(formatFileSize(0)).toBe('0 bytes');expect(formatFileSize(1)).toBe('1 byte')
 expect(formatFileSize(1024)).toBe('1.0 KB');expect(formatFileSize(1048576)).toBe('1.0 MB')
})
it('orders roles consistently regardless of response order, counts or account IDs',()=>{
 const roles=['drafts','junk','trash','inbox','sent']
 const boxes=roles.map((role,i)=>({id:String(i),name:role,role,unreadCount:0,totalCount:0})) as Mailbox[]
 const expected=['inbox','sent','drafts','junk','trash']
 expect(orderMailboxes(boxes).map(b=>b.role)).toEqual(expected)
 expect(orderMailboxes([...boxes].reverse().map((b,i)=>({...b,id:'other'+i,totalCount:100-i,unreadCount:i}))).map(b=>b.role)).toEqual(expected)
 expect(boxes.map(b=>b.role)).toEqual(roles)
 const custom=(name:string,id:string)=>({id,name,unreadCount:0,totalCount:0})
 expect(orderMailboxes([custom('Zebra','z'),...boxes,custom('Alpha','a')]).map(b=>b.name)).toEqual([...expected,'Alpha','Zebra'])
})
