import {Star} from 'lucide-react'
export function StarButton({starred,busy,onClick}:{starred:boolean;busy:boolean;onClick:()=>void}){
  const label=starred?'Unstar message':'Star message'
  return <button type="button" className={`icon-button star-button ${starred?'is-starred':''}`} aria-label={label} aria-pressed={starred} title={label} disabled={busy} onClick={onClick}><Star size={18} fill={starred?'currentColor':'none'}/></button>
}
