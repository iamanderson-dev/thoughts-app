"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { PenSquare } from "lucide-react"

export default function Navbar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path)
  }

  return (
    <div className="sticky top-0 z-10 bg-[#1a1a1a] border-b border-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <nav className="flex space-x-8">
            <Link
              href="/dashboard"
              className={`${
                isActive("/dashboard") && !isActive("/dashboard/following") ? "text-white" : "text-gray-400"
              } hover:text-white px-3 py-2 text-sm font-medium`}
            >
              Explore
            </Link>
            <Link
              href="/dashboard/following"
              className={`${
                isActive("/dashboard/following") ? "text-white" : "text-gray-400"
              } hover:text-white px-3 py-2 text-sm font-medium`}
            >
              Following
            </Link>
          </nav>

          {/* Mobile post button - only visible on small screens */}
          <button
            className="md:hidden flex items-center justify-center w-8 h-8 bg-white rounded-full text-black"
            onClick={() => document.dispatchEvent(new CustomEvent("open-thought-modal"))}
          >
            <PenSquare size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
