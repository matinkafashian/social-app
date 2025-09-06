"use client"
import { Close } from "@/components/Icons"
export default function ImageLightbox({src, open, onClose}:{src:string|null, open:boolean, onClose:()=>void}){
  if(!open || !src) return null
  return (
    <div className="fixed inset-0 z-50 modal-bg flex items-center justify-center" onClick={onClose}>
      <div className="absolute top-3 right-3 text-white" onClick={onClose}><Close/></div>
      <img src={src} className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e)=>e.stopPropagation()} />
    </div>
  )
}
