"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

const backend = "/api"

export default function Page(){
  const router = useRouter()
  const [email,setEmail]=useState("")
  const [password,setPassword]=useState("")
  const [showPwd,setShowPwd]=useState(false)
  const [error,setError]=useState("")
  const [loading,setLoading]=useState(false)

  async function onSubmit(e:React.FormEvent){
    e.preventDefault(); setError(""); setLoading(true)
    try{
      const res = await fetch(`${backend}/auth/login/`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({email,password})
      })
      const contentType = res.headers.get("content-type") || ""
      const data = contentType.includes("application/json") ? await res.json() : {detail: await res.text()}
      if(!res.ok) throw new Error(data.detail||"Invalid email or password")
      localStorage.setItem("access",data.access); localStorage.setItem("refresh",data.refresh)
      router.push("/feed")
    }catch(err:any){ setError(err.message)} finally{ setLoading(false)}
  }

  function BrandLogo(){
    return (
      <div className="mx-auto mb-4 w-14 h-14 rounded-xl flex items-center justify-center shadow" style={{background:"var(--brand)"}}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-black/80"><path d="M7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h10v2H7v-2z"/></svg>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-pink-50 to-white">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white rounded-2xl shadow p-6 sm:p-8">
        <BrandLogo/>
        <h1 className="text-2xl font-semibold text-center">Welcome Back</h1>
        <p className="text-center text-gray-500 mt-1 mb-6">Connect with friends and share moments</p>

        <h2 className="text-center text-lg font-medium mb-4">Sign in to your account</h2>

        <div className="space-y-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 8.25v7.5a2.25 2.25 0 01-2.25 2.25h-15A2.25 2.25 0 012.25 15.75v-7.5m19.5 0A2.25 2.25 0 0019.5 6H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-6.75 4.05a2.25 2.25 0 01-2.36 0l-6.75-4.05A2.25 2.25 0 012.25 8.493V8.25"/></svg>
            </span>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter your email" className="w-full border rounded-xl pl-10 pr-3 py-3" required />
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0V10.5m-.75 0h10.5A2.25 2.25 0 0119.5 12.75v6A2.25 2.25 0 0117.25 21h-10.5A2.25 2.25 0 014.5 18.75v-6A2.25 2.25 0 016.75 10.5z"/></svg>
            </span>
            <input type={showPwd?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" className="w-full border rounded-xl pl-10 pr-10 py-3" required />
            <button type="button" onClick={()=>setShowPwd(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              {showPwd ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.5 12c1.273 2.79 4.807 6.75 10.5 6.75 1.985 0 3.823-.45 5.445-1.227M6.228 6.228A10.45 10.45 0 0112 5.25c5.693 0 9.227 3.96 10.5 6.75-.512 1.12-1.27 2.297-2.264 3.372M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .638C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              )}
            </button>
          </div>
        </div>

        <div className="mt-2 mb-4 text-right">
          <a href="#" className="text-sm" style={{color:"#E85A7E"}}>Forgot password?</a>
        </div>

        {error && <p className="text-center text-sm" style={{color:"#E85A7E"}}>{error}</p>}

        <button disabled={loading} className="w-full rounded-xl px-4 py-3 mt-3 btn-primary disabled:opacity-60">
          {loading?"Signing in...":"Sign In"}
        </button>

        <p className="text-center text-sm text-gray-600 mt-4">Don't have an account? <a href="/register" className="font-medium" style={{color:"#E85A7E"}}>Sign up</a></p>
      </form>
    </div>
  )
}
