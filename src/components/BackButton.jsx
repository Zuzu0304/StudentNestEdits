import { useEffect, useState } from 'react'

export default function BackButton(){
  const [visible,setVisible]=useState(window.location.hash!=='#home' && window.location.hash!=='')
  useEffect(()=>{const f=()=>setVisible(window.location.hash!=='#home'&&window.location.hash!=='');window.addEventListener('hashchange',f);return()=>window.removeEventListener('hashchange',f)},[])
  if(!visible)return null
  const go=()=>{ if(window.history.length>1) window.history.back(); else window.location.hash='home' }
  return <button className="global-back-button" onClick={go} aria-label="Go back">← <span>Back</span></button>
}
