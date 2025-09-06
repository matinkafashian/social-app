"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import BottomNav from "@/components/BottomNav"
import TopBar from "@/components/TopBar"
import ImageLightbox from "@/components/ImageLightbox"
import CommentsModal from "@/components/CommentsModal"
import { Ellipsis } from "@/components/Icons"

const backend = process.env.NEXT_PUBLIC_BACKEND_URL as string
type Post = { id:number; image_url:string; likes_count:number; comment_count:number; categories?: string[] }

export default function MyPosts(){
  const r = useRouter()
  const [posts,setPosts]=useState<Post[]>([]); const [loading,setLoading]=useState(true)
  const [profile,setProfile]=useState<{handle:string, photo_url:string|null, bio?:string, followers?:number, following?:number, city?:string, categories?:string[], age?:number}|null>(null)
  const [activeTab, setActiveTab] = useState<'posts'|'saved'>('posts')
  const [saved,setSaved]=useState<any[]>([])
  const [lightbox,setLightbox]=useState<{src:string|null, open:boolean}>({src:null, open:false})
  const [cm,setCm]=useState<{open:boolean, postId:number|null}>({open:false, postId:null})
  const [menuOpenId, setMenuOpenId] = useState<number|null>(null)
  
  useEffect(()=>{ const t = localStorage.getItem("access"); if(!t){ r.replace("/login"); return }
    Promise.all([
      fetch(`${backend}/api/auth/my-posts/`,{ headers:{ Authorization:`Bearer ${t}` } }).then(res=>res.json()),
      fetch(`${backend}/api/auth/profile/`,{ headers:{ Authorization:`Bearer ${t}` } }).then(res=>res.json()),
      fetch(`${backend}/api/auth/saved/`,{ headers:{ Authorization:`Bearer ${t}` } }).then(res=>res.json())
    ]).then(([p,pr,sv])=>{ setPosts(p||[]); setProfile(pr||null); setSaved(sv||[]) }).finally(()=> setLoading(false))
  },[r])
  
  useEffect(()=>{
    const reload = ()=>{
      const t = localStorage.getItem("access"); if(!t) return
      fetch(`${backend}/api/auth/my-posts/`,{ headers:{ Authorization:`Bearer ${t}` } }).then(res=>res.json()).then(setPosts)
    }
    window.addEventListener("post-created", reload)
    return ()=> window.removeEventListener("post-created", reload)
  },[])
  
  if(loading) return <div className="min-h-screen flex items-center justify-center">...</div>
  if(!profile) return null

  const postsCount = posts.length
  const followers = profile?.followers ?? 0
  const following = profile?.following ?? 0

  return (
    <main className="min-h-screen max-w-4xl mx-auto pb-24">
      <TopBar title={profile.handle}/>

      <section className="px-4 pt-4">
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-yellow-200 bg-gray-100">
            <img src={profile.photo_url || "/avatar-placeholder.svg"} className="w-full h-full object-cover"/>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-semibold">{profile.handle}</h1>
              <a href="/onboarding" className="px-3 py-1.5 rounded-lg border text-sm">Edit profile</a>
            </div>
            <div className="grid grid-cols-3 gap-6 max-w-xs mb-2">
              <div className="text-center">
                <div className="font-semibold">{postsCount}</div>
                <div className="text-xs text-gray-600">posts</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{followers.toLocaleString()}</div>
                <div className="text-xs text-gray-600">followers</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{following.toLocaleString()}</div>
                <div className="text-xs text-gray-600">following</div>
              </div>
            </div>
            <div className="mt-2 text-sm">
              <div className="font-medium">{profile.handle}</div>
              {profile.bio && (
                <div className="text-gray-700 mt-1">
                  {profile.bio}
                </div>
              )}
              {profile.categories && profile.categories.length > 0 && (
                <ul className="text-gray-700 space-y-0.5 mt-1">
                  {profile.categories.map((category, index) => (
                    <li key={index}>✨ {category}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 border-t"/>

        <div className="flex items-center justify-center gap-10 text-sm py-2">
          <button onClick={()=>setActiveTab('posts')} className={(activeTab==='posts'?"text-black":"text-gray-500")+" flex items-center gap-2 pb-2 border-b-2 "+(activeTab==='posts'?"border-black":"border-transparent") }>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M3 5.25A2.25 2.25 0 015.25 3h3A2.25 2.25 0 0110.5 5.25v3A2.25 2.25 0 018.25 10.5h-3A2.25 2.25 0 013 8.25v-3zM13.5 5.25A2.25 2.25 0 0115.75 3h3A2.25 2.25 0 0121 5.25v3A2.25 2.25 0 0118.75 10.5h-3a2.25 2.25 0 01-2.25-2.25v-3zM3 15.75A2.25 2.25 0 015.25 13.5h3a2.25 2.25 0 012.25 2.25v3A2.25 2.25 0 018.25 21h-3A2.25 2.25 0 013 18.75v-3zM13.5 15.75a2.25 2.25 0 012.25-2.25h3A2.25 2.25 0 0121 15.75v3A2.25 2.25 0 0118.75 21h-3a2.25 2.25 0 01-2.25-2.25v-3z"/></svg>
            POSTS
          </button>
          <button onClick={()=>setActiveTab('saved')} className={(activeTab==='saved'?"text-black":"text-gray-500")+" flex items-center gap-2 pb-2 border-b-2 "+(activeTab==='saved'?"border-black":"border-transparent") }>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M6.32 2.577A2.25 2.25 0 008.25 1.5h7.5A2.25 2.25 0 0118 3.75v16.06a.75.75 0 01-1.175.618L12 17.21l-4.825 3.218A.75.75 0 016 19.81V3.75c0-.9.575-1.67 1.32-1.173z"/></svg>
            SAVED
          </button>
        </div>

        {activeTab==='posts' && (
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {posts.map(p=> (
              <div key={p.id} className="relative aspect-square bg-gray-100 overflow-hidden rounded-lg border">
                <button className="absolute inset-0" onClick={()=>setLightbox({src:p.image_url, open:true})}>
                  <img src={p.image_url} className="w-full h-full object-cover"/>
                </button>
                <div className="absolute bottom-1 left-1 flex items-center gap-1">
                  <span className="badge">❤ {p.likes_count}</span>
                  <button onClick={()=>setCm({ open:true, postId:p.id })} className="badge">💬 {p.comment_count}</button>
                </div>
                {p.categories && p.categories.length>0 && (
                  <div className="absolute top-1 left-1 right-1 flex flex-wrap gap-1">
                    {p.categories.map((c, idx)=> (
                      <button key={idx} onClick={()=>r.push(`/c/${encodeURIComponent((c || "").toLowerCase())}`)} className="px-1.5 py-0.5 rounded-full bg-black/60 text-white text-[10px] hover:bg-black/70">{c}</button>
                    ))}
                  </div>
                )}
                <div className="absolute top-1 right-1">
                  <div className="relative">
                    <button onClick={()=> setMenuOpenId(prev=> prev===p.id? null : p.id)} className="p-1 rounded bg-white/70 hover:bg-white"><Ellipsis/></button>
                    {menuOpenId===p.id && (
                      <div className="absolute right-0 mt-1 w-36 bg-white border rounded-lg shadow z-10">
                        <button onClick={()=>{ setMenuOpenId(null); r.push(`/posts/${p.id}/edit`) }} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm">Edit post</button>
                        <button onClick={async()=>{ setMenuOpenId(null); if(confirm("Delete this post?")){ try{ await (await import("@/lib/api")).deletePost(p.id); setPosts(prev=>prev.filter(x=>x.id!==p.id)) }catch(e:any){ alert(e?.message||"delete failed") } } }} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm text-red-600">Delete post</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {posts.length===0 && <div className="text-sm text-gray-500">No posts yet</div>}
          </div>
        )}

        {activeTab==='saved' && (
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {saved.map(p=> (
              <div key={p.id} className="relative aspect-square bg-gray-100 overflow-hidden rounded-lg border">
                <button className="absolute inset-0" onClick={()=>setLightbox({src:p.image_url, open:true})}>
                  <img src={p.image_url} className="w-full h-full object-cover"/>
                </button>
              </div>
            ))}
            {saved.length===0 && <div className="text-sm text-gray-500">No saved posts</div>}
          </div>
        )}

        <div className="flex justify-center py-6"></div>
      </section>

      <BottomNav/>
      <ImageLightbox src={lightbox.src} open={lightbox.open} onClose={()=>setLightbox({src:null, open:false})} />
      <CommentsModal postId={cm.postId} open={cm.open} onClose={()=>setCm({open:false, postId:null})} onUpdated={(postId,count)=>setPosts(prev=>prev.map(x=>x.id===postId?{...x,comment_count:count}:x))} />
    </main>
  )
}
