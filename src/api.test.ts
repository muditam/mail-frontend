import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, setCsrfToken } from './api'
import { ApiError } from './types'
import { composerSchema } from './App'

afterEach(() => { vi.unstubAllGlobals(); setCsrfToken('') })

describe('frontend contract', () => {
  it('sends login credentials only in the request body with cookies enabled', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({user:{email:'test@60brands.com'},csrfToken:'csrf'}),{status:200}))
    vi.stubGlobal('fetch',fetch)
    await api.login('test@60brands.com','secret')
    const [url, options] = fetch.mock.calls[0]
    expect(url).toBe('/api/app/v1/auth/login')
    expect(options.credentials).toBe('include')
    expect(JSON.parse(options.body)).toEqual({email:'test@60brands.com',password:'secret'})
  })

  it('sends the CSRF header on mutations and handles unknown send status', async () => {
    setCsrfToken('csrf-value')
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({error:{code:'SEND_STATUS_UNKNOWN',message:'Could not confirm send.'}}),{status:502}))
    vi.stubGlobal('fetch',fetch)
    await expect(api.send({to:['test@example.com'],subject:'Hi',bodyText:'Hello',attachmentIds:[]})).rejects.toMatchObject({code:'SEND_STATUS_UNKNOWN'})
    expect(new Headers(fetch.mock.calls[0][1].headers).get('X-CSRF-Token')).toBe('csrf-value')
  })

  it('never accepts an empty or invalid recipient list', () => {
    const base = {cc:'',bcc:'',subject:'',bodyText:''}
    expect(composerSchema.safeParse({...base,to:'  '}).success).toBe(false)
    expect(composerSchema.safeParse({...base,to:'person@example.com, bad-address'}).success).toBe(false)
    expect(composerSchema.safeParse({...base,to:'person@example.com'}).success).toBe(true)
  })

  it('maps a missing session to a typed error', async () => {
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({error:{code:'SESSION_EXPIRED',message:'Please sign in again.'}}),{status:401})))
    await expect(api.session()).rejects.toBeInstanceOf(ApiError)
  })
})
