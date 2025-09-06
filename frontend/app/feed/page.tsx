"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import BottomNav from "@/components/BottomNav"
import TopBar from "@/components/TopBar"
import ImageLightbox from "@/components/ImageLightbox"
import ExpandableText from "@/components/ExpandableText"
import CommentsModal from "@/components/CommentsModal"
import { Heart, CommentIcon, Ellipsis, Bookmark } from "@/components/Icons"
import { toggleLike } from "@/lib/api"
const backend = "/api"
type Post = {
  id: number
  image_url: string
  caption: string
  categories?: string[]
  created_at: string
  likes_count: number
  comment_count: number
  is_liked: boolean
  user_handle: string
  user_avatar: string | null
  is_owner: boolean
  is_saved?: boolean
}
export default function Feed(){
  const r = useRouter()
  const [access,setAccess]=useState<string|null>(null)
  const [items,setItems]=useState<Post[]>([]); const [loading,setLoading]=useState(true)
  const [lightbox,setLightbox]=useState<{src:string|null, open:boolean}>({src:null, open:false})
  const [likeBusyById, setLikeBusyById] = useState<Record<number, boolean>>({})
  const [cm,setCm]=useState<{open:boolean, postId:number|null}>({open:false, postId:null})
  const [menuOpenId, setMenuOpenId] = useState<number|null>(null)
  const onSave = async (id:number)=>{
    try{
      const { toggleSave } = await import("@/lib/api")
      setItems(prev=> prev.map(p=> p.id===id? { ...p, is_saved: !p.is_saved }: p))
      const res = await toggleSave(id)
      setItems(prev=> prev.map(p=> p.id===id? { ...p, is_saved: res.saved }: p))
    }catch(_){ setItems(prev=> prev.map(p=> p.id===id? { ...p, is_saved: !p.is_saved }: p)) }
  }

  useEffect(()=>{
    const t = localStorage.getItem("access"); if(!t){ r.replace("/login"); return }
    setAccess(t); fetch(`${backend}/auth/feed/`,{ headers:{ Authorization:`Bearer ${t}` } })
      .then(res=>res.json()).then(setItems).finally(()=> setLoading(false))
  },[r])

  useEffect(()=>{
    const reloader = ()=>{
      const t = localStorage.getItem("access")
      if(!t) return
      fetch(`${backend}/auth/feed/`,{ headers:{ Authorization:`Bearer ${t}` } }).then(res=>res.json()).then(setItems)
    }
    window.addEventListener("post-created", reloader)
    return ()=> window.removeEventListener("post-created", reloader)
  },[])

  const onLike = async (id: number) => {
    if(likeBusyById[id]) return
    setLikeBusyById(prev => ({...prev, [id]: true}))
    const post = items.find(p => p.id === id)
    if (!post) return
    const prev = { liked: post.is_liked, count: post.likes_count }
    setItems(prevItems => prevItems.map(p => 
      p.id === id ? { ...p, is_liked: !p.is_liked, likes_count: p.is_liked ? p.likes_count - 1 : p.likes_count + 1 } : p
    ))
    try {
      await toggleLike(id)
    } catch {
      setItems(prevItems => prevItems.map(p => 
        p.id === id ? { ...p, is_liked: prev.liked, likes_count: prev.count } : p
      ))
    }
    setLikeBusyById(prev => ({...prev, [id]: false}))
  }
  function updateCommentCount(postId:number, count:number){ setItems(prev=> prev.map(p=> p.id===postId? {...p, comment_count:count}:p)) }

  if(loading) return <div className="min-h-screen flex items-center justify-center">...</div>
  return (<main className="min-h-screen flex flex-col">
    <TopBar title="Matin Kafashian app"/>
    <div className="max-w-lg mx-auto w-full pb-24">
      {items.map(p=> (
        <article key={p.id} className="bg-white border-b">
          <div className="flex items-center gap-2 p-3">
            <button onClick={()=>r.push(`/u/${encodeURIComponent(p.user_handle)}`)} className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 ring-1 ring-gray-300">
              <img src={p.user_avatar || "/avatar-placeholder.svg"} className="w-full h-full object-cover" />
            </button>
            <button onClick={()=>r.push(`/u/${encodeURIComponent(p.user_handle)}`)} className="font-semibold text-sm hover:underline text-left">{p.user_handle}</button>
          </div>
          <button onClick={()=>setLightbox({src:p.image_url, open:true})} className="w-full aspect-square bg-gray-100 overflow-hidden">
            <img src={p.image_url} className="w-full h-full object-cover" />
          </button>
          <div className="flex items-center gap-6 px-3 py-2">
            <button onClick={()=>onLike(p.id)} className={"flex items-center gap-1 text-sm " + (p.is_liked?"text-red-600":"text-gray-800")}>
              <Heart filled={p.is_liked}/> {p.likes_count}
            </button>
            <button onClick={()=>setCm({open:true, postId:p.id})} className="flex items-center gap-1 text-sm text-gray-800">
              <CommentIcon/> {p.comment_count}
            </button>
            {!p.is_owner && (
              <button onClick={()=>onSave(p.id)} className="ml-auto text-gray-800"><Bookmark filled={!!(p as any).is_saved}/></button>
            )}
            {p.is_owner && (
              <div className="ml-auto relative">
                <button onClick={()=> setMenuOpenId(prev=> prev===p.id? null : p.id)} className="p-1 rounded hover:bg-gray-100"><Ellipsis/></button>
                {menuOpenId===p.id && (
                  <div className="absolute right-0 mt-1 w-36 bg-white border rounded-lg shadow z-10">
                    <button onClick={()=>{ setMenuOpenId(null); r.push(`/posts/${p.id}/edit`) }} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm">Edit post</button>
                    <button onClick={async()=>{ setMenuOpenId(null); if(confirm("Delete this post?")){ try{ await (await import("@/lib/api")).deletePost(p.id); setItems(prev=>prev.filter(x=>x.id!==p.id)) }catch(e:any){ alert(e?.message||"delete failed") } } }} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm text-red-600">Delete post</button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="px-3 pb-3 text-sm text-gray-800">
            <span onClick={()=>r.push(`/u/${encodeURIComponent(p.user_handle)}`)} className="font-semibold hover:underline cursor-pointer">{p.user_handle}</span>
            {p.caption && (
              <ExpandableText text={" " + p.caption} lines={3} />
            )}
            {p.categories && p.categories.length>0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {p.categories.map((c, idx)=> (
                  <button key={idx} onClick={()=>r.push(`/c/${encodeURIComponent((c || "").toLowerCase())}`)} className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-800 text-xs hover:bg-gray-300">
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
    <BottomNav/>
    <ImageLightbox src={lightbox.src} open={lightbox.open} onClose={()=>setLightbox({src:null, open:false})} />
    <CommentsModal postId={cm.postId} open={cm.open} onClose={()=>setCm({open:false, postId:null})} onUpdated={updateCommentCount} />
  </main>)
}
