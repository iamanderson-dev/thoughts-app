"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"

interface User {
  name: string
  username: string
  avatar: string
  bio: string
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Sample data - in a real app, this would come from your API
  const allUsers: User[] = [
    {
      name: "Emma Wilson",
      username: "emmaw",
      avatar: "/placeholder.svg?height=40&width=40",
      bio: "Product designer. Thinking about interfaces and user experiences.",
    },
    {
      name: "David Chen",
      username: "davidc",
      avatar: "/placeholder.svg?height=40&width=40",
      bio: "Software engineer. Building tools for thought.",
    },
    {
      name: "Olivia Taylor",
      username: "oliviat",
      avatar: "/placeholder.svg?height=40&width=40",
      bio: "Writer and researcher. Exploring ideas at the intersection of tech and society.",
    },
    {
      name: "Alex Johnson",
      username: "alexj",
      avatar: "/placeholder.svg?height=40&width=40",
      bio: "UX researcher. Studying how people interact with technology.",
    },
    {
      name: "Maya Patel",
      username: "mayap",
      avatar: "/placeholder.svg?height=40&width=40",
      bio: "Frontend developer. Crafting beautiful and accessible interfaces.",
    },
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSearching(true)

    // Simulate API call with setTimeout
    setTimeout(() => {
      const results = allUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.bio.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setSearchResults(results)
      setIsSearching(false)
    }, 500)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-white mb-4">Search</h2>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#2a2a2a] border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-gray-600"
          />
          <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
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
      ) : searchQuery && searchResults.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No results found for "{searchQuery}"</p>
        </div>
      ) : searchQuery ? (
        <div className="bg-[#242424] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-white font-medium">Results for "{searchQuery}"</h3>
          </div>
          <div className="p-4">
            {searchResults.map((user) => (
              <div key={user.username} className="flex items-start py-3 border-b border-gray-800 last:border-b-0">
                <Link href={`/profile/${user.username}`}>
                  <img
                    src={user.avatar || "/placeholder.svg"}
                    alt={user.name}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                </Link>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <Link href={`/profile/${user.username}`}>
                        <h3 className="text-white font-medium hover:underline">{user.name}</h3>
                      </Link>
                      <p className="text-gray-400 text-sm">@{user.username}</p>
                    </div>
                    <button className="text-sm bg-white text-black px-3 py-1 rounded-full font-medium">Follow</button>
                  </div>
                  <p className="text-gray-300 text-sm mt-1">{user.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
