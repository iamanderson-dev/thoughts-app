// src/app/dashboard/components/SingleThoughtDisplayCard.tsx
import React from 'react';
import Link from 'next/link';
import { Bookmark as BookmarkIcon } from 'lucide-react'; // Import bookmark icon

interface DisplayThought {
  id: string;
  user: {
    name: string;
    username: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
}

interface SingleThoughtDisplayCardProps {
  thought: DisplayThought;
  isBookmarked: boolean;
  onBookmarkToggle: (thoughtId: string) => void;
  currentUserId?: string; // To conditionally show the bookmark icon
}

const SingleThoughtDisplayCard: React.FC<SingleThoughtDisplayCardProps> = ({
  thought,
  isBookmarked,
  onBookmarkToggle,
  currentUserId,
}) => {
  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click or link navigation if icon is on top of other elements
    onBookmarkToggle(thought.id);
  };

  return (
    <div className="bg-[#2c2c2c] p-4 rounded-lg shadow text-white">
      <div className="flex items-start space-x-3">
        <Link href={`/profile/${thought.user.username}`}>
          <img
            src={thought.user.avatar}
            alt={`${thought.user.name}'s avatar`}
            className="w-10 h-10 rounded-full flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between"> {/* For aligning bookmark icon to the right */}
            <div className="flex items-center flex-wrap space-x-1 text-sm mb-1">
              <Link
                href={`/profile/${thought.user.username}`}
                className="font-semibold hover:underline cursor-pointer text-white"
              >
                {thought.user.name}
              </Link>
              <Link
                href={`/profile/${thought.user.username}`}
                className="text-gray-400 hover:underline cursor-pointer"
              >
                @{thought.user.username}
              </Link>
              <span className="text-gray-500 mx-1" aria-hidden="true">·</span>
              <span className="text-gray-400">{thought.timestamp}</span>
            </div>
            {/* Bookmark Icon - Show only if a user is logged in */}
            {currentUserId && (
              <button
                onClick={handleBookmarkClick}
                title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
                className="p-1 rounded-full hover:bg-[#3f3f3f] transition-colors" // Adjusted hover bg
              >
                <BookmarkIcon
                  size={18} // Slightly smaller icon
                  className={`${
                    isBookmarked ? "fill-green-500 text-green-500" : "text-gray-400 hover:text-white"
                  }`}
                />
              </button>
            )}
          </div>
          <p className="text-gray-300 whitespace-pre-wrap break-words mt-1">{thought.content}</p>
        </div>
      </div>
    </div>
  );
};

export default SingleThoughtDisplayCard;