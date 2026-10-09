import { useEffect, useMemo, useRef, useState } from 'react'
import { apiFetch, API_URL, mediaUrl } from '../lib_api.js'
import { getStoredUser } from '../lib_auth.js'
import ReviewCenter from './ReviewCenter.jsx'
import ChatCenter from './ChatCenter.jsx'
import Marketplace from './Marketplace.jsx'
import './StudentHub.css'

const FALLBACK_TRAITS = ['Clean','Quiet','Non-smoker','Early sleeper','Night owl','Studious','Friendly','Organised','Pet-friendly','Vegetarian/Halal-conscious']
const money = n => `₦${Number(n||0).toLocaleString()}`

function normalise(item){const images=Array.isArray(item.images)?item.images.map(m=>typeof m==='string'?({url:m,type:'image'}):m).filter(m=>m?.url):[];const first=images.find(m=>m.type!=='video')?.url;const rent=Number(item.rent||0);return {id:item.id,name:item.title,location:[item.area,item.city].filter(Boolean).join(', '),price:`₦${rent.toLocaleString()} / year`,numericPrice:rent,type:String(item.property_type||'').replace(/-/g,' '),verified:Boolean(item.is_verified),image:mediaUrl(first||'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'),facilities:Array.isArray(item.amenities)?item.amenities:[]}}

