import ThoughtCard from "./components/Thoughtscard"

export default function DashboardPage() {
  // Sample data - in a real app, this would come from your API
  const thoughts = [
    {
      id: "1",
      user: {
        name: "Alex Johnson",
        username: "alexj",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      content: "The best ideas come from constraints. Limiting your options forces creativity in unexpected ways.",
      timestamp: "2 hours ago",
    },
    {
      id: "2",
      user: {
        name: "Maya Patel",
        username: "mayap",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      content:
        "Thinking about how design systems evolve over time. The best ones grow organically with the product, not in isolation.",
      timestamp: "5 hours ago",
    },
    {
      id: "3",
      user: {
        name: "Carlos Rodriguez",
        username: "carlosr",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      content:
        "Just realized that the most valuable skill in tech isn't coding—it's clear communication. No amount of technical brilliance can overcome poor communication.",
      timestamp: "1 day ago",
    },
    {
      id: "4",
      user: {
        name: "Sarah Kim",
        username: "sarahk",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      content:
        "Reading 'Thinking, Fast and Slow' and it's changing how I approach product decisions. We need to be more aware of our cognitive biases.",
      timestamp: "2 days ago",
    },
  ]

  const suggestedUsers = [
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
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <h2 className="text-xl font-semibold text-white mb-4">Explore Thoughts</h2>
        <div className="space-y-4">
          {thoughts.map((thought) => (
            <ThoughtCard key={thought.id} thought={thought} />
          ))}
        </div>
      </div>

      <div className="md:col-span-1">
        <div className="bg-[#242424] rounded-lg overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-white font-medium">Who to follow</h2>
          </div>
          <div className="p-4">
            {suggestedUsers.map((user) => (
              <div key={user.username} className="flex items-start py-3 border-b border-gray-800 last:border-b-0">
                <img src={user.avatar || "/placeholder.svg"} alt={user.name} className="w-10 h-10 rounded-full mr-3" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">{user.name}</h3>
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
      </div>
    </div>
  )
}
