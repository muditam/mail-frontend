import {useEffect,useState} from 'react'
import {Search,X} from 'lucide-react'

export function MailSearch({query,busy,onSearch,onClear}:{query:string;busy:boolean;onSearch:(query:string)=>void;onClear:()=>void}){
  const [value,setValue]=useState(query)
  useEffect(()=>setValue(query),[query])
  return <form className="mail-search" role="search" aria-label="Search mail" onSubmit={event=>{event.preventDefault();const term=value.trim();if(term&&!busy&&term!==query)onSearch(term)}}>
    <div className="mail-search-input"><Search size={16}/><input aria-label="Search mail" placeholder="Sender, subject or message text" type="search" maxLength={256} value={value} onChange={event=>setValue(event.target.value)}/></div>
    <div className="mail-search-actions"><span>All folders, including Trash</span>{query&&<button type="button" onClick={()=>{setValue('');onClear()}} aria-label="Clear search"><X size={14}/> Clear</button>}<button type="submit" disabled={busy||!value.trim()||value.trim()===query}>Search</button></div>
  </form>
}