function StudentHub(){
 const user=getStoredUser(); const [activeTab,setActiveTab]=useState('overview'); const [favourites,setFavourites]=useState([]); const [inquiries,setInquiries]=useState([]); const [loading,setLoading]=useState(true); const [toast,setToast]=useState(''); const [unreadMessages,setUnreadMessages]=useState(0); const [openConversationId,setOpenConversationId]=useState(null); const [openOtherUserId,setOpenOtherUserId]=useState(null); const [openPropertyId,setOpenPropertyId]=useState(null); const [openContextKey,setOpenContextKey]=useState(null); const [chatKey,setChatKey]=useState(0);
 const load=async()=>{setLoading(true);try{const [f,i]=await Promise.all([apiFetch('/student/favourites'),apiFetch('/student/inquiries')]);setFavourites((f.favourites||[]).map(normalise));setInquiries(i.inquiries||[])}catch(e){setToast(e.message)}finally{setLoading(false)}}
 const consumePendingChat=()=>{try{const raw=localStorage.getItem('studentnest_open_chat');if(raw){const x=JSON.parse(raw);setOpenConversationId(x.conversationId||null);setOpenOtherUserId(x.otherUserId||null);setOpenPropertyId(x.propertyId||null);setOpenContextKey(x.contextKey||(()=>{try{return localStorage.getItem('studentnest_last_chat_context')||null}catch{return null}})());setChatKey(v=>v+1);setActiveTab('messages');localStorage.removeItem('studentnest_open_chat');return true}}catch{}return false}
 useEffect(()=>{load();apiFetch('/notifications/unread-count').then(d=>setUnreadMessages(Number(d.unread_count||0))).catch(()=>{});consumePendingChat();const handler=()=>consumePendingChat();window.addEventListener('studentnest-open-chat',handler);return()=>window.removeEventListener('studentnest-open-chat',handler)},[])
 const openChatFor=(otherUserId,contextKey=null,propertyId=null)=>{setOpenConversationId(null);setOpenOtherUserId(otherUserId);setOpenPropertyId(propertyId);setOpenContextKey(contextKey);setChatKey(v=>v+1);setActiveTab('messages')}
 const flash=m=>{setToast(m);setTimeout(()=>setToast(''),2600)}
 const toggleFav=async p=>{try{const exists=favourites.some(x=>String(x.id)===String(p.id));if(exists){await apiFetch(`/student/favourites/${p.id}`,{method:'DELETE'});setFavourites(v=>v.filter(x=>String(x.id)!==String(p.id)));flash('Removed from favourites.')}else{await apiFetch(`/student/favourites/${p.id}`,{method:'POST'});setFavourites(v=>[p,...v]);flash('Saved to favourites.')}}catch(e){flash(e.message)}}
 const closeInquiry=async id=>{try{await apiFetch(`/student/inquiries/${id}/cancel`,{method:'PATCH'});setInquiries(v=>v.map(i=>i.id===id?{...i,status:'closed'}:i));flash('Inquiry closed.')}catch(e){flash(e.message)}}
 const acceptAppointment=async id=>{try{const d=await apiFetch(`/bookings/${id}/accept`,{method:'POST'});flash(d.message);await load()}catch(e){flash(e.message)}}
 const tabs=[['overview','Overview'],['messages','Messages'],['shop','Student Shop'],['favourites','♡ Favourites'],['roommates','Roommate Finder'],['takeovers','Takeovers'],['reviews','Reviews'],['payments','Bookings & Payments']]
 return <main className="student-hub">{toast&&<div className="hub-toast">✓ {toast}</div>}<section className="hub-hero"><div className="container"><p className="eyebrow">StudentNest · My Student Space</p><div className="hub-heading"><div><h1>Welcome{user?.fullName?`, ${user.fullName.split(' ')[0]}`:''}.</h1><p>Keep your saved homes, enquiries and student-home activity in one place.</p></div><a href="#accommodation" className="btn btn-primary">Find accommodation</a></div></div></section><section className="hub-content container"><div className="hub-tabs">{tabs.map(([id,label])=><button key={id} className={activeTab===id?'is-active':''} onClick={()=>setActiveTab(id)}>{label}{id==='messages'&&unreadMessages>0&&<span className='student-message-badge'>{unreadMessages>99?'99+':unreadMessages}</span>}</button>)}</div>{activeTab==='overview'&&<><div className="hub-stat-grid"><button onClick={()=>setActiveTab('favourites')}><strong>{favourites.length}</strong><span>Saved homes</span></button><button onClick={()=>setActiveTab('messages')}><strong>{unreadMessages}</strong><span>Unread messages</span></button><button onClick={()=>setActiveTab('roommates')}><strong>→</strong><span>Roommate finder</span></button><button onClick={()=>setActiveTab('takeovers')}><strong>→</strong><span>Takeovers</span></button></div><div className="hub-two-col"><div className="hub-panel"><div className="panel-heading"><div><p className="eyebrow">Your activity</p><h2>Messages & appointments</h2></div><button onClick={()=>setActiveTab('messages')}>Open inbox</button></div><p className="panel-copy">Chat with providers, other students, inspectors and StudentNest admin. Viewing appointments and responses stay attached to the conversation.</p><button className="btn btn-primary" onClick={()=>setActiveTab('messages')}>Open messages {unreadMessages>0?`· ${unreadMessages} unread`:''}</button></div><div className="hub-panel"><div className="panel-heading"><div><p className="eyebrow">Quick action</p><h2>Looking for a roommate?</h2></div></div><p className="panel-copy">Tell StudentNest what kind of person you would like to live with, or post your own place looking for someone to split the rent with.</p><button className="btn btn-primary" onClick={()=>setActiveTab('roommates')}>Find a roommate</button></div></div></>}{activeTab==='favourites'&&<FeatureSection title="Saved homes" eyebrow="Your favourites" subtitle="Properties you saved while browsing.">{favourites.length?favourites.map(p=><div className="feature-card" key={p.id}><img src={p.image} alt={p.name}/><div><span className="mini-badge">✓ Verified</span><h3>{p.name}</h3><p>{p.location}</p><strong>{p.price}</strong><div className="card-actions"><a className="btn btn-outline-ink" href={`#accommodation-${p.id}`}>View details</a><button className="text-button" onClick={()=>toggleFav(p)}>Remove</button></div></div></div>):<Empty text="You haven't saved any homes yet. Tap the ♡ on a listing to save it here."/>}</FeatureSection>}{activeTab==='shop'&&<Marketplace compact/>}{activeTab==='messages'&&<ChatCenter key={`student-chat-${chatKey}`} initialConversationId={openConversationId} initialOtherUserId={openOtherUserId} initialPropertyId={openPropertyId} initialContextKey={openContextKey}/>} {activeTab==='roommates'&&<RoommateFinder flash={flash} onContact={openChatFor}/>}{activeTab==='takeovers'&&<TakeoverBoard flash={flash} onContact={openChatFor}/>}{activeTab==='reviews'&&<ReviewCenter/>}{activeTab==='payments'&&<section className="feature-section"><div className="section-heading"><div><p className="eyebrow">Secure rental</p><h2>Bookings & payments</h2><p>Choose a home, pay only after approval, and manage protected transactions.</p></div></div><a className="btn btn-primary" href="#student-payments">Open bookings & payments</a></section>}</section></main>
}

