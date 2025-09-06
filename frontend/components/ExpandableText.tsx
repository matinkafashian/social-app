"use client"
import React, { useMemo, useState } from "react"

type ExpandableTextProps = {
  text?: string | null
  /** Number of lines to show when collapsed */
  lines?: number
  /** Optional className for the wrapper */
  className?: string
}

export default function ExpandableText({ text, lines = 3, className = "" }: ExpandableTextProps){
  const [expanded, setExpanded] = useState(false)

  const showToggle = useMemo(()=>{
    if(!text) return false
    // heuristic: if text length is large, likely needs clamping -> show toggle
    return text.length > 160
  },[text])

  if(!text) return null

  return (
    <div className={className}>
      <p className={(expanded?"":"line-clamp-"+lines)+" break-anywhere"}>{text}</p>
      {showToggle && (
        <button onClick={()=>setExpanded(v=>!v)} className="text-xs text-gray-500 mt-1 hover:underline">
          {expanded?"See less":"See more"}
        </button>
      )}
    </div>
  )
}


