"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { PenSquare } from "lucide-react"

export default function Navbar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    // Using startsWith for /dashboard but exact match for /dashboard/following
    // to ensure "Explore" is active for /dashboard/* unless it's /dashboard/following
    if (path === "/dashboard") {
      return pathname === "/dashboard" || (pathname?.startsWith("/dashboard/") && !pathname.startsWith("/dashboard/following"));
    }
    return pathname === path || pathname?.startsWith(path) // Original logic for other paths like /dashboard/following
  }

  return (
    <div className="sticky top-0 z-10 bg-[#1a1a1a] border-b border-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/*
            Added pl-12 (3rem) for mobile views to create space for the fixed hamburger menu from Sidebar.
            md:pl-0 removes this extra padding on medium screens and larger, where the hamburger is not present.
            The hamburger's right edge is ~3.5rem from the left (1rem offset + ~2.5rem width).
            The parent div has px-4 (1rem) or sm:px-6 (1.5rem).
            So, "Explore" will start at:
            - Mobile (<sm): 1rem (parent) + 3rem (nav) = 4rem from left.
            - Mobile (sm): 1.5rem (parent) + 3rem (nav) = 4.5rem from left.
            Both clear the 3.5rem hamburger.
          */}
          <nav className="flex space-x-8 pl-12 md:pl-0">
            <Link
              href="/dashboard"
              className={`${
                isActive("/dashboard") ? "text-white" : "text-gray-400"
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

          {/* Mobile post button - only visible on small screens (md:hidden means hidden on medium and up) */}
          <button
            className="md:hidden flex items-center justify-center w-8 h-8 bg-white rounded-full text-black"
            onClick={() => document.dispatchEvent(new CustomEvent("open-thought-modal"))}
            aria-label="Post a thought" // Added aria-label for accessibility
          >
            <PenSquare size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}