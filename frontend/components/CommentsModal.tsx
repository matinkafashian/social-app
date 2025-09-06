"use client"
import { useEffect, useState } from "react"
export default function CommentsModal({postId, open, onClose, onUpdated}:{postId:number|null, open:boolean, onClose:()=>void, onUpdated?:(postId:number, count:number)=>void}){
  const backend = "/api"
  const [items,setItems]=useState<{id:number,text:string,created_at:string,author:string}[]>([])
  const [text,setText]=useState(""); const [busy,setBusy]=useState(false)
  useEffect(()=>{
    if(!open || !postId) return
    const t = localStorage.getItem("access"); if(!t) return
    fetch(`${backend}/auth/posts/${postId}/comments/`,{ headers:{ Authorization:`Bearer ${t}` } })
      .then(r=>r.json()).then(d=> setItems(d.items || []))
      .catch(err => console.error('Failed to load comments:', err))
  },[open,postId,backend])
  async function send(){
    if(!text.trim() || !postId) return
    setBusy(true)
    const t = localStorage.getItem("access"); if(!t) return
    try {
      const res = await fetch(`${backend}/auth/posts/${postId}/comments/`,{ method:"POST", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${t}` }, body: JSON.stringify({ text }) })
      const data = await res.json().catch(()=>({}))
      if(res.ok){
        setText("")
        const r = await fetch(`${backend}/auth/posts/${postId}/comments/`,{ headers:{ Authorization:`Bearer ${t}` }}).then(x=>x.json())
        setItems(r.items || [])
        if(onUpdated && typeof data.comment_count === 'number') onUpdated(postId, data.comment_count)
      } else {
        console.error('Failed to post comment:', data)
      }
    } catch (err) {
      console.error('Error posting comment:', err)
    }
    setBusy(false)
  }
  if(!open) return null
  return (
    <div className="fixed inset-0 z-50 modal-bg" onClick={onClose}>
      <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col" onClick={(e)=>e.stopPropagation()}>
        <div className="px-4 py-3 border-b font-semibold">Comments</div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.map(c=> (<div key={c.id} className="text-sm"><span className="font-semibold mr-2">{c.author}</span><span>{c.text}</span></div>))}
          {items.length===0 && <div className="text-sm text-gray-500">No comments yet</div>}
        </div>
        <div className="p-3 border-t flex items-center gap-2">
          <input value={text} onChange={e=>setText(e.target.value)} placeholder="Add a comment..." className="flex-1 border rounded-xl px-3 py-2" />
          <button disabled={busy || !text.trim()} onClick={send} className="px-4 py-2 rounded-xl btn-primary disabled:opacity-50">Send</button>
        </div>
      </div>
    </div>
  )
}
