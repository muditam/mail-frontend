import { describe, expect, it } from 'vitest'
import { initialRefreshDelay, manualRefreshAllowed, refreshAllowedOnFocus, refreshDelay } from './refreshPolicy'

describe('mail refresh policy', () => {
  it('spreads clients across a 45–75 second interval', () => {
    expect(initialRefreshDelay(() => 0)).toBe(45_000)
    expect(initialRefreshDelay(() => 0.5)).toBe(60_000)
    expect(initialRefreshDelay(() => 0.999)).toBeLessThan(75_000)
  })

  it('backs off repeated failures and caps the delay', () => {
    expect(refreshDelay(60_000, 0)).toBe(60_000)
    expect(refreshDelay(60_000, 1)).toBe(120_000)
    expect(refreshDelay(60_000, 2)).toBe(240_000)
    expect(refreshDelay(60_000, 3)).toBe(300_000)
    expect(refreshDelay(60_000, 10)).toBe(300_000)
  })

  it('rejects repeated manual clicks and clicks while a refresh is in flight', () => {
    expect(manualRefreshAllowed(0, 1_000, false)).toBe(true)
    expect(manualRefreshAllowed(1_000, 9_999, false)).toBe(false)
    expect(manualRefreshAllowed(1_000, 11_000, false)).toBe(true)
    expect(manualRefreshAllowed(1_000, 11_000, true)).toBe(false)
  })

  it('does not bypass the interval or error backoff on tab focus', () => {
    expect(refreshAllowedOnFocus(1_000, 0, 60_999, 60_000, 0)).toBe(false)
    expect(refreshAllowedOnFocus(1_000, 0, 61_000, 60_000, 0)).toBe(true)
    expect(refreshAllowedOnFocus(1_000, 100_000, 219_999, 60_000, 1)).toBe(false)
    expect(refreshAllowedOnFocus(1_000, 100_000, 220_000, 60_000, 1)).toBe(true)
  })
})
