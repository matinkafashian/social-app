"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import BottomNav from "@/components/BottomNav"
import TopBar from "@/components/TopBar"
import ImageLightbox from "@/components/ImageLightbox"
import CommentsModal from "@/components/CommentsModal"

const backend = process.env.NEXT_PUBLIC_BACKEND_URL as string
type Post = { id:number; image_url:string; likes_count:number; comment_count:number }

export default function UserProfile(){
  const r = useRouter()
  const params = useParams() as { handle?: string }
  const handle = params?.handle || ""
  const [info,setInfo]=useState<{handle:string, photo_url:string|null, is_me:boolean, followers?:number, following?:number, is_following?:boolean, bio?:string, categories?:string[], city?:string, age?:number}|null>(null)
  const [posts,setPosts]=useState<Post[]>([])
  const [activeTab, setActiveTab] = useState<'posts'|'saved'>('posts')
  const [loading,setLoading]=useState(true)
  const [lightbox,setLightbox]=useState<{src:string|null, open:boolean}>({src:null, open:false})
  const [cm,setCm]=useState<{open:boolean, postId:number|null}>({open:false, postId:null})

  useEffect(()=>{
    const t = localStorage.getItem("access"); if(!t){ r.replace("/login"); return }
    Promise.all([
      fetch(`${backend}/api/auth/users/${encodeURIComponent(handle)}/`,{ headers:{ Authorization:`Bearer ${t}` } }).then(res=>res.json()),
      fetch(`${backend}/api/auth/users/${encodeURIComponent(handle)}/posts/`,{ headers:{ Authorization:`Bearer ${t}` } }).then(res=>res.json())
    ]).then(([i,p])=>{ if(i && i.handle){ setInfo(i); setPosts(p||[]) } else { r.replace("/feed") }}).finally(()=> setLoading(false))
  },[r,handle])

  if(loading) return <div className="min-h-screen flex items-center justify-center">...</div>
  if(!info) return null

  const postsCount = posts.length
  const followers = info?.followers ?? 0
  const following = info?.following ?? 0

  return (
    <main className="min-h-screen max-w-4xl mx-auto pb-24">
      <TopBar title={info.handle}/>

      <section className="px-4 pt-4">
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-yellow-200 bg-gray-100">
            <img src={info.photo_url || "/avatar-placeholder.svg"} className="w-full h-full object-cover"/>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-semibold">{info.handle}</h1>
              {info.is_me ? (
                <a href="/onboarding" className="px-3 py-1.5 rounded-lg border text-sm">Edit profile</a>
              ) : (
                <>
                  <button
                    onClick={async ()=>{
                      const t = localStorage.getItem("access"); if(!t || !info) return
                      setInfo(prev=> prev? {...prev, is_following: !prev.is_following, followers: (prev.followers||0) + (prev.is_following?-1:1) } : prev)
                      try{
                        const res = await fetch(`${backend}/api/auth/users/${encodeURIComponent(handle)}/follow/`, { method:"POST", headers:{ Authorization:`Bearer ${t}` }})
                        const data = await res.json().catch(()=>({}))
                        if(res.ok){
                          setInfo(prev=> prev? {
                            ...prev,
                            is_following: (data as any).did_follow ?? prev.is_following,
                            // only the viewed user's followers count should change here
                            followers: (data as any).followers ?? prev.followers
                          } : prev)
                        }
                      }catch{}
                    }}
                    className={"px-4 py-2 rounded-lg text-sm "+(info?.is_following?"border bg-white":"")}
                    style={!info?.is_following?{background:"#FFC947"}:{}}
                  >
                    {info?.is_following?"Following":"Follow"}
                  </button>
                  
                </>
              )}
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
              <div className="font-medium">{info.handle}</div>
              {info.bio && (
                <div className="text-gray-700 mt-1">
                  {info.bio}
                </div>
              )}
              {info.categories && info.categories.length > 0 && (
                <ul className="text-gray-700 space-y-0.5 mt-1">
                  {info.categories.map((category, index) => (
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
              </div>
            ))}
            {posts.length===0 && <div className="text-sm text-gray-500">No posts yet</div>}
          </div>
        )}

        {activeTab==='saved' && (
          <div className="py-10 text-center text-gray-500 text-sm">Saved posts not available</div>
        )}

        <div className="flex justify-center py-6">
          <button className="px-4 py-2 rounded-lg border text-sm">Load More Posts</button>
        </div>
      </section>

      <BottomNav/>
      <ImageLightbox src={lightbox.src} open={lightbox.open} onClose={()=>setLightbox({src:null, open:false})} />
      <CommentsModal postId={cm.postId} open={cm.open} onClose={()=>setCm({open:false, postId:null})} onUpdated={(postId,count)=>setPosts(prev=>prev.map(x=>x.id===postId?{...x,comment_count:count}:x))} />
    </main>
  )
}
