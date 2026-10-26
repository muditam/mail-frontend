import type { MessageSafety } from './types'

// The backend verdict uses an exact configured From-domain match only.
export function isInternalSender(safety?: MessageSafety): boolean {
  return safety?.classification === 'internal' && typeof safety.fromDomain === 'string' && safety.fromDomain.length > 0
}
export function downloadsAllowed(safety: MessageSafety | undefined, trusted: boolean): boolean {
  return isInternalSender(safety) || trusted
}
export const externalWarning = 'This email is from outside Muditam. Do you know the sender? If not, do not open links or download attachments. Report it to the IT manager immediately.'
