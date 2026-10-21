export const manualRefreshCooldownMs = 10_000
const maxRefreshDelayMs = 5 * 60_000

export function initialRefreshDelay(random = Math.random): number {
  return 45_000 + Math.floor(random() * 30_000)
}

export function refreshDelay(baseMs: number, consecutiveFailures: number): number {
  return Math.min(maxRefreshDelayMs, baseMs * 2 ** Math.min(3, Math.max(0, consecutiveFailures)))
}

export function manualRefreshAllowed(lastStartedAt: number, now: number, isFetching: boolean): boolean {
  return !isFetching && (lastStartedAt === 0 || now - lastStartedAt >= manualRefreshCooldownMs)
}

export function refreshAllowedOnFocus(lastSuccessAt: number, lastErrorAt: number, now: number, baseMs: number, consecutiveFailures: number): boolean {
  const lastAttemptAt = Math.max(lastSuccessAt, lastErrorAt)
  return lastAttemptAt > 0 && now - lastAttemptAt >= refreshDelay(baseMs, consecutiveFailures)
}
