import { Bell, User, Heart, MessageSquare, UserPlus } from "lucide-react"

interface Notification {
  id: string
  type: "follow" | "like" | "mention" | "reply"
  user: {
    name: string
    username: string
    avatar: string
  }
  content?: string
  thoughtId?: string
  timestamp: string
  read: boolean
}

export default function NotificationsPage() {
  // Sample data - in a real app, this would come from your API
  const notifications: Notification[] = [
    {
      id: "1",
      type: "follow",
      user: {
        name: "Emma Wilson",
        username: "emmaw",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      timestamp: "2 minutes ago",
      read: false,
    },
    {
      id: "2",
      type: "like",
      user: {
        name: "David Chen",
        username: "davidc",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      content: "The best ideas come from constraints. Limiting your options forces creativity in unexpected ways.",
      thoughtId: "1",
      timestamp: "1 hour ago",
      read: false,
    },
    {
      id: "3",
      type: "mention",
      user: {
        name: "Olivia Taylor",
        username: "oliviat",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      content: "I agree with what @alexj said about communication being the most valuable skill in tech.",
      thoughtId: "3",
      timestamp: "3 hours ago",
      read: true,
    },
    {
      id: "4",
      type: "follow",
      user: {
        name: "Carlos Rodriguez",
        username: "carlosr",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      timestamp: "1 day ago",
      read: true,
    },
    {
      id: "5",
      type: "like",
      user: {
        name: "Sarah Kim",
        username: "sarahk",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      content: "Reading 'Thinking, Fast and Slow' and it's changing how I approach product decisions.",
      thoughtId: "4",
      timestamp: "2 days ago",
      read: true,
    },
  ]

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "follow":
        return <UserPlus size={16} className="text-blue-400" />
      case "like":
        return <Heart size={16} className="text-red-400" />
      case "mention":
        return <User size={16} className="text-green-400" />
      case "reply":
        return <MessageSquare size={16} className="text-purple-400" />
      default:
        return <Bell size={16} className="text-gray-400" />
    }
  }

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case "follow":
        return <span>started following you</span>
      case "like":
        return <span>liked your thought</span>
      case "mention":
        return <span>mentioned you in a thought</span>
      case "reply":
        return <span>replied to your thought</span>
      default:
        return <span>interacted with you</span>
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-white mb-4">Notifications</h2>

      <div className="bg-[#242424] rounded-lg overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Bell size={32} className="mx-auto mb-4 opacity-50" />
            <p>No notifications yet</p>
            <p className="text-sm mt-2">When someone interacts with you, you'll see it here.</p>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b border-gray-800 last:border-b-0 ${!notification.read ? "bg-[#2a2a2a]" : ""}`}
              >
                <div className="flex items-start">
                  <img
                    src={notification.user.avatar || "/placeholder.svg"}
                    alt={notification.user.name}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="mr-2">{getNotificationIcon(notification.type)}</span>
                      <span className="font-medium text-white">{notification.user.name}</span>
                      <span className="text-gray-400 ml-2">{getNotificationText(notification)}</span>
                      {!notification.read && <span className="ml-2 bg-blue-500 rounded-full w-2 h-2"></span>}
                    </div>
                    {notification.content && (
                      <p className="text-gray-300 text-sm mt-1 pl-6">
                        {notification.content.length > 100
                          ? `${notification.content.substring(0, 100)}...`
                          : notification.content}
                      </p>
                    )}
                    <p className="text-gray-500 text-xs mt-1 pl-6">{notification.timestamp}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
