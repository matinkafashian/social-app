const backend = process.env.NEXT_PUBLIC_BACKEND_URL as string

export async function toggleLike(postId: number) {
  const token = localStorage.getItem("access")
  const r = await fetch(`${backend}/api/posts/${postId}/like/`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
  if (!r.ok) throw new Error("like failed")
  return r.json()
}

export async function createPost(image: File, caption?: string, categories?: string[]) {
  const token = localStorage.getItem("access")
  if (!token) throw new Error("not authenticated")
  
  const form = new FormData()
  form.append("image", image)
  if (caption) form.append("caption", caption)
  if (categories && categories.length > 0) {
    form.append("categories", JSON.stringify(categories))
  }
  
  const r = await fetch(`${backend}/api/auth/posts/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form
  })
  if (!r.ok) throw new Error("post creation failed")
  return r.json()
}

export async function updateProfile(profileData: {
  handle?: string
  city?: string
  categories?: string[]
  bio?: string
  age?: number
}) {
  const token = localStorage.getItem("access")
  if (!token) throw new Error("not authenticated")
  
  const r = await fetch(`${backend}/api/auth/profile/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(profileData)
  })
  if (!r.ok) {
    const errorData = await r.json().catch(() => ({}))
    throw new Error(errorData.detail || `save failed (${r.status})`)
  }
  return r.json()
}

export async function fetchCategoryPosts(category: string, offset = 0, limit = 20){
  const token = localStorage.getItem("access")
  if (!token) throw new Error("not authenticated")
  const r = await fetch(`${backend}/api/auth/categories/${encodeURIComponent(category)}/posts/?offset=${offset}&limit=${limit}`,{
    headers:{ Authorization:`Bearer ${token}` }
  })
  if(!r.ok) throw new Error("failed to load category posts")
  return r.json() as Promise<{ items: any[]; next_offset: number|null }>
}

export async function getPost(postId:number){
  const token = localStorage.getItem("access")
  if (!token) throw new Error("not authenticated")
  const r = await fetch(`${backend}/api/auth/posts/${postId}/`,{ headers:{ Authorization:`Bearer ${token}` } })
  if(!r.ok) throw new Error("failed to load post")
  return r.json()
}

export async function updatePost(postId:number, data:{ caption?:string; categories?:string[] }){
  const token = localStorage.getItem("access")
  if (!token) throw new Error("not authenticated")
  const payload: any = {}
  if(data.caption!==undefined) payload.caption = data.caption
  if(data.categories) payload.categories = data.categories
  const r = await fetch(`${backend}/api/auth/posts/${postId}/`,{
    method:"PUT",
    headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
    body: JSON.stringify(payload)
  })
  if(!r.ok) throw new Error("failed to update post")
  return r.json()
}

export async function deletePost(postId:number){
  const token = localStorage.getItem("access")
  if (!token) throw new Error("not authenticated")
  const r = await fetch(`${backend}/api/auth/posts/${postId}/`,{ method:"DELETE", headers:{ Authorization:`Bearer ${token}` } })
  if(!r.ok) throw new Error("failed to delete post")
  return r.json().catch(()=>({ok:true}))
}

export async function toggleSave(postId:number){
  const token = localStorage.getItem("access")
  if (!token) throw new Error("not authenticated")
  const r = await fetch(`${backend}/api/auth/posts/${postId}/save/`,{ method:"POST", headers:{ Authorization:`Bearer ${token}` } })
  if(!r.ok) throw new Error("save failed")
  return r.json() as Promise<{ saved: boolean }>
}

export async function fetchSaved(){
  const token = localStorage.getItem("access")
  if (!token) throw new Error("not authenticated")
  const r = await fetch(`${backend}/api/auth/saved/`,{ headers:{ Authorization:`Bearer ${token}` } })
  if(!r.ok) throw new Error("failed to load saved posts")
  return r.json()
}