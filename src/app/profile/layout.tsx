import type { ReactNode } from "react"
import Sidebar from "../dashboard/components/Sidebar"
import Navbar from "../dashboard/components/Navbar"
import ThoughtModal from "../dashboard/components/ThoughtModal"

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#1a1a1a] text-white">
      <Sidebar />
      <div className="flex-1 ml-0 md:ml-16">
        <Navbar />
        <main>{children}</main>
      </div>
      {/* Ensure ThoughtModal is rendered at the root level */}
      <ThoughtModal />
    </div>
  )
}