function FeatureSection({eyebrow,title,subtitle,children}){return <div className="feature-section"><div className="section-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p>{subtitle}</p></div></div><div className="feature-list">{children}</div></div>}
function InquiryRow({item,detailed=false,onCancel,onAccept}){
 const source=item.source_type==='roommate'?'Roommate Finder':item.source_type==='takeover'?'Takeover':'Provider'
 const appointment=item.appointment_date&&item.appointment_time
 return <div className={`inquiry-row ${detailed?'is-detailed':''}`}><div className="inquiry-icon">{item.source_type==='provider'?'⌂':'↗'}</div><div className="profile-main"><div className="profile-title"><h3>{item.property_title||'StudentNest inquiry'}</h3><span className="status-pill">{source}</span><span className="status-pill">{item.status}</span></div><p>{item.message}</p>{item.provider_response&&item.source_type==='provider'&&<div className="provider-reply"><strong>{appointment?'PROPERTY IS AVAILABLE TO INSPECT':'Provider response'}</strong>{appointment&&<span><b>{new Date(item.appointment_date).toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</b> at <b>{String(item.appointment_time).slice(0,5)}</b></span>}<span>{item.provider_response}</span>{item.provider_phone&&<a className="inline-contact" href={`tel:${item.provider_phone}`}>Call provider</a>}</div>}{(item.responder_name||item.responder_phone)&&<div className="provider-reply"><strong>Response received</strong><span>{item.responder_name}{item.responder_phone?` · ${item.responder_phone}`:''}</span>{item.responder_phone&&<a className="inline-contact" href={`tel:${item.responder_phone}`}>Call</a>}{item.responder_email&&<a className="inline-contact" href={`mailto:${item.responder_email}`}>Email</a>}</div>}<small>{item.created_at?new Date(item.created_at).toLocaleString():''}</small></div><div className="inquiry-actions">{onAccept&&<button className="btn btn-primary" onClick={onAccept}>Accept appointment</button>}{onCancel&&<button className="text-button" onClick={onCancel}>Close</button>}</div></div>
}
function Empty({text}){return <div className="feature-empty"><span>♡</span><p>{text}</p><a href="#accommodation" className="btn btn-primary">Browse homes</a></div>}



function RoommateFinder({flash,onContact}){
 const [view,setView]=useState('browse')
 const [search,setSearch]=useState('')
 const [listings,setListings]=useState([])
 const [mine,setMine]=useState([])
 const [traitOptions,setTraitOptions]=useState(FALLBACK_TRAITS)
 const [loading,setLoading]=useState(true)
 const [showForm,setShowForm]=useState(false)

 const loadBrowse=async()=>{try{const d=await apiFetch('/student/roommates');setListings(d.listings||[]);if(d.traitOptions?.length)setTraitOptions(d.traitOptions)}catch(e){flash(e.message)}}
 const loadMine=async()=>{try{const d=await apiFetch('/student/roommates/mine');setMine(d.listings||[])}catch(e){flash(e.message)}}
 useEffect(()=>{setLoading(true);Promise.all([loadBrowse(),loadMine()]).finally(()=>setLoading(false))},[])

 const filtered=listings.filter(p=>`${p.name} ${p.course} ${p.area} ${(p.traits||[]).join(' ')}`.toLowerCase().includes(search.toLowerCase()))

 const createListing=async payload=>{try{await apiFetch('/student/roommates',{method:'POST',body:JSON.stringify(payload)});flash('Your roommate posting is live.');setShowForm(false);await Promise.all([loadBrowse(),loadMine()])}catch(e){flash(e.message)}}
 const closeListing=async id=>{try{await apiFetch(`/student/roommates/${id}`,{method:'DELETE'});flash('Posting closed.');await Promise.all([loadBrowse(),loadMine()])}catch(e){flash(e.message)}}

 return <FeatureSection title="Find a compatible roommate" eyebrow="Roommate Finder" subtitle="Already have a place and need someone to split it with? Post your own listing, or browse and reach out to others.">
   <div className="feature-toolbar">
     <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by area, course or preference..." disabled={view!=='browse'}/>
     <button className="btn btn-outline-ink" onClick={()=>setView(v=>v==='browse'?'mine':'browse')}>{view==='browse'?`My postings (${mine.length})`:'Browse listings'}</button>
     <button className="btn btn-primary" onClick={()=>setShowForm(true)}>＋ Post a roommate listing</button>
   </div>
   {loading?<p className="panel-copy">Loading…</p>:view==='browse'?(
     filtered.length?filtered.map(p=><div className="profile-row" key={p.id}>
       <div className="avatar">{p.name.charAt(0)}</div>
       <PostMediaPreview media={p.media}/><div className="profile-main">
         <div className="profile-title"><h3>{p.name}</h3>{p.is_mine&&<span className="mini-badge">Your posting</span>}</div>
         <p>{p.course} · {p.level} · {p.area} · {p.gender_preference==='any'?'Any gender':`Looking for ${p.gender_preference}`}</p>
         <p className="muted">Rent {money(p.rent)} · Split {money(p.split_cost)} · {p.duration}</p>
         {p.description&&<p className="muted">“{p.description}”</p>}
         <div className="chips">{(p.traits||[]).map(t=><span key={t}>{t}</span>)}</div>
       </div>
       {p.is_mine?<span className="status-pill">Your posting</span>:<button className="btn btn-outline-ink" onClick={()=>onContact(p.student_id,`roommate:${p.id}`)}>Contact student</button>}
     </div>):<Empty text="No roommate postings match yet. Be the first to post one!"/>
   ):(
     mine.length?mine.map(p=><div className="profile-row" key={p.id}>
       <div className="avatar">{p.name.charAt(0)}</div>
       <PostMediaPreview media={p.media}/><div className="profile-main">
         <div className="profile-title"><h3>{p.name}'s posting</h3><span className={`status-pill ${p.status==='closed'?'is-closed':''}`}>{p.status}</span></div>
         <p>{p.course} · {p.level} · {p.area} · Rent {money(p.rent)} · Split {money(p.split_cost)}</p>
         {p.interests?.length?<div className="interest-list"><strong>{p.interests.length} student{p.interests.length>1?'s':''} interested:</strong>{p.interests.map(i=><div className="interest-row" key={i.id}><span><strong>{i.name}</strong> · {i.level} · Age {i.age}{i.message&&<small className="interest-message">{i.message}</small>}</span><span><a href={`tel:${i.phone}`}>{i.phone}</a> <button className="text-button inline-reply" onClick={async()=>{const response=window.prompt('Write a response to this student:');if(!response)return;try{await apiFetch(`/student/roommates/interests/${i.id}/respond`,{method:'PATCH',body:JSON.stringify({response})});flash('Response sent.');loadMine()}catch(e){flash(e.message)}}}>Reply</button></span></div>)}</div>:<p className="muted">Interested students can now message you directly — check your Messages tab.</p>}
       </div>
       {p.status==='active'&&<button className="text-button" onClick={()=>closeListing(p.id)}>Close posting</button>}
     </div>):<Empty text="You haven't posted a roommate listing yet."/>
   )}
   {showForm&&<RoommateForm traitOptions={traitOptions} onClose={()=>setShowForm(false)} onSubmit={createListing}/>}
 </FeatureSection>
}

function PostMediaPreview({media}){
 const first=(Array.isArray(media)?media:[]).find(m=>m?.url)||null; if(!first)return null; const src=mediaUrl(first); const fallback=e=>{if(e.currentTarget.dataset.fallbackApplied)return;e.currentTarget.dataset.fallbackApplied='true';e.currentTarget.src='/placeholder.svg'}; return <div className="post-media-preview">{first.type==='video'?<video src={src} controls onError={fallback}/>:<img src={src} alt="Takeover listing" onError={fallback}/>}</div>
}

function StudentMediaPicker({media,setMedia,flash}){
 const [busy,setBusy]=useState(false); const [error,setError]=useState(''); const ref=useRef();
 const src = mediaUrl
 const pick=async e=>{const files=Array.from(e.target.files||[]);if(!files.length)return;const localMedia=files.map((file,index)=>({url:URL.createObjectURL(file),type:file.type.startsWith('video/')?'video':'image',localId:`${Date.now()}-${index}`}));setBusy(true);setError('');setMedia(v=>[...v,...localMedia]);try{const fd=new FormData();files.forEach(f=>fd.append('media',f));const d=await apiFetch('/student/media',{method:'POST',body:fd});setMedia(v=>[...v.filter(item=>!localMedia.some(local=>local.localId===item.localId)),...(d.media||[])]);localMedia.forEach(item=>URL.revokeObjectURL(item.url));flash(d.message)}catch(err){setError(err.message)}finally{setBusy(false);e.target.value=''}}
 return <div className="student-media-picker"><div className="student-media-head"><div><strong>Property images & walkthrough video</strong><small>Add clear photos and, if useful, a short walkthrough video.</small></div><button type="button" className="btn btn-outline-ink" onClick={()=>ref.current?.click()} disabled={busy}>{busy?'Uploading…':'＋ Add media'}</button></div><input ref={ref} hidden type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" multiple onChange={pick}/>{error&&<small className="upload-error">{error}</small>}{media.length?<div className="student-media-grid">{media.map((m,i)=><div className="student-media-item" key={`${m.url}-${i}`}>{m.type==='video'?<video src={src(m.url)} controls/>:<img src={src(m.url)} alt={`Post ${i+1}`} onError={e=>{if(e.currentTarget.dataset.fallbackApplied)return;e.currentTarget.dataset.fallbackApplied='true';e.currentTarget.src='/placeholder.svg'}}/>}<button type="button" onClick={()=>setMedia(v=>v.filter((_,idx)=>idx!==i))}>×</button></div>)}</div>:<div className="student-media-empty">No media added yet.</div>}</div>
}

function RoommateForm({traitOptions,onClose,onSubmit}){
 const stored=getStoredUser(); const [media,setMedia]=useState([])
 const [form,setForm]=useState({name:stored?.fullName||'',level:'',course:'',area:'',gender_preference:'any',traits:[],description:'',rent:'',split_cost:'',duration:''})
 const toggleTrait=t=>setForm(v=>({...v,traits:v.traits.includes(t)?v.traits.filter(x=>x!==t):[...v.traits,t]}))
 const submit=e=>{e.preventDefault();onSubmit({...form,rent:Number(form.rent),split_cost:Number(form.split_cost),media})}
 return <div className="hub-modal-backdrop" onClick={onClose}><form className="hub-modal" onClick={e=>e.stopPropagation()} onSubmit={submit}>
  <div className="hub-modal-title"><h2>Post a roommate listing</h2><button type="button" onClick={onClose}>×</button></div>
  <label>Your name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></label><label>Level<input value={form.level} onChange={e=>setForm({...form,level:e.target.value})} placeholder="e.g. 300 Level" required/></label><label>Course<input value={form.course} onChange={e=>setForm({...form,course:e.target.value})} required/></label><label>Area<input value={form.area} onChange={e=>setForm({...form,area:e.target.value})} placeholder="e.g. Yelwa" required/></label>
  <label>Roommate gender preference<select value={form.gender_preference} onChange={e=>setForm({...form,gender_preference:e.target.value})}><option value="any">Any</option><option value="male">Male</option><option value="female">Female</option></select></label><div className="hub-field-group"><span>Roommate preference</span><div className="chips selectable">{traitOptions.map(t=><button type="button" key={t} className={form.traits.includes(t)?'selected':''} onClick={()=>toggleTrait(t)}>{t}</button>)}</div></div>
  <label>Anything else you'd like your roommate to know<textarea rows="3" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><label>Full annual rent<input type="number" min="0" value={form.rent} onChange={e=>setForm({...form,rent:e.target.value})} required/></label><label>Their share (split cost)<input type="number" min="0" value={form.split_cost} onChange={e=>setForm({...form,split_cost:e.target.value})} required/></label><label>Duration<input value={form.duration} onChange={e=>setForm({...form,duration:e.target.value})} placeholder="e.g. 1 year, from October" required/></label>
  <StudentMediaPicker media={media} setMedia={setMedia} flash={()=>{}}/><div className="hub-modal-actions"><button type="button" className="btn btn-outline-ink" onClick={onClose}>Cancel</button><button className="btn btn-primary">Post listing</button></div>
 </form></div>
}

function TakeoverBoard({flash,onContact}){
 const [view,setView]=useState('browse')
 const [search,setSearch]=useState('')
 const [listings,setListings]=useState([])
 const [mine,setMine]=useState([])
 const [loading,setLoading]=useState(true)
 const [showForm,setShowForm]=useState(false)

 const loadBrowse=async()=>{try{const d=await apiFetch('/student/takeovers');setListings(d.listings||[])}catch(e){flash(e.message)}}
 const loadMine=async()=>{try{const d=await apiFetch('/student/takeovers/mine');setMine(d.listings||[])}catch(e){flash(e.message)}}
 useEffect(()=>{setLoading(true);Promise.all([loadBrowse(),loadMine()]).finally(()=>setLoading(false))},[])

 const filtered=listings.filter(p=>`${p.title} ${p.area} ${p.reason}`.toLowerCase().includes(search.toLowerCase()))

 const createListing=async payload=>{try{await apiFetch('/student/takeovers',{method:'POST',body:JSON.stringify(payload)});flash('Your takeover posting is live.');setShowForm(false);await Promise.all([loadBrowse(),loadMine()])}catch(e){flash(e.message)}}
 const closeListing=async id=>{try{await apiFetch(`/student/takeovers/${id}`,{method:'DELETE'});flash('Posting closed.');await Promise.all([loadBrowse(),loadMine()])}catch(e){flash(e.message)}}

 return <FeatureSection title="Accommodation takeovers" eyebrow="Takeovers" subtitle="Need someone to take over your room or bedspace? Post it here, or find one to take over before you commit to a new lease.">
   <div className="feature-toolbar">
     <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search takeovers by area or reason..." disabled={view!=='browse'}/>
     <button className="btn btn-outline-ink" onClick={()=>setView(v=>v==='browse'?'mine':'browse')}>{view==='browse'?`My postings (${mine.length})`:'Browse listings'}</button>
     <button className="btn btn-primary" onClick={()=>setShowForm(true)}>＋ Post a takeover</button>
   </div>
   {loading?<p className="panel-copy">Loading…</p>:view==='browse'?(
     filtered.length?filtered.map(p=><div className="takeover-row" key={p.id}>
       <div className="takeover-icon">↗</div>
       <PostMediaPreview media={p.media}/>
       <div className="profile-main">
         <div className="profile-title"><h3>{p.title}</h3>{p.is_mine&&<span className="mini-badge">Your posting</span>}</div>
         <p>{p.area} · Available {p.available_from}</p>{p.months_left!=null&&<p className="muted"><strong>{p.months_left} month{Number(p.months_left)===1?'':'s'} left</strong>{p.amount_required!=null?` · ${money(p.amount_required)} required for the remaining period`:''}</p>}
         <p className="muted">Reason: {p.reason}</p>
         {p.description&&<p className="muted">“{p.description}”</p>}
       </div>
       <div className="takeover-price"><strong>{money(p.price)} / year</strong>{p.is_mine?<span className="status-pill">Your posting</span>:<button className="btn btn-outline-ink" onClick={()=>onContact(p.student_id,`takeover:${p.id}`)}>Contact student</button>}</div>
     </div>):<Empty text="No takeover postings match yet. Be the first to post one!"/>
   ):(
     mine.length?mine.map(p=><div className="takeover-row" key={p.id}>
       <div className="takeover-icon">↗</div>
       <div className="profile-main">
         <div className="profile-title"><h3>{p.title}</h3><span className={`status-pill ${p.status==='closed'?'is-closed':''}`}>{p.status}</span></div>
         <p>{p.area} · {money(p.price)} / year</p>
         {p.contacts?.length?<div className="interest-list"><strong>{p.contacts.length} student{p.contacts.length>1?'s':''} reached out:</strong>{p.contacts.map(c=><div className="interest-row" key={c.id}><span>{c.name}{c.message?` — “${c.message}”`:''}</span><span><a href={`tel:${c.phone}`}>{c.phone}</a> <button className="text-button inline-reply" onClick={async()=>{const response=window.prompt('Write a response to this student:');if(!response)return;try{await apiFetch(`/student/takeovers/contacts/${c.id}/respond`,{method:'PATCH',body:JSON.stringify({response})});flash('Response sent.');loadMine()}catch(e){flash(e.message)}}}>Reply</button></span></div>)}</div>:<p className="muted">Interested students can now message you directly — check your Messages tab.</p>}
       </div>
       {p.status==='active'&&<button className="text-button" onClick={()=>closeListing(p.id)}>Close posting</button>}
     </div>):<Empty text="You haven't posted a takeover yet."/>
   )}
   {showForm&&<TakeoverForm onClose={()=>setShowForm(false)} onSubmit={createListing}/>}
 </FeatureSection>
}

function TakeoverForm({onClose,onSubmit}){
 const [media,setMedia]=useState([]); const [form,setForm]=useState({title:'',area:'',price:'',months_left:'',amount_required:'',reason:'',available_from:'',description:''})
 const submit=e=>{e.preventDefault();onSubmit({...form,price:Number(form.price),months_left:form.months_left===''?null:Number(form.months_left),amount_required:form.amount_required===''?null:Number(form.amount_required),media})}
 return <div className="hub-modal-backdrop" onClick={onClose}><form className="hub-modal" onClick={e=>e.stopPropagation()} onSubmit={submit}>
  <div className="hub-modal-title"><h2>Post a takeover</h2><button type="button" onClick={onClose}>×</button></div><label>Title<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Take over my Yelwa self-contain" required/></label><label>Area<input value={form.area} onChange={e=>setForm({...form,area:e.target.value})} required/></label><label>Annual rent<input type="number" min="0" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} required/></label><label>Months left on current rent<input type="number" min="0" value={form.months_left} onChange={e=>setForm({...form,months_left:e.target.value})} placeholder="e.g. 6" required/></label><label>Amount required for the remaining duration (₦)<input type="number" min="0" value={form.amount_required} onChange={e=>setForm({...form,amount_required:e.target.value})} placeholder="e.g. 150000" required/></label><label>Reason<input value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} placeholder="e.g. Relocating, Graduating" required/></label><label>Available from<input value={form.available_from} onChange={e=>setForm({...form,available_from:e.target.value})} placeholder="e.g. Available immediately" required/></label><label>Additional details<textarea rows="3" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><StudentMediaPicker media={media} setMedia={setMedia} flash={()=>{}}/><div className="hub-modal-actions"><button type="button" className="btn btn-outline-ink" onClick={onClose}>Cancel</button><button className="btn btn-primary">Post takeover</button></div>
 </form></div>
}

export default StudentHub
