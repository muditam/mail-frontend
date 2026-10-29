import {afterEach,describe,expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {StarButton} from './StarButton'
import {updateStarPages,withStar} from './starState'
import {api,setCsrfToken} from './api'
import {mockApi} from './mockApi'
import type {MessageSummary} from './types'
afterEach(()=>{vi.unstubAllGlobals();setCsrfToken('')})
describe('message stars',()=>{
 it('uses cookie/CSRF protection and keeps listing filters on later pages',async()=>{
  setCsrfToken('csrf');const fetch=vi.fn().mockImplementation(async()=>new Response(JSON.stringify({message:{id:'a/b',isStarred:true},messages:[]})));vi.stubGlobal('fetch',fetch);
  expect(await api.star('a/b',true)).toEqual({id:'a/b',isStarred:true});const [url,options]=fetch.mock.calls[0];expect(url).toBe('/api/app/v1/messages/a%2Fb/star');expect(options.method).toBe('PATCH');expect(options.credentials).toBe('include');expect(new Headers(options.headers).get('X-CSRF-Token')).toBe('csrf');expect(JSON.parse(options.body)).toEqual({isStarred:true});
  await api.messages(undefined,'30',undefined,undefined,true);const params=new URL(fetch.mock.calls[1][0],'https://app.test').searchParams;expect(params.get('starred')).toBe('true');expect(params.get('cursor')).toBe('30');expect(params.has('mailboxId')).toBe(false);
 });
 it('does not treat an upstream error as a saved star',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({error:{code:'UPSTREAM_UNAVAILABLE',message:'Try again.'}}),{status:503})));
  await expect(api.star('E1',true)).rejects.toMatchObject({code:'UPSTREAM_UNAVAILABLE'});
 });
 it('preserves content and other keywords, removing only unstarred items from Starred pages',()=>{
  const m:MessageSummary={id:'E1',keywords:{'$seen':true,'$draft':true},subject:'Keep me',mailboxIds:['inbox'],from:[],preview:'',receivedAt:'2026-10-26T00:00:00Z',isRead:true,hasAttachment:false};
  const starred=withStar(m,true);expect(starred.keywords).toEqual({'$seen':true,'$draft':true,'$flagged':true});expect(m.keywords?.['$flagged']).toBeUndefined();expect(withStar(starred,false)).toEqual(m);
  const pages={pages:[{messages:[starred],nextCursor:'30'}],pageParams:[undefined]};
  expect(updateStarPages(pages,'E1',false)?.pages[0].messages).toEqual([m]);
  expect(updateStarPages(pages,'E1',false,true)?.pages[0]).toEqual({messages:[],nextCursor:'30'});
 });
 it('exposes pressed state, action labels and a disabled pending button',()=>{
  const html=renderToStaticMarkup(<StarButton starred busy onClick={()=>{}}/>);
  expect(html).toContain('aria-pressed="true"');expect(html).toContain('Unstar message');expect(html).toContain('disabled=""');
  expect(renderToStaticMarkup(<StarButton starred={false} busy={false} onClick={()=>{}}/>)).toContain('Star message');
 });
 it('mock stars survive read and trash changes and disappear when unstarred',async()=>{
  await mockApi.login('preview@example.test','preview');await mockApi.star('m1',true);await mockApi.read('m1',true);
  expect((await mockApi.messages(undefined,undefined,undefined,undefined,true)).messages.map(m=>m.id)).toEqual(['m1']);
  await mockApi.moveMessage('m1','trash');expect((await mockApi.message('m1')).keywords?.['$flagged']).toBe(true);
  await mockApi.star('m1',false);expect((await mockApi.messages(undefined,undefined,undefined,undefined,true)).messages).toEqual([]);
  await mockApi.moveMessage('m1','restore');await mockApi.logout();
 });
})
