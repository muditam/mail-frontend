import {useCallback,useEffect,useState} from 'react'

type Toast = {message:string;kind:'success'|'error'}
export const toastDurationMs=5000

export function useToast(){
 const [toast,setToast]=useState<Toast|null>(null)
 // A new object resets the duration even when the same message is shown again.
 const showToast=useCallback((message:string,kind:Toast['kind']='error')=>setToast({message,kind}),[])
 const dismissToast=useCallback(()=>setToast(null),[])
 useEffect(()=>{
  if(!toast||toast.kind!=='success')return
  const timer=setTimeout(()=>setToast(current=>current===toast?null:current),toastDurationMs)
  return ()=>clearTimeout(timer)
 },[toast])
 return {toast,showToast,dismissToast}
}
