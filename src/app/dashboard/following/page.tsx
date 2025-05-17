import ThoughtCard from "../components/Thoughtscard"

export default function FollowingPage() {
  // Sample data - in a real app, this would come from your API
  const followingThoughts = [
    {
      id: "1",
      user: {
        name: "Emma Wilson",
        username: "emmaw",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      content:
        "Working on a new design system that focuses on accessibility first. It's challenging but rewarding to think about inclusive design from the start.",
      timestamp: "1 hour ago",
    },
    {
      id: "2",
      user: {
        name: "David Chen",
        username: "davidc",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      content:
        "Just shipped a new feature that's been in the works for months. The key insight was simplifying the mental model for users.",
      timestamp: "3 hours ago",
    },
    {
      id: "3",
      user: {
        name: "Olivia Taylor",
        username: "oliviat",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      content:
        "Reading 'Four Thousand Weeks' by Oliver Burkeman. His perspective on productivity and time management is refreshingly honest.",
      timestamp: "1 day ago",
    },
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-white mb-4">Following</h2>
      <div className="space-y-4">
        {followingThoughts.map((thought) => (
          <ThoughtCard key={thought.id} thought={thought} />
        ))}
      </div>
    </div>
  )
}
