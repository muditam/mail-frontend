import {useEffect,useRef,useState} from 'react'
import {Search,X} from 'lucide-react'

export function MailSearch({query,busy,onSearch,onClear}:{query:string;busy:boolean;onSearch:(query:string)=>void;onClear:()=>void}){
  const [value,setValue]=useState(query)
  const input=useRef<HTMLInputElement>(null)
  const clear=()=>{setValue('');onClear();input.current?.focus()}
  useEffect(()=>setValue(query),[query])
  return <form className="mail-search" role="search" aria-label="Search mail" onSubmit={event=>{event.preventDefault();const term=value.trim();if(term&&!busy&&term!==query)onSearch(term)}}>
    <div className="mail-search-input"><Search size={16}/><input ref={input} aria-label="Search mail" placeholder="Sender, subject or message text" type="text" role="searchbox" enterKeyHint="search" maxLength={256} value={value} onChange={event=>setValue(event.target.value)}/>{(value||query)&&<button className="mail-search-clear" type="button" onClick={clear} aria-label="Clear search text" title="Clear search"><X size={16}/></button>}</div>
    <div className="mail-search-actions"><span>All folders, including Trash</span>{query&&<button type="button" onClick={clear} aria-label="Clear search"><X size={14}/> Clear</button>}<button type="submit" disabled={busy||!value.trim()||value.trim()===query}>Search</button></div>
  </form>
}
