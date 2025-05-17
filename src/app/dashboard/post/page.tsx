"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function PostPage() {
  const [thought, setThought] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!thought.trim()) return

    setIsSubmitting(true)

    // Simulate API call with setTimeout
    setTimeout(() => {
      // In a real app, you would send this to your API
      console.log("Posted thought:", thought)

      // Reset form and redirect
      setThought("")
      setIsSubmitting(false)
      router.push("/dashboard")
    }, 1000)
  }

  const characterLimit = 280
  const remainingCharacters = characterLimit - thought.length

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-white mb-4">Share a thought</h2>

      <div className="bg-[#242424] rounded-lg overflow-hidden">
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <textarea
              placeholder="thoughts"
              value={thought}
              onChange={(e) => setThought(e.target.value)}
              maxLength={characterLimit}
              className="w-full bg-[#2a2a2a] border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-gray-600 min-h-[150px] resize-none"
            />
            <div className="flex justify-between items-center mt-2">
              <span className={`text-sm ${remainingCharacters < 20 ? "text-orange-400" : "text-gray-400"}`}>
                {remainingCharacters} characters remaining
              </span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!thought.trim() || isSubmitting}
              className={`px-4 py-2 rounded-full font-medium ${
                !thought.trim() || isSubmitting
                  ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                  : "bg-white text-black hover:bg-gray-200"
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-black mr-2"></span>
                  Posting...
                </>
              ) : (
                "Post Thought"
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 bg-[#242424] rounded-lg p-4">
        <h3 className="text-white font-medium mb-2">Guidelines</h3>
        <ul className="text-gray-300 text-sm space-y-2">
          <li>• Keep it text-only. No images, videos, or links.</li>
          <li>• Be respectful and thoughtful.</li>
          <li>• Share ideas, not promotions.</li>
          <li>• Remember: others can't reply, but they can follow you for more thoughts.</li>
        </ul>
      </div>
    </div>
  )
}
