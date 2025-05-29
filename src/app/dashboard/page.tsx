// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import SingleThoughtDisplayCard from "./components/SingleThoughtDisplayCard";
import { supabase } from '@/lib/supabase/client';

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

// Interface for a single user object (consistent structure)
interface UserData {
  name: string | null;
  username: string | null;
  profile_image_url: string | null;
}

// MODIFICATION: 'users' can be a single object, an array, or null
interface FetchedThoughtFromSupabase {
  id: string;
  content: string;
  created_at: string;
  users: UserData | UserData[] | null; // Can be single, array, or null
}

interface SuggestedUser {
  // ... (remains the same)
  name: string;
  username: string;
  avatar: string;
  bio: string;
}

export default function DashboardPage() {
  const [thoughts, setThoughts] = useState<DisplayThought[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const suggestedUsers: SuggestedUser[] = [
    // ... (suggestedUsers data remains the same)
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
  ];

  useEffect(() => {
    async function fetchExploreThoughts() {
      setIsLoading(true);
      setError(null);

      // The 'data' type from this query is what TypeScript is inferring differently
      // from our FetchedThoughtFromSupabase.
      const { data, error: dbError } = await supabase
        .from('thoughts')
        .select(`
          id,
          content,
          created_at,
          users ( 
            name,
            username,
            profile_image_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (dbError) {
        // ... (error handling remains the same)
        if (Object.keys(dbError).length > 0) {
            console.error("Error fetching thoughts for explore page:", JSON.stringify(dbError, null, 2));
        } else {
            console.error("Error fetching thoughts for explore page: Received an empty or non-standard error object.", dbError);
        }
        setError("Could not load thoughts. Please try again later.");
        setThoughts([]);
        setIsLoading(false);
        return;
      }
      
      if (data) {
        const defaultUserDisplay = {
          name: "Unknown User",
          username: "unknown",
          avatar: "/placeholder.svg?height=40&width=40",
        };

        // Let TypeScript infer 'itemFromDb' from 'data' initially, then process
        const mappedThoughts: DisplayThought[] = data
          .map((itemFromDb): DisplayThought | null => { // Let TS infer itemFromDb type for a moment
            // console.log("Processing itemFromDb (raw from Supabase):", JSON.stringify(itemFromDb, null, 2));

            let userForDisplay = defaultUserDisplay;
            let actualUserObject: UserData | null = null;

            // MODIFICATION: Check if itemFromDb.users is an array or single object
            if (itemFromDb.users) {
              if (Array.isArray(itemFromDb.users)) {
                // It's an array, take the first element if it exists
                if (itemFromDb.users.length > 0) {
                  actualUserObject = itemFromDb.users[0];
                }
              } else {
                // It's a single object (as per your runtime log)
                actualUserObject = itemFromDb.users as UserData; // Cast here since TS might still think it's an array
              }
            }
            
            // console.log(`For thought ID ${itemFromDb.id}, actualUserObject:`, JSON.stringify(actualUserObject, null, 2));

            if (
              actualUserObject &&
              typeof actualUserObject.name === 'string' && actualUserObject.name.trim() !== '' &&
              typeof actualUserObject.username === 'string' && actualUserObject.username.trim() !== ''
            ) {
              // console.log(`For thought ID ${itemFromDb.id}, VALID user found:`, actualUserObject.name); 
              userForDisplay = {
                name: actualUserObject.name,
                username: actualUserObject.username,
                avatar: actualUserObject.profile_image_url || "/placeholder.svg?height=40&width=40",
              };
            } else {
              // console.log(`For thought ID ${itemFromDb.id}, user data is null, invalid or incomplete.`);
            }

            return {
              id: itemFromDb.id as string, // Cast if needed, TS might see 'any' from 'data'
              user: userForDisplay,
              content: itemFromDb.content as string, // Cast if needed
              timestamp: new Date(itemFromDb.created_at as string).toLocaleString(), // Cast if needed
            };
          })
          .filter((thought): thought is DisplayThought => thought !== null);

        setThoughts(mappedThoughts);
      } else {
        console.warn("No data returned from Supabase for thoughts, and no explicit error.");
        setThoughts([]);
      }
      setIsLoading(false);
    }

    fetchExploreThoughts();
  }, []);

  return (
    // ... (JSX remains the same)
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 md:p-6">
      <div className="md:col-span-2">
        <h2 className="text-xl font-semibold text-white mb-4">Explore Thoughts</h2>
        {isLoading && <p className="text-gray-300">Loading thoughts...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!isLoading && !error && thoughts.length === 0 && (
          <p className="text-gray-400">No thoughts to explore yet.</p>
        )}
        <div className="space-y-4">
          {thoughts.map((thought) => (
            <SingleThoughtDisplayCard key={thought.id} thought={thought} />
          ))}
        </div>
      </div>

      {/* <div className="md:col-span-1">
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
                    <button className="text-sm bg-white text-black px-3 py-1 rounded-full font-medium hover:bg-gray-200 transition-colors">
                      Follow
                    </button>
                  </div>
                  <p className="text-gray-300 text-sm mt-1">{user.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div> */}
    </div>
  );
}