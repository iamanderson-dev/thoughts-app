import type { ReactNode } from "react"
import Sidebar from "./components/Sidebar"
import Navbar from "./components/Navbar"
import ThoughtModal from "./components/ThoughtModal"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#1a1a1a] text-white">
      <Sidebar />
      <div className="flex-1 ml-0 md:ml-16">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">{children}</main>
      </div>
      <ThoughtModal />
    </div>
  )
}
