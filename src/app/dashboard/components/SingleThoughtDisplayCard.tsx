// src/app/dashboard/components/SingleThoughtDisplayCard.tsx

import React from 'react';
import Link from 'next/link'; // Import the Link component

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
}

const SingleThoughtDisplayCard: React.FC<SingleThoughtDisplayCardProps> = ({ thought }) => {
  return (
    <div className="bg-[#2c2c2c] p-4 rounded-lg shadow text-white">
      <div className="flex items-start space-x-3">
        {/* User Avatar - Link to profile */}
        <Link href={`/profile/${thought.user.username}`}>
          {/* The Link component itself will render an <a> tag.
              Apply interactive styling to the child if needed, or to the Link via className */}
          <img
            src={thought.user.avatar}
            alt={`${thought.user.name}'s avatar`}
            className="w-10 h-10 rounded-full flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap space-x-1 text-sm mb-1">
            {/* User's Name - Link to profile */}
            <Link
              href={`/profile/${thought.user.username}`}
              className="font-semibold hover:underline cursor-pointer text-white" // Apply styles directly to Link
            >
              {thought.user.name}
            </Link>

            {/* User's Username - Link to profile */}
            <Link
              href={`/profile/${thought.user.username}`}
              className="text-gray-400 hover:underline cursor-pointer" // Apply styles directly to Link
            >
              @{thought.user.username}
            </Link>

            <span className="text-gray-500 mx-1" aria-hidden="true">·</span>
            <span className="text-gray-400">{thought.timestamp}</span>
          </div>
          <p className="text-gray-300 whitespace-pre-wrap break-words">{thought.content}</p>
        </div>
      </div>
      {/* Future interactive elements */}
    </div>
  );
};

export default SingleThoughtDisplayCard;