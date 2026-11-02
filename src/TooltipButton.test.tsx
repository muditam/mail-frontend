// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest'
import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import {TooltipButton} from './TooltipButton'
import {Login} from './App'

afterEach(()=>{cleanup();vi.unstubAllGlobals()})
it('shows help on hover and keyboard focus without activating the action',()=>{
 const click=vi.fn()
 render(<TooltipButton aria-label="Refresh" onClick={click}>↻</TooltipButton>)
 const button=screen.getByRole('button',{name:'Refresh'})
 fireEvent.pointerEnter(button)
 expect(screen.getByRole('tooltip').textContent).toBe('Refresh');expect(click).not.toHaveBeenCalled()
 expect(button.getAttribute('aria-describedby')).toBe(screen.getByRole('tooltip').id)
 fireEvent.pointerLeave(button);expect(screen.queryByRole('tooltip')).toBeNull()
 fireEvent.focus(button);expect(screen.getByRole('tooltip')).toBeTruthy()
 fireEvent.keyDown(button,{key:'Escape'});expect(screen.queryByRole('tooltip')).toBeNull()
 fireEvent.blur(button);fireEvent.focus(button);fireEvent.click(button)
 expect(click).toHaveBeenCalledTimes(1);expect(screen.queryByRole('tooltip')).toBeNull()
})
it('supports touch activation without requiring tooltip dismissal',()=>{
 class PointerEvent extends MouseEvent {pointerType:string;constructor(type:string,init:PointerEventInit){super(type,init);this.pointerType=init.pointerType||''}}
 vi.stubGlobal('PointerEvent',PointerEvent)
 const click=vi.fn();render(<TooltipButton aria-label="Reply" onClick={click}>↩</TooltipButton>)
 const button=screen.getByRole('button',{name:'Reply'})
 fireEvent.pointerEnter(button,{pointerType:'touch'});fireEvent.pointerDown(button,{pointerType:'touch'});fireEvent.focus(button)
 expect(screen.queryByRole('tooltip')).toBeNull()
 fireEvent.click(button);expect(click).toHaveBeenCalledTimes(1)
})
it('removes the tooltip on blur, scroll and unmount',()=>{
 const {unmount}=render(<TooltipButton aria-label="Restore">↩</TooltipButton>)
 const button=screen.getByRole('button')
 fireEvent.focus(button);fireEvent.blur(button);expect(screen.queryByRole('tooltip')).toBeNull()
 fireEvent.focus(button);fireEvent.scroll(window);expect(screen.queryByRole('tooltip')).toBeNull()
 fireEvent.focus(button);unmount();expect(screen.queryByRole('tooltip')).toBeNull()
})
it('password help tracks the current action while preserving accessible names',()=>{
 render(<Login expired={false} onLogin={async()=>{}}/>)
 const show=screen.getByRole('button',{name:'Show password'})
 fireEvent.focus(show);expect(screen.getByRole('tooltip').textContent).toBe('Show password')
 fireEvent.click(show)
 const hide=screen.getByRole('button',{name:'Hide password'})
 fireEvent.blur(hide);fireEvent.focus(hide);expect(screen.getByRole('tooltip').textContent).toBe('Hide password')
})
