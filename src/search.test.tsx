import {afterEach,describe,expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {api} from './api'
import {mockApi} from './mockApi'
import {MailSearch} from './MailSearch'

afterEach(()=>vi.unstubAllGlobals())
describe('mail search',()=>{
 it('encodes terms, preserves pagination and sends the cancellation signal',async()=>{
  const fetch=vi.fn().mockImplementation(async()=>new Response(JSON.stringify({messages:[]})));vi.stubGlobal('fetch',fetch);
  const controller=new AbortController();await api.messages(undefined,'30','a+b & "budget"',controller.signal);
  const [url,options]=fetch.mock.calls[0];const params=new URL(url,'https://app.test').searchParams;
  expect(params.get('q')).toBe('a+b & "budget"');expect(params.get('cursor')).toBe('30');expect(params.has('mailboxId')).toBe(false);expect(options.credentials).toBe('include');expect(options.signal).toBe(controller.signal);
  await api.messages('inbox');expect(new URL(fetch.mock.calls[1][0],'https://app.test').searchParams.has('q')).toBe(false);
 });
 it('offers accessible explicit search and clear, caps length and disables duplicate submits',()=>{
  const render=(query:string,busy=false)=>renderToStaticMarkup(<MailSearch query={query} busy={busy} onSearch={()=>{}} onClear={()=>{}}/>);
  expect(render('')).toContain('role="search"');expect(render('')).toContain('maxLength="256"');expect(render('')).toContain('All folders, including Trash');expect(render('budget')).toContain('Clear search');expect(render('budget')).toContain('disabled=""');expect(render('budget',true)).toContain('disabled=""');
 });
 it('mock search matches sender, subject and body across folders, with no-match and folder scope',async()=>{
  await mockApi.login('preview@example.test','preview');
  expect((await mockApi.messages(undefined,undefined,'OLIVIA@NORTHSTAR')).messages.map(m=>m.id)).toEqual(['m1']);
  expect((await mockApi.messages(undefined,undefined,'Initial concepts')).messages.map(m=>m.id)).toEqual(['m7']);
  expect((await mockApi.messages(undefined,undefined,'productive session')).messages.map(m=>m.id)).toEqual(['m5']);
  expect((await mockApi.messages('inbox',undefined,'Initial concepts')).messages).toEqual([]);
  expect((await mockApi.messages(undefined,undefined,'no-such-search-xyz')).messages).toEqual([]);
  await mockApi.logout();
 });
})
