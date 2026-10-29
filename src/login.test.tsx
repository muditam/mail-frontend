// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest'
import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {Login} from './App'
import {ApiError} from './types'

afterEach(cleanup)
const rejected=()=>new ApiError('INVALID_CREDENTIALS','Rejected',401)
const submit=()=>fireEvent.click(screen.getByRole('button',{name:/Continue to inbox/}))
const fill=()=>{
 fireEvent.change(screen.getByLabelText('Email address'),{target:{value:'test@example.test'}})
 fireEvent.change(screen.getByLabelText('Password'),{target:{value:'incorrect'}})
}

it('clears stale errors on either credential edit, preserves validation and allows retry',async()=>{
 const login=vi.fn().mockRejectedValue(rejected())
 render(<Login onLogin={login} expired={false}/>);fill();submit()
 expect(await screen.findByRole('alert')).toHaveProperty('textContent','Email or password is incorrect. Please try again.')
 fireEvent.change(screen.getByLabelText('Password'),{target:{value:''}})
 await screen.findByText('Enter your password')
 expect(screen.queryByRole('alert')).toBeNull();expect(login).toHaveBeenCalledTimes(1)
 fireEvent.change(screen.getByLabelText('Password'),{target:{value:'wrong-again'}});submit()
 await screen.findByRole('alert');expect(login).toHaveBeenCalledTimes(2)
 fireEvent.change(screen.getByLabelText('Email address'),{target:{value:'invalid'}})
 await screen.findByText('Enter a valid email address')
 expect(screen.queryByRole('alert')).toBeNull();expect(login).toHaveBeenCalledTimes(2)
 fireEvent.change(screen.getByLabelText('Email address'),{target:{value:'test@example.test'}})
 fireEvent.change(screen.getByLabelText('Password'),{target:{value:'correct'}})
 login.mockResolvedValueOnce(undefined);submit()
 await waitFor(()=>expect(login).toHaveBeenLastCalledWith('test@example.test','correct'))
 await waitFor(()=>expect(screen.getByRole('button',{name:/Continue to inbox/})).toHaveProperty('disabled',false))
 expect(screen.queryByRole('alert')).toBeNull()
})

it('does not display a delayed rejection after credentials have changed',async()=>{
 let reject!:(reason:unknown)=>void
 const login=vi.fn(()=>new Promise<void>((_resolve,r)=>{reject=r}))
 render(<Login onLogin={login} expired={false}/>);fill();submit()
 await waitFor(()=>expect(login).toHaveBeenCalledTimes(1))
 fireEvent.change(screen.getByLabelText('Password'),{target:{value:'edited'}})
 await act(async()=>reject(rejected()))
 expect(screen.queryByRole('alert')).toBeNull()
 expect(screen.getByRole('button',{name:/Continue to inbox/})).toHaveProperty('disabled',false)
})
