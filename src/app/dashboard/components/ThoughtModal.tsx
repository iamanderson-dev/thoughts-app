"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { X } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ThoughtModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [thought, setThought] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handleOpenModal = () => {
      console.log("Modal open event received")
      setIsOpen(true)
      // Focus the textarea after a short delay to ensure the modal is visible
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
        }
      }, 100)
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    // Use direct event listener to ensure it works across components
    document.addEventListener("open-thought-modal", handleOpenModal)
    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("open-thought-modal", handleOpenModal)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!thought.trim()) return

    setIsSubmitting(true)

    // Simulate API call with setTimeout
    setTimeout(() => {
      // In a real app, you would send this to your API
      console.log("Posted thought:", thought)

      // Reset form and close modal
      setThought("")
      setIsSubmitting(false)
      setIsOpen(false)
      router.refresh() // Refresh the page to show the new thought
    }, 1000)
  }

  if (!isOpen) return null

  const characterLimit = 280
  const remainingCharacters = characterLimit - thought.length

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-[#1f1f1f] rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center space-x-2">
            <button className="text-gray-400 hover:text-white">
              <X size={20} onClick={() => setIsOpen(false)} />
            </button>
            <h2 className="text-white font-medium">Quick Thought</h2>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!thought.trim() || isSubmitting}
            className={`px-4 py-1 rounded-full text-sm font-medium ${
              !thought.trim() || isSubmitting
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-white text-black hover:bg-gray-200"
            }`}
          >
            {isSubmitting ? "Posting..." : "Share"}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex-shrink-0"></div>
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                placeholder="thoughts...."
                value={thought}
                onChange={(e) => setThought(e.target.value)}
                maxLength={characterLimit}
                className="w-full bg-transparent border-0 text-white focus:outline-none text-lg resize-none min-h-[150px]"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex justify-end items-center">
            <div className={`text-sm ${remainingCharacters < 20 ? "text-orange-400" : "text-gray-400"}`}>
              {remainingCharacters} characters remaining
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
