"use client"
import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import BottomNav from "@/components/BottomNav"
import { Close } from "@/components/Icons"
import { getPost, updatePost } from "@/lib/api"

const CATEGORIES = ["Sports","Science","Health","Nature","Politics","Technology"]

export default function EditPostPage(){
  const r = useRouter()
  const params = useParams<{ id:string }>()
  const id = Number(params.id)
  const [loading,setLoading]=useState(true)
  const [caption,setCaption]=useState("")
  const [categories,setCategories]=useState<string[]>([])
  const [image,setImage]=useState<string|null>(null)
  const [saving,setSaving]=useState(false)
  useEffect(()=>{
    const t = localStorage.getItem("access"); if(!t){ r.replace("/login"); return }
    getPost(id).then(data=>{
      setCaption(data.caption||"")
      setCategories(data.categories||[])
      setImage(data.image_url||null)
    }).finally(()=> setLoading(false))
  },[id])
  function toggleCategory(c:string){ setCategories(prev=> prev.includes(c)? prev.filter(x=>x!==c) : (prev.length<6?[...prev,c]:prev)) }
  async function save(){
    setSaving(true)
    try{
      await updatePost(id, { caption: caption.trim(), categories })
      r.back()
    } catch(e:any){ alert(e?.message||"failed") } finally { setSaving(false) }
  }
  if(loading) return <div className="min-h-screen flex items-center justify-center">...</div>
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur border-b">
        <div className="max-w-lg mx-auto h-14 px-4 flex items-center gap-3">
          <button onClick={()=>r.back()} className="p-2" aria-label="Close"><Close/></button>
          <div className="text-sm font-semibold mr-auto">Edit post</div>
          <button onClick={save} disabled={saving} className={(saving?"bg-gray-200 text-gray-500 cursor-not-allowed":"bg-[var(--brand)] text-black") + " px-3 py-1.5 rounded-xl text-sm font-semibold"}>{saving?"Saving…":"Save"}</button>
        </div>
      </header>
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {image && (
          <div className="rounded-2xl overflow-hidden border">
            <img src={image} className="w-full h-auto"/>
          </div>
        )}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Caption</label>
          <textarea value={caption} onChange={e=>setCaption(e.target.value)} rows={3} className="w-full border rounded-xl p-3"/>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Categories (max 6)</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c=> (
              <button key={c} type="button" onClick={()=>toggleCategory(c)} className={(categories.includes(c)?"bg-yellow-500 text-white":"bg-gray-100 text-gray-800")+" px-3 py-1 rounded-full text-sm"}>{c}</button>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <button disabled={saving} onClick={save} className="btn-primary px-4 py-2 rounded-xl">{saving?"Saving...":"Save"}</button>
          <button onClick={()=>r.back()} className="px-4 py-2 rounded-xl border">Cancel</button>
        </div>
      </div>
      <BottomNav/>
    </main>
  )
}


