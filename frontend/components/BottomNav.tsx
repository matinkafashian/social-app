"use client"
import { useRouter, usePathname } from "next/navigation"
import { HomeIcon, SearchIcon, UserIcon, Plus } from "@/components/Icons"
import { useRef, useState } from "react"
const backend = "/api"
export default function BottomNav(){
  const r = useRouter()
  const pathname = usePathname() || "/"
  const fileRef = useRef<HTMLInputElement|null>(null)
  const [uploading, setUploading] = useState(false)
  function openCreate(){ r.push("/create") }
  const inactive = "text-gray-300"; const active = "text-white"
  return (
    <nav className="fixed bottom-4 left-0 right-0  z-40">
      <div className="mx-auto max-w-lg h-16 grid grid-cols-4 place-items-center rounded-2xl border border-white/10 bg-black/50 backdrop-blur-md shadow-lg px-4">
        <button onClick={()=>r.push("/my")} className={"relative p-2 " + (pathname.startsWith("/my")?active:inactive)} aria-label="My posts"><HomeIcon/>{pathname.startsWith("/my")&&<span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white"></span>}</button>
        <button onClick={openCreate} className={"relative p-2 " + (pathname.startsWith("/create")?active:inactive)} aria-label="Create post">
          <Plus/>
          {pathname.startsWith("/create")&&<span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white"></span>}
        </button>
        <button onClick={()=>r.push("/explore")} className={"relative p-2 " + (pathname.startsWith("/explore")?active:inactive)} aria-label="Explore"><SearchIcon/>{pathname.startsWith("/explore")&&<span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white"></span>}</button>
        <button onClick={()=>r.push("/onboarding")} className={"relative p-2 " + (pathname.startsWith("/onboarding")?active:inactive)} aria-label="Edit profile"><UserIcon/>{pathname.startsWith("/onboarding")&&<span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white"></span>}</button>
      </div>
      {/* creation moved to /create page */}
    </nav>
  )
}
