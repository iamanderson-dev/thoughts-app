"use client"

import { useEffect } from "react"

export default function DebugBoundary({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log("DebugBoundary mounted")
    return () => console.log("DebugBoundary unmounted")
  }, [])

  return (
    <div style={{ border: "2px solid red", padding: "1rem" }}>
      {children}
    </div>
  )
}