"use client"

import type React from "react"
import ThoughtCard from "../dashboard/components/Thoughtscard"

export default function ProfilePage() {
  // Sample data - in a real app, this would come from your API
  const user = {
    name: "Alex Johnson",
    username: "alexj",
    avatar: "/placeholder.svg?height=100&width=100",
    bio: "Product designer and developer. Thinking about interfaces, user experiences, and how we interact with technology.",
    followersCount: 245,
    followingCount: 183,
    thoughtsCount: 127,
    joinedDate: "January 2023",
  }

  const thoughts = [
    {
      id: "1",
      user: {
        name: user.name,
        username: user.username,
        avatar: user.avatar,
      },
      content: "The best ideas come from constraints. Limiting your options forces creativity in unexpected ways.",
      timestamp: "2 hours ago",
    },
    {
      id: "2",
      user: {
        name: user.name,
        username: user.username,
        avatar: user.avatar,
      },
      content:
        "Just realized that the most valuable skill in tech isn't coding—it's clear communication. No amount of technical brilliance can overcome poor communication.",
      timestamp: "1 day ago",
    },
    {
      id: "3",
      user: {
        name: user.name,
        username: user.username,
        avatar: user.avatar,
      },
      content:
        "Reading 'Thinking, Fast and Slow' and it's changing how I approach product decisions. We need to be more aware of our cognitive biases.",
      timestamp: "2 days ago",
    },
  ]

  // Function to open the thought modal
  const openThoughtModal = (e: React.MouseEvent) => {
    e.preventDefault()
    // Use a small timeout to ensure event listeners are ready
    setTimeout(() => {
      const event = new CustomEvent("open-thought-modal")
      document.dispatchEvent(event)
    }, 10)
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="flex items-start">
              <img src={user.avatar || "/placeholder.svg"} alt={user.name} className="w-20 h-20 rounded-full mr-6" />
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                <p className="text-gray-400">@{user.username}</p>
                <p className="text-gray-300 mt-2">{user.bio}</p>

                <div className="flex items-center mt-4 space-x-4 text-sm">
                  <div>
                    <span className="font-bold text-white">{user.followersCount}</span>{" "}
                    <span className="text-gray-400">Followers</span>
                  </div>
                  <div>
                    <span className="font-bold text-white">{user.followingCount}</span>{" "}
                    <span className="text-gray-400">Following</span>
                  </div>
                  <div>
                    <span className="font-bold text-white">{user.thoughtsCount}</span>{" "}
                    <span className="text-gray-400">Thoughts</span>
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-400">Joined {user.joinedDate}</div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={openThoughtModal}
                className="bg-white text-black px-4 py-2 rounded-full font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Share a thought
              </button>
            </div>
          </div>

          <div className="border-b border-gray-800 mb-6"></div>

          <div className="space-y-4">
            {thoughts.map((thought) => (
              <ThoughtCard key={thought.id} thought={thought} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
