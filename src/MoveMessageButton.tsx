import {TooltipButton} from './TooltipButton'
import { ArchiveRestore, LoaderCircle, Trash2 } from 'lucide-react'

export function MoveMessageButton({inTrash,busy,disabled=false,onMove}:{inTrash:boolean;busy:boolean;disabled?:boolean;onMove:()=>void}) {
  const label=inTrash ? 'Restore' : 'Move to Trash'
  return <TooltipButton type="button" className="secondary" disabled={busy||disabled} onClick={onMove} aria-label={label} title={disabled?'Automatic delivery is in progress':label}>
    {busy?<LoaderCircle className="spin" size={17}/>:inTrash?<ArchiveRestore size={17}/>:<Trash2 size={17}/>}
    <span className="move-message-label">{busy?'Moving…':label}</span>
  </TooltipButton>
}
