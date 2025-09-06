"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Ellipsis, Bell } from "@/components/Icons"
const backend = "/api"
export default function TopBar({title}:{title:string}){
  const r = useRouter()
  const [q,setQ]=useState(""); const [suggest,setSuggest]=useState<{handle:string,photo_url:string|null}[]>([])
  const [openNotif,setOpenNotif]=useState(false)
  const [notifs,setNotifs]=useState<any[]>([]); const [unread,setUnread]=useState(0)
  const timerRef = useRef<number|undefined>(undefined)
  useEffect(()=>{
    const t = localStorage.getItem("access"); if(!t){ r.replace("/login"); return }
    const load = ()=>{ fetch(`${backend}/auth/notifications`,{ headers:{ Authorization:`Bearer ${t}` } })
      .then(r=>r.json()).then(d=>{ setNotifs(d.items||[]); setUnread(d.unread||0) }) }
    load(); timerRef.current = window.setInterval(load, 60000);
    const wsUrl = (backend||"").replace(/^http/,'ws') + `/ws/notifications?token=${t}`
    try{
      const ws = new WebSocket(wsUrl)
      ws.onmessage = (ev)=>{
        try{
          const m = JSON.parse(ev.data)
          if(m?.type==="notification" && m.item){ setNotifs(p=>[m.item, ...p]); setUnread(u=>u+1) }
        }catch(_){}
      }
    }catch(_){}
    return ()=>{ if(timerRef.current) window.clearInterval(timerRef.current) }
  },[r])
  async function markAllRead(){
    const t = localStorage.getItem("access"); if(!t) return
    await fetch(`${backend}/auth/notifications/read-all`,{ method:"POST", headers:{ Authorization:`Bearer ${t}` } })
    setUnread(0); setNotifs(prev=> prev.map(n=> ({...n, is_read:true})))
  }
  async function onSearchChange(v:string){
    setQ(v); const t = localStorage.getItem("access"); if(!t) return
    if(!v){ setSuggest([]); return }
    const data = await fetch(`${backend}/auth/search-users?q=${encodeURIComponent(v)}`, { headers:{ Authorization:`Bearer ${t}` } }).then(r=>r.json())
    setSuggest(data.items || [])
  }
  function toggleNotif(){
    setOpenNotif(v=>{
      const nv = !v; if(nv){
        const t = localStorage.getItem("access"); if(!t) return nv
        fetch(`${backend}/auth/notifications`,{ headers:{ Authorization:`Bearer ${t}` } })
          .then(r=>r.json()).then(d=>{ setNotifs(d.items||[]); setUnread(d.unread||0) })
      }
      return nv
    })
  }
  return (
    <header className="sticky top-0 z-20 bg-white/70 backdrop-blur border-b">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
        <div className="text-sm font-semibold mr-auto">{title}</div>
        <div className="relative flex-1 max-w-sm mr-3">
          <input value={q} onChange={e=>onSearchChange(e.target.value)} placeholder="Search users" className="w-full border rounded-xl px-3 py-2"/>
          {suggest.length>0 && (
            <div className="absolute mt-1 w-full bg-white border rounded-xl shadow z-30 max-h-64 overflow-y-auto">
              {suggest.map(item=> (
                <button key={item.handle} onClick={()=>{ setSuggest([]); setQ(""); r.push(`/u/${encodeURIComponent(item.handle)}`) }}
                        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 text-left">
                  <img src={item.photo_url || "/avatar-placeholder.svg"} className="w-6 h-6 rounded-full object-cover"/>
                  <span className="text-sm">{item.handle}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <button onClick={toggleNotif} className="p-2" aria-label="Notifications"><Bell/></button>
          {unread>0 && <span className="absolute right-2 top-2 block w-2.5 h-2.5 rounded-full bg-red-500"/>}
          {openNotif && (<>
            <div className="fixed inset-0 z-20" onClick={()=>setOpenNotif(false)} />
            <div className="absolute right-0 mt-2 w-80 bg-white border rounded-xl shadow-xl z-30 overflow-hidden">
              <div className="px-3 py-2 flex items-center justify-between border-b">
                <div className="font-semibold text-sm">Notifications</div>
                <button onClick={markAllRead} className="text-xs text-gray-600 hover:text-gray-900">Mark all read</button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifs.length===0 && <div className="p-3 text-sm text-gray-500">No notifications</div>}
                {notifs.map((n:any)=> (
                  <div key={n.id} className="p-3 flex items-center gap-3 border-b last:border-0 bg-white">
                    <img src={n.actor_avatar || "/avatar-placeholder.svg"} className="w-8 h-8 rounded-full object-cover"/>
                    <div className="text-sm flex-1">
                      <span className="font-semibold">{n.actor_handle}</span>{" "}{n.type==="like"?"liked your post":"commented on your post"}
                    </div>
                    {n.post_image && <img src={n.post_image} className="w-10 h-10 object-cover rounded"/>}
                    {!n.is_read && <span className="w-2 h-2 bg-red-500 rounded-full"/>}
                  </div>
                ))}
              </div>
            </div>
          </>)}
        </div>
        <a href="/onboarding" className="p-2" aria-label="Edit profile"><Ellipsis/></a>
      </div>
    </header>
  )
}
