import { useEffect, useState } from 'react'
import { apiFetch, mediaUrl } from '../lib_api.js'
import './ProviderProfile.css'
const media = mediaUrl
export default function ProviderProfile({id}){
 const [data,setData]=useState(null),[error,setError]=useState('');
 useEffect(()=>{if(!id||id==='undefined'||id==='null'){setError('This listing does not have a provider profile.');return}apiFetch(`/properties/provider/${id}`).then(setData).catch(e=>setError(e.message))},[id]);
 if(error)return <main className="provider-profile-page"><div className="provider-profile-card"><h2>{error}</h2><a className="btn btn-primary" href="#accommodation">Back to accommodation</a></div></main>
 if(!data)return <main className="provider-profile-page"><div className="provider-profile-card">Loading provider profile…</div></main>
 const p=data.provider;
 return <main className="provider-profile-page"><div className="container"><a href="#accommodation" className="details-back">← Back to accommodations</a><section className="provider-profile-card"><div className="provider-profile-head"><div className="provider-profile-avatar">{p.name?.charAt(0).toUpperCase()}</div><div><span className="eyebrow">Accommodation provider</span><h1>{p.name}</h1><p>{p.isVerified?'✓ Verified provider':'Provider'} · {data.properties.length} approved listing{data.properties.length===1?'':'s'}</p></div></div><div className="provider-profile-about"><h2>Properties from {p.name}</h2><p>Browse every approved StudentNest property currently listed by this provider.</p></div><div className="provider-property-grid">{data.properties.map(x=>{const imgs=Array.isArray(x.images)?x.images:[];return <a href={`#accommodation-${x.id}`} className="provider-profile-property" key={x.id}><div className="provider-profile-image"><img src={media(imgs[0])} alt={x.title}/><span>✓ Verified</span></div><div><h3>{x.title}</h3><p>{x.area}, {x.city}</p><strong>₦{Number(x.rent||0).toLocaleString()} / year</strong></div></a>})}</div></section></div></main>
}
