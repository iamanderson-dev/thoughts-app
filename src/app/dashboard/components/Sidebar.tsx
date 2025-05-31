"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
// Add Bookmark and Menu (for hamburger) to imports
import { Home, Search, Users, FileText, PenSquare, Bell, Bookmark, Menu, X } from "lucide-react"
import { useState, useEffect } from "react"

export default function Sidebar() {
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // Renamed for clarity

  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) {
        setIsSidebarOpen(true) // Keep sidebar open on desktop
      } else {
        setIsSidebarOpen(false) // Ensure sidebar is closed by default on mobile
      }
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  const isActive = (path: string) => {
    // Ensure the new /dashboard/bookmark is also excluded for the main dashboard link
    if (path === "/dashboard") {
      return pathname === path ||
             (pathname.startsWith("/dashboard") &&
              pathname !== "/dashboard/search" &&
              pathname !== "/dashboard/following" &&
              pathname !== "/dashboard/notifications" &&
              pathname !== "/dashboard/bookmarks" && // Original
              pathname !== "/dashboard/bookmark");   // Added new one
    }
    return pathname === path;
  }

  const toggleSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen)
    }
  }

  const handleLinkClick = () => {
    if (isMobile && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
    // If you want to dispatch the event for "Post a thought"
    // and also close the sidebar, you can do it here, or modify the onClick for that specific link
  };


  return (
    <>
      {/* Hamburger Menu Button - Only on Mobile */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-[60] p-2 bg-[#2a2a2a] text-white rounded-md hover:bg-[#3a3a3a] transition-colors"
          aria-label="Toggle navigation menu"
          aria-expanded={isSidebarOpen}
          aria-controls="sidebar-nav"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* Overlay - Only on Mobile when Sidebar is Open */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleSidebar}
        ></div>
      )}

      <div
        id="sidebar-nav" // For ARIA
        className={`fixed inset-y-0 left-0 w-16 bg-[#1a1a1a] border-r border-gray-800 flex flex-col items-center py-6 transition-transform duration-300 z-50 ${
          isMobile && !isSidebarOpen ? "-translate-x-full" : "translate-x-0"
        } ${isMobile ? "pt-16" : ""}`} // Add padding-top on mobile to avoid overlap with hamburger
      >
        <Link href="/dashboard" className="text-white hover:text-gray-300 mb-4" onClick={handleLinkClick}>
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
            onClick={handleLinkClick}
          >
            <Home size={20} />
          </Link>
          <Link
            href="/dashboard/search"
            className={`${isActive("/dashboard/search") ? "text-white" : "text-gray-400"} hover:text-white`}
            title="Search"
            onClick={handleLinkClick}
          >
            <Search size={20} />
          </Link>
          <Link
            href="/dashboard/following"
            className={`${isActive("/dashboard/following") ? "text-white" : "text-gray-400"} hover:text-white`}
            title="Following"
            onClick={handleLinkClick}
          >
            <Users size={20} />
          </Link>
          <Link
            href="/dashboard/bookmark" // Corrected href based on your isActive logic for /dashboard
            className={`${isActive("/dashboard/bookmark") ? "text-white" : "text-gray-400"} hover:text-white`}
            title="Bookmarks"
            onClick={handleLinkClick}
          >
            <Bookmark size={20} />
          </Link>
          <Link
            href="/dashboard/notifications"
            className={`${isActive("/dashboard/notifications") ? "text-white" : "text-gray-400"} hover:text-white relative`}
            title="Notifications"
            onClick={handleLinkClick}
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
              handleLinkClick(); // Also close sidebar
            }}
          >
            <PenSquare size={20} />
          </Link>
        </nav>

        <div className="flex-1"></div> {/* Pushes profile icon to bottom */}

        <div className="mb-6">
          <Link
            href="/profile"
            className={`${isActive("/profile") ? "text-white" : "text-gray-400"} hover:text-white`}
            title="Profile"
            onClick={handleLinkClick}
          >
            <FileText size={20} />
          </Link>
        </div>
      </div>
    </>
  )
}