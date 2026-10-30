import {afterEach,describe,expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {MoveMessageButton} from './MoveMessageButton'
import {api,setCsrfToken} from './api'
import {mockApi} from './mockApi'

afterEach(()=>{vi.unstubAllGlobals();setCsrfToken('')})
describe('Trash and restore',()=>{
 it('uses an authenticated, CSRF-protected move request and escapes message ids',async()=>{
  setCsrfToken('csrf');const fetch=vi.fn().mockImplementation(async()=>new Response(JSON.stringify({message:{id:'a/b',mailboxIds:['trash-box']}})));
  vi.stubGlobal('fetch',fetch);
  expect(await api.moveMessage('a/b','trash')).toEqual({id:'a/b',mailboxIds:['trash-box']});
  const [url,options]=fetch.mock.calls[0];expect(url).toBe('/api/app/v1/messages/a%2Fb/move');
  expect(options.method).toBe('POST');expect(options.credentials).toBe('include');expect(new Headers(options.headers).get('X-CSRF-Token')).toBe('csrf');expect(JSON.parse(options.body)).toEqual({action:'trash'});
  await api.moveMessage('a/b','restore');expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({action:'restore'});
 });
 it('surfaces move failures for the UI instead of treating them as success',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({error:{code:'MAILBOX_NOT_FOUND',message:'Trash unavailable.'}}),{status:404})));
  await expect(api.moveMessage('E1','trash')).rejects.toMatchObject({code:'MAILBOX_NOT_FOUND',message:'Trash unavailable.'});
 });
 it('uses a destination-neutral restore label and disables actions while moving',()=>{
  const render=(inTrash:boolean,busy=false)=>renderToStaticMarkup(<MoveMessageButton inTrash={inTrash} busy={busy} onMove={()=>{}}/>);
  expect(render(false)).toContain('Move to Trash');expect(render(true)).toContain('Restore');expect(render(false,true)).toContain('disabled=""');expect(render(false,true)).toContain('Moving…');
 });
 it('preview flow removes messages from the source, preserves content, updates counts and restores',async()=>{
  await mockApi.login('preview@example.com','preview');const before=await mockApi.message('m1');
  await mockApi.moveMessage('m1','trash');
  expect((await mockApi.messages('inbox')).messages.some(m=>m.id==='m1')).toBe(false);
  expect((await mockApi.message('m1'))).toEqual({...before,mailboxIds:['trash']});
  expect((await mockApi.mailboxes()).find(b=>b.role==='trash')?.totalCount).toBe(1);
  await mockApi.moveMessage('m1','restore');expect(await mockApi.message('m1')).toEqual(before);
  await mockApi.moveMessage('d1','trash');await mockApi.moveMessage('d1','restore');expect((await mockApi.message('d1')).mailboxIds).toEqual(['drafts']);
  await mockApi.logout();
 });
 it('preview restores Sent mail after logout/login without adding it to Inbox',async()=>{
  await mockApi.login('preview@example.com','preview');
  const sent=(await mockApi.messages('sent')).messages[0];
  const original=await mockApi.message(sent.id);
  await mockApi.moveMessage(sent.id,'trash');await mockApi.moveMessage(sent.id,'trash');
  await mockApi.logout();await mockApi.login('preview@example.com','preview');
  await mockApi.moveMessage(sent.id,'restore');expect(await mockApi.message(sent.id)).toEqual(original);
  expect((await mockApi.messages('inbox')).messages.some(m=>m.id===sent.id)).toBe(false);
  await mockApi.logout();
 });
})
