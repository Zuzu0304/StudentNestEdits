import { useEffect, useState } from 'react'
import { apiFetch } from '../lib_api.js'
import { getStoredUser, storeUser } from '../lib_auth.js'
import './ProfilePanel.css'

const initials = (name='User') => name.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase() || 'U'

export default function ProfilePanel({ onClose }) {
  const [user,setUser]=useState(getStoredUser());
  const [form,setForm]=useState({fullName:user?.fullName||'',phone:user?.phone||'',institution:user?.institution||''});
  const [saving,setSaving]=useState(false); const [notice,setNotice]=useState('');
  useEffect(()=>{apiFetch('/profile/me').then(d=>{setUser(d.user);setForm({fullName:d.user.fullName||'',phone:d.user.phone||'',institution:d.user.institution||''});storeUser(d.user)}).catch(e=>setNotice(e.message))},[])
  const save=async(e)=>{e.preventDefault();setSaving(true);setNotice('');try{const d=await apiFetch('/profile/me',{method:'PUT',body:JSON.stringify(form)});setUser(d.user);storeUser(d.user);window.dispatchEvent(new Event('studentnest-auth'));setNotice('Profile updated successfully.')}catch(e){setNotice(e.message)}finally{setSaving(false)}}
  return <div className="profile-backdrop" onClick={onClose}><section className="profile-panel" onClick={e=>e.stopPropagation()}><button className="profile-close" onClick={onClose}>×</button><div className="profile-hero"><div className="profile-avatar-large">{initials(user?.fullName)}</div><div><span className="eyebrow">My profile</span><h2>{user?.fullName||'StudentNest user'}</h2><p>{user?.email}</p><span className="profile-role">{user?.role}</span></div></div><form onSubmit={save} className="profile-form"><label>Name or nickname<input value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})} placeholder="What should we call you?" required/></label><label>Email address<input value={user?.email||''} disabled/></label><label>Phone number<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="0800 000 0000"/></label>{user?.role==='student'&&<label>School / institution<input value={form.institution} onChange={e=>setForm({...form,institution:e.target.value})} placeholder="e.g. ATBU"/></label>}{notice&&<p className="profile-notice">{notice}</p>}<button className="btn btn-primary" disabled={saving}>{saving?'Saving…':'Save changes'}</button></form></section></div>
}
