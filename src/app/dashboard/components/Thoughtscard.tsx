import Link from "next/link"

interface User {
  name: string
  username: string
  avatar: string
}

interface Thought {
  id: string
  user: User
  content: string
  timestamp: string
}

interface ThoughtCardProps {
  thought: Thought
}

export default function ThoughtCard({ thought }: ThoughtCardProps) {
  return (
    <div className="bg-[#242424] rounded-lg overflow-hidden">
      <div className="p-4">
        <div className="flex items-start">
          <Link href={`/profile/${thought.user.username}`}>
            <img
              src={thought.user.avatar || "/placeholder.svg"}
              alt={thought.user.name}
              className="w-10 h-10 rounded-full mr-3"
            />
          </Link>
          <div className="flex-1">
            <div className="flex items-center">
              <Link href={`/profile/${thought.user.username}`}>
                <h3 className="font-medium text-white hover:underline">{thought.user.name}</h3>
              </Link>
              <span className="text-gray-400 text-sm ml-2">@{thought.user.username}</span>
              <span className="text-gray-500 text-sm ml-2">·</span>
              <span className="text-gray-500 text-sm ml-2">{thought.timestamp}</span>
            </div>
            <p className="text-gray-200 mt-2">{thought.content}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
