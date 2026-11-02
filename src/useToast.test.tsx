// @vitest-environment jsdom
import {act,cleanup,renderHook} from '@testing-library/react'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {useToast} from './useToast'

beforeEach(()=>vi.useFakeTimers())
afterEach(()=>{cleanup();vi.useRealTimers()})
it('shows successful send promptly and dismisses after five seconds',()=>{
 const {result}=renderHook(useToast)
 act(()=>result.current.showToast('Message sent.','success'))
 expect(result.current.toast?.message).toBe('Message sent.')
 act(()=>vi.advanceTimersByTime(4999));expect(result.current.toast).not.toBeNull()
 act(()=>vi.advanceTimersByTime(1));expect(result.current.toast).toBeNull()
})
it.each(['Another message sent.','Message sent.'])('replacement %s gets a full new duration',message=>{
 const {result}=renderHook(useToast)
 act(()=>result.current.showToast('Message sent.','success'))
 act(()=>vi.advanceTimersByTime(4000))
 act(()=>result.current.showToast(message,'success'))
 expect(vi.getTimerCount()).toBe(1)
 act(()=>vi.advanceTimersByTime(1000));expect(result.current.toast?.message).toBe(message)
 act(()=>vi.advanceTimersByTime(3999));expect(result.current.toast).not.toBeNull()
 act(()=>vi.advanceTimersByTime(1));expect(result.current.toast).toBeNull()
})
it('cleans up on dismissal and unmount',()=>{
 const {result,unmount}=renderHook(useToast)
 act(()=>result.current.showToast('Message sent.','success'))
 act(()=>result.current.dismissToast());expect(vi.getTimerCount()).toBe(0)
 act(()=>result.current.showToast('Message restored to Sent.','success'))
 unmount();expect(vi.getTimerCount()).toBe(0)
})
it('keeps actionable errors visible and cancels the preceding success timer',()=>{
 const {result}=renderHook(useToast)
 act(()=>result.current.showToast('Message sent.','success'))
 act(()=>vi.advanceTimersByTime(4000))
 act(()=>result.current.showToast('Could not download this attachment.'))
 expect(vi.getTimerCount()).toBe(0)
 act(()=>vi.advanceTimersByTime(60000))
 expect(result.current.toast?.message).toBe('Could not download this attachment.')
})
