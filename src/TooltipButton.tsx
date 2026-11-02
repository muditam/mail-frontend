import {useId,useEffect,useLayoutEffect,useRef,useState,type ButtonHTMLAttributes} from 'react'
import {createPortal} from 'react-dom'

const useBrowserLayoutEffect=typeof window==='undefined'?useEffect:useLayoutEffect

/** A native button with optional help, without adding layout wrappers. */
export function TooltipButton({title,children,onFocus,onBlur,onPointerEnter,onPointerLeave,onPointerDown,onKeyDown,onClick,...props}:ButtonHTMLAttributes<HTMLButtonElement>){
 const label=title||props['aria-label']
 const id=useId(),button=useRef<HTMLButtonElement>(null),tip=useRef<HTMLDivElement>(null)
 const touch=useRef(false)
 const [open,setOpen]=useState(false),[position,setPosition]=useState({left:0,top:0})
 useBrowserLayoutEffect(()=>{
  if(!open||!label)return
  const place=()=>{
   if(!button.current?.isConnected){setOpen(false);return}
   const anchor=button.current.getBoundingClientRect(),box=tip.current?.getBoundingClientRect()
   if(!box)return
   const left=Math.max(8,Math.min(anchor.left+anchor.width/2-box.width/2,window.innerWidth-box.width-8))
   const below=anchor.bottom+8
   setPosition({left,top:below+box.height<=window.innerHeight-8?below:Math.max(8,anchor.top-box.height-8)})
  }
  const hide=()=>setOpen(false)
  place();window.addEventListener('resize',hide);window.addEventListener('scroll',hide,true)
  return ()=>{window.removeEventListener('resize',hide);window.removeEventListener('scroll',hide,true)}
 },[open,label])
 return <><button {...props} ref={button}
  aria-describedby={[props['aria-describedby'],open&&label?id:undefined].filter(Boolean).join(' ')||undefined}
  onPointerEnter={e=>{if(e.pointerType!=='touch'){touch.current=false;setOpen(true)}onPointerEnter?.(e)}}
  onPointerLeave={e=>{setOpen(false);onPointerLeave?.(e)}}
  onPointerDown={e=>{touch.current=e.pointerType==='touch';setOpen(false);onPointerDown?.(e)}}
  onFocus={e=>{if(!touch.current)setOpen(true);onFocus?.(e)}}
  onBlur={e=>{setOpen(false);touch.current=false;onBlur?.(e)}}
  onKeyDown={e=>{if(e.key==='Escape')setOpen(false);onKeyDown?.(e)}}
  onClick={e=>{setOpen(false);onClick?.(e)}}>{children}</button>
  {open&&label&&createPortal(<div ref={tip} id={id} role="tooltip" className="action-tooltip" style={position}>{label}</div>,document.body)}</>
}
