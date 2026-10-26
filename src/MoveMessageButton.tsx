import { ArchiveRestore, LoaderCircle, Trash2 } from 'lucide-react'

export function MoveMessageButton({inTrash,isDraft=false,busy,onMove}:{inTrash:boolean;isDraft?:boolean;busy:boolean;onMove:()=>void}) {
  const label=inTrash ? `Restore to ${isDraft?'Drafts':'Inbox'}` : 'Move to Trash'
  return <button type="button" className="secondary" disabled={busy} onClick={onMove} aria-label={label} title={label}>
    {busy?<LoaderCircle className="spin" size={17}/>:inTrash?<ArchiveRestore size={17}/>:<Trash2 size={17}/>}
    <span className="move-message-label">{busy?'Moving…':label}</span>
  </button>
}
