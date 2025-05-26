"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link" // Make sure this is 'next/link'
import { supabase } from "@/lib/supabase/client";

interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string | null;
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      setSearchResults([])
      setIsSearching(false)
      setSearchError(null);
      return
    }

    setIsSearching(true)
    setSearchError(null);

    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, username, profile_image_url, bio")
        .or(
          `name.ilike.%${searchQuery.trim()}%` +
          `,username.ilike.%${searchQuery.trim()}%`
        )
        .limit(20);

      if (error) {
        console.error("Error searching users:", error)
        setSearchError(`Failed to fetch results: ${error.message}`);
        setSearchResults([])
      } else {
        const results: User[] = data
          ? data.map((dbUser) => ({
              id: dbUser.id,
              name: dbUser.name,
              username: dbUser.username,
              avatar: dbUser.profile_image_url || "/placeholder.svg?height=40&width=40",
              bio: dbUser.bio,
            }))
          : []
        setSearchResults(results)
      }
    } catch (err: any) {
      console.error("An unexpected error occurred during search:", err)
      setSearchError(`An unexpected error occurred: ${err.message || 'Unknown error'}`);
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-white mb-4">Search</h2>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for people by name or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#2a2a2a] border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-gray-600"
          />
          <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white" aria-label="Search">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>
      </form>

      {isSearching ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
          <p className="text-gray-400 mt-2">Searching...</p>
        </div>
      ) : searchError ? (
        <div className="text-center py-8">
          <p className="text-red-400">Error: {searchError}</p>
        </div>
      ) : searchQuery && searchResults.length === 0 && !isSearching ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No results found for "{searchQuery}"</p>
        </div>
      ) : searchQuery && searchResults.length > 0 ? (
        <div className="bg-[#242424] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-white font-medium">Results for "{searchQuery}"</h3>
          </div>
          <div className="p-4">
            {searchResults.map((user) => (
              <div key={user.id} className="flex items-start py-3 border-b border-gray-800 last:border-b-0">
                {/* MODIFIED Link for avatar */}
                <Link href={`/profile/${user.username}`} className="flex-shrink-0">
                  <img
                    src={user.avatar}
                    alt={`${user.name}'s avatar`}
                    className="w-10 h-10 rounded-full mr-3 object-cover"
                    width={40}
                    height={40}
                  />
                </Link>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      {/* MODIFIED Link for name */}
                      <Link href={`/profile/${user.username}`} className="text-white font-medium hover:underline">
                        {user.name}
                      </Link>
                      <p className="text-gray-400 text-sm">@{user.username}</p>
                    </div>
                    <button className="text-sm bg-white text-black px-3 py-1 rounded-full font-medium hover:bg-gray-200">Follow</button>
                  </div>
                  {user.bio && (
                     <p className="text-gray-300 text-sm mt-1 whitespace-pre-line">{user.bio}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}