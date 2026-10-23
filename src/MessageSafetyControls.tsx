import { useState } from 'react'
import type { MessageSafety } from './types'
import { externalWarning, isVerifiedInternal } from './messageSafety'

export function MessageSafetyControls({safety,trusted,onTrust,report}:{safety?:MessageSafety;trusted:boolean;onTrust:()=>void;report:()=>Promise<{status:'queued';submissionId:string}>}) {
  const [reportState,setReportState]=useState<'idle'|'sending'|'sent'|'failed'>('idle')
  const guarded=!isVerifiedInternal(safety)
  const suspicious=safety?.classification!=='external'
  const sendReport=async()=>{
    setReportState('sending')
    try { const result=await report(); if(result.status!=='queued'||!result.submissionId)throw new Error('Invalid report response'); setReportState('sent') }
    catch { setReportState('failed') }
  }
  return <div className="message-safety">
    {guarded&&<div className="sender-warning" role="alert">
      {suspicious&&<strong>Possible spoofed sender: sender authentication is missing or unverified. Treat this message as suspicious.</strong>}
      {safety?.spam&&<strong>This message was flagged as spam.</strong>}
      <p>{externalWarning}</p>
      {!trusted?<button className="secondary" onClick={onTrust}>I trust this sender — enable attachment downloads</button>:<p>Attachment downloads enabled for this message.</p>}
    </div>}
    <button className="secondary report-button" disabled={reportState==='sending'||reportState==='sent'} onClick={sendReport}>{reportState==='sending'?'Reporting…':'Report to IT'}</button>
    {reportState==='sent'&&<p role="status">Report queued for IT.</p>}
    {reportState==='failed'&&<p role="alert">Could not report this message. Please try again.</p>}
  </div>
}
