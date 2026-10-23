import type { MessageSafety } from './types'

// Only a complete, authenticated backend verdict can unlock automatically.
export function isVerifiedInternal(safety?: MessageSafety): boolean {
  return safety?.classification === 'internal' && safety.authentication === 'aligned' && safety.spam === false && typeof safety.fromDomain === 'string' && safety.fromDomain.length > 0
}
export function downloadsAllowed(safety: MessageSafety | undefined, trusted: boolean): boolean {
  return isVerifiedInternal(safety) || trusted
}
export const externalWarning = 'This email is from outside Muditam. Do you know the sender? If not, do not open links or download attachments. Report it to the IT manager immediately.'
