"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import BottomNav from "@/components/BottomNav"
const backend = "/api"
const IRAN_CITIES = ["Tehran","Mashhad","Isfahan","Shiraz","Tabriz","Karaj","Qom","Ahvaz","Kermanshah","Yazd"];
const CATEGORIES = ["Sports","Science","Health","Nature","Politics","Technology"];
export default function Onboarding(){
  const r = useRouter()
  const fileRef = useRef<HTMLInputElement|null>(null)
  const [token,setToken]=useState<string|null>(null)
  const [loading,setLoading]=useState(true)
  const [photoUrl,setPhotoUrl]=useState<string|null>(null)
  const [handle,setHandle]=useState(""); const [city,setCity]=useState<string>("")
  const [categories,setCategories]=useState<string[]>([])
  const [bio,setBio]=useState(""); const [age,setAge]=useState<number | "">("")
  const [available,setAvailable]=useState<boolean|null>(null); const [checking,setChecking]=useState(false)
  const [saving,setSaving]=useState(false); const [error,setError]=useState<string|null>(null)
  useEffect(()=>{
    const t = typeof window!=="undefined"? localStorage.getItem("access"): null
    if(!t){ r.replace("/login"); return }
    setToken(t)
    fetch(`${backend}/auth/profile/`,{ headers:{ Authorization:`Bearer ${t}` } })
      .then(res=>res.json()).then(data=>{
        if(data.photo_url) setPhotoUrl(data.photo_url)
        if(data.handle) setHandle(data.handle)
        if(data.city) setCity(data.city)
        if(data.categories) setCategories(data.categories)
        if(data.bio) setBio(data.bio)
        if(data.age) setAge(data.age)
      }).finally(()=> setLoading(false))
  },[r])
  function selectFile(){ fileRef.current?.click() }
  async function onFile(e:React.ChangeEvent<HTMLInputElement>){
    const f = e.target.files?.[0]; if(!f || !token) return
    try{
      const form = new FormData(); form.append("photo", f)
      const res = await fetch(`${backend}/auth/profile/photo/`,{ method:"POST", headers:{ Authorization:`Bearer ${token}` }, body: form })
      const data = await res.json(); if(!res.ok) throw new Error(data.detail||"upload failed")
      setPhotoUrl(data.photo_url || null)
    } finally { if(fileRef.current) fileRef.current.value = "" }
  }
  async function checkAvailability(v:string){
    if(!v){ setAvailable(null); return }
    setChecking(true)
    try{
      const res = await fetch(`${backend}/auth/username-check/?handle=${encodeURIComponent(v)}`,{ headers:{ Authorization:`Bearer ${token}` || "" }})
      const data = await res.json(); setAvailable(!!data.available)
    } finally { setChecking(false) }
  }
  function toggleCategory(c:string){ setCategories(prev=> prev.includes(c)? prev.filter(x=>x!==c) : (prev.length<6?[...prev,c]:prev)) }
  async function save(){
    if(!handle){ setError("username is required"); return }
    setSaving(true); setError(null)
    try{
      const res = await fetch(`${backend}/auth/profile/`,{ method:"PUT", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` || "" }, body: JSON.stringify({ handle, city, categories, bio, age }) })
      if(!res.ok){ const d = await res.json().catch(()=>({})); throw new Error(d.detail || `save failed (${res.status})`) }
      r.replace("/feed")
    } catch(e:any){ setError(e.message || "save failed") } finally { setSaving(false) }
  }
  function logout(){ localStorage.removeItem("access"); localStorage.removeItem("refresh"); r.replace("/login") }
  if(loading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>
  return (<main className="min-h-screen flex items-center justify-center p-4">
    <div className="w-full max-w-md bg-white rounded-2xl shadow p-6 space-y-6">
      <h1 className="text-xl font-semibold">Edit profile</h1>
      <div className="flex flex-col items-center gap-3">
        <div className="w-28 h-28 rounded-full overflow-hidden ring-2 ring-yellow-300 bg-gray-100">
          <img src={photoUrl || "/avatar-placeholder.svg"} className="w-full h-full object-cover"/>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile}/>
        <button onClick={selectFile} className="px-4 py-2 rounded-xl btn-primary">Edit photo</button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>
      <div className="space-y-2">
        <label className="block text-sm text-gray-600">Username</label>
        <input value={handle} onChange={e=>{ setHandle(e.target.value.toLowerCase()); setAvailable(null) }} onBlur={e=>checkAvailability(e.target.value.toLowerCase())} placeholder="e.g. alex_77" className="w-full border rounded-xl px-4 py-3"/>
        <div className="text-sm h-5">{checking && <span className="text-gray-500">checking...</span>}{available===true && <span className="text-green-600">available</span>}{available===false && <span className="text-red-600">taken</span>}</div>
      </div>
      <div className="space-y-2">
        <label className="block text-sm text-gray-600">City</label>
        <select value={city} onChange={e=>setCity(e.target.value)} className="w-full border rounded-xl px-4 py-3">
          <option value="">Select a city</option>
          {IRAN_CITIES.map(c=> <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <label className="block text-sm text-gray-600">About me</label>
        <textarea value={bio} onChange={e=>setBio(e.target.value)} rows={3} placeholder="Tell something about yourself..." className="w-full border rounded-xl px-4 py-3"/>
      </div>
      <div className="space-y-2">
        <label className="block text-sm text-gray-600">Age</label>
        <input type="number" min={13} max={120} value={age} onChange={e=>setAge(e.target.value?parseInt(e.target.value):"")} placeholder="18" className="w-full border rounded-xl px-4 py-3"/>
      </div>
      <div className="space-y-2">
        <label className="block text-sm text-gray-600">Categories (max 6)</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(c=> (
            <button key={c} type="button" onClick={()=>toggleCategory(c)}
              className={(categories.includes(c)?"bg-yellow-500 text-white":"bg-gray-100 text-gray-800")+" px-3 py-1 rounded-full text-sm"}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <button disabled={saving} onClick={save} className="w-full rounded-xl px-4 py-3 btn-primary">{saving?"Saving...":"Save"}</button>
      <button onClick={logout} className="w-full rounded-xl px-4 py-3 bg-red-600 text-white">Logout</button>
      <p className="text-xs text-gray-500 text-center">Username is required. Photo is optional.</p>
    </div>
    <BottomNav/>
  </main>)
}
