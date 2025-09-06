"use client"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import BottomNav from "@/components/BottomNav"
import { Close } from "@/components/Icons"
import { createPost } from "@/lib/api"
const CATEGORIES = ["Sports","Science","Health","Nature","Politics","Technology"]

export default function CreatePost(){
  const r = useRouter()
  const [imageFile, setImageFile] = useState<File|null>(null)
  const [imageUrl, setImageUrl] = useState<string|null>(null)
  const [caption, setCaption] = useState("")
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement|null>(null)
  const [categories, setCategories] = useState<string[]>([])

  useEffect(()=>{
    const t = localStorage.getItem("access"); if(!t){ r.replace("/login"); return }
  },[r])

  useEffect(()=>{
    if(!imageFile){ setImageUrl(null); return }
    const url = URL.createObjectURL(imageFile)
    setImageUrl(url)
    return ()=> URL.revokeObjectURL(url)
  },[imageFile])

  function pickImage(){ fileRef.current?.click() }
  function onFileChange(e:React.ChangeEvent<HTMLInputElement>){ const f = e.target.files?.[0]; if(f) setImageFile(f) }
  function clearImage(){ setImageFile(null); if(fileRef.current) fileRef.current.value = "" }

  const charCount = caption.length
  const canShare = !!imageFile && !busy

  async function onShare(){
    if(!imageFile || busy) return
    setBusy(true)
    try{
      const res = await createPost(imageFile, caption.trim() || undefined, categories)
      try{ window.dispatchEvent(new CustomEvent("post-created")) }catch(_){ }
      r.replace("/feed")
    } catch(e:any){
      alert(e?.message || "Failed to create post")
    } finally { setBusy(false) }
  }
  function toggleCategory(c:string){ setCategories(prev=> prev.includes(c)? prev.filter(x=>x!==c) : (prev.length<6?[...prev,c]:prev)) }

  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
      <header className="sticky top-0 z-20 bg-black/40 backdrop-blur border-b border-white/10">
        <div className="max-w-lg mx-auto h-14 px-4 flex items-center gap-3">
          <button onClick={()=>r.back()} className="p-2" aria-label="Close"><Close/></button>
          <div className="text-sm font-semibold mr-auto">New post</div>
          <button onClick={onShare} disabled={!canShare} className={(canShare?"bg-[var(--brand)] text-black":"bg-white/20 text-white/70 cursor-not-allowed") + " px-3 py-1.5 rounded-xl text-sm font-semibold"}>{busy?"Sharing…":"Share"}</button>
        </div>
      </header>

      <div className="max-w-lg mx-auto w-full px-4 py-4 pb-24">
        {!imageUrl ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-gray-700 to-gray-800 grid place-items-center mb-6">
              <div className="text-white/70 text-sm">Select an image</div>
            </div>
            <button onClick={pickImage} className="btn-primary w-full py-3 rounded-xl font-semibold">Choose from device</button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          </div>
        ) : (
          <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/5">
            <div className="relative">
              <div className="w-full aspect-square bg-black">
                <img src={imageUrl} className="w-full h-full object-cover" />
              </div>
              <button onClick={clearImage} className="absolute top-3 right-3 bg-black/60 backdrop-blur text-white rounded-full px-3 py-1 text-xs">Change</button>
            </div>
            <div className="p-4">
              <textarea value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Write a caption…"
                        rows={3} className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-sm placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"></textarea>
              <div className="mt-2 flex items-center justify-between text-xs text-white/60">
                <div>Caption</div>
                <div>{charCount}/2200</div>
              </div>
              <div className="mt-4">
                <div className="text-xs text-white/70 mb-2">Categories (max 6)</div>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c=> (
                    <button key={c} type="button" onClick={()=>toggleCategory(c)}
                            className={(categories.includes(c)?"bg-yellow-400 text-black":"bg-white/10 text-white")+" border border-white/10 px-3 py-1 rounded-full text-xs"}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button onClick={pickImage} className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl py-2 text-sm">Replace image</button>
                <button onClick={()=>setCaption("")} className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl py-2 text-sm">Clear caption</button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            </div>
          </div>
        )}
      </div>
      <BottomNav/>
    </main>
  )
}



