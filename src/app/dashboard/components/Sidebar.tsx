"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
// Add Bookmark to imports
import { Home, Search, Users, FileText, PenSquare, Bell, Bookmark } from "lucide-react"
import { useState, useEffect } from "react"

export default function Sidebar() {
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setIsVisible(!mobile) // Show by default on desktop, hide on mobile
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  const isActive = (path: string) => {
    return pathname === path || (path === "/dashboard" && pathname.startsWith("/dashboard") && pathname !== "/dashboard/search" && pathname !== "/dashboard/following" && pathname !== "/dashboard/notifications" && pathname !== "/dashboard/bookmarks");
  }


  const handleMouseEnter = () => {
    if (isMobile) {
      setIsVisible(true)
    }
  }

  const handleMouseLeave = () => {
    if (isMobile) {
      setIsVisible(false)
    }
  }

  return (
    <>
      {isMobile && !isVisible && (
        <div className="fixed inset-y-0 left-0 w-4 bg-transparent z-40" onMouseEnter={handleMouseEnter}></div>
      )}

      <div
        className={`fixed inset-y-0 left-0 w-16 bg-[#1a1a1a] border-r border-gray-800 flex flex-col items-center py-6 transition-transform duration-300 z-50 ${
          isMobile && !isVisible ? "-translate-x-full" : "translate-x-0"
        }`}
        onMouseLeave={handleMouseLeave}
      >
        <Link href="/dashboard" className="text-white hover:text-gray-300 mb-4"> {/* Added mb-4 for spacing */}
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-black font-bold text-xs">T</span>
          </div>
        </Link>

        <div className="flex-1"></div> {/* Pushes nav items down */}

        <nav className="flex flex-col items-center space-y-6">
          <Link
            href="/dashboard"
            className={`${isActive("/dashboard") ? "text-white" : "text-gray-400"} hover:text-white`}
            title="Explore"
          >
            <Home size={20} />
          </Link>
          <Link
            href="/dashboard/search"
            className={`${isActive("/dashboard/search") ? "text-white" : "text-gray-400"} hover:text-white`}
            title="Search"
          >
            <Search size={20} />
          </Link>
          <Link
            href="/dashboard/following"
            className={`${isActive("/dashboard/following") ? "text-white" : "text-gray-400"} hover:text-white`}
            title="Following"
          >
            <Users size={20} />
          </Link>
          {/* New Bookmark Link */}
          <Link
            href="/dashboard/bookmark"
            className={`${isActive("/dashboard/bookmark") ? "text-white" : "text-gray-400"} hover:text-white`}
            title="Bookmarks"
          >
            <Bookmark size={20} />
          </Link>
          <Link
            href="/dashboard/notifications"
            className={`${isActive("/dashboard/notifications") ? "text-white" : "text-gray-400"} hover:text-white relative`}
            title="Notifications"
          >
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 bg-red-500 rounded-full w-2 h-2"></span>
          </Link>
          <Link
            href="#"
            className="text-gray-400 hover:text-white"
            title="Post a thought"
            onClick={(e) => {
              e.preventDefault()
              document.dispatchEvent(new CustomEvent("open-thought-modal"))
            }}
          >
            <PenSquare size={20} />
          </Link>
        </nav>

        <div className="flex-1"></div> {/* Pushes profile icon to bottom */}

        <div className="mb-6">
          <Link
            href="/profile" // Assuming /profile is the correct path
            className={`${isActive("/profile") ? "text-white" : "text-gray-400"} hover:text-white`}
            title="Profile"
          >
            <FileText size={20} /> {/* Consider UserCircle or similar for profile */}
          </Link>
        </div>
      </div>
    </>
  )
}