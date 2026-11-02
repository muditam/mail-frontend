import type {DeliveryRetry} from './types'
export function DeliveryRetryNotice({retry}:{retry?:DeliveryRetry}){
 if(!retry)return null
 const pending=['waiting','working','dispatching'].includes(retry.state)
 return <div className="delivery-retry-notice" role="status">
  {pending?<>Delivery delayed for {retry.pending} recipient(s). Retrying automatically{retry.nextAttemptAt?` after ${new Date(retry.nextAttemptAt).toLocaleString()}`:''}. Do not resend this message.{retry.failed>0?` ${retry.failed} recipient(s) were rejected permanently.`:''}</>:
   retry.state==='completed'?<>Automatic retries finished. The mail server accepted the remaining recipients.</>:
   retry.state==='attention'?<>Delivery status needs review. Automatic retries stopped to avoid duplicates. Contact your mail administrator before resending.</>:
   <>Automatic retries ended. Delivery failed for {retry.failed} recipient(s). {retry.accepted>0?'Some recipients were already accepted; do not resend to everyone.':'Contact your mail administrator before retrying.'}</>}
 </div>
}
