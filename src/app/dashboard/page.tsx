// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import SingleThoughtDisplayCard from "./components/SingleThoughtDisplayCard";
import { supabase } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js'; // For Supabase user type

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

interface UserData {
  name: string | null;
  username: string | null;
  profile_image_url: string | null;
  // bookmarked_thought_ids?: string[]; // Not needed here as we fetch separately
}

interface FetchedThoughtFromSupabase {
  id: string;
  content: string;
  created_at: string;
  users: UserData | UserData[] | null;
}

// SuggestedUser interface (if you uncomment the "Who to follow" section)
// interface SuggestedUser {
//   name: string;
//   username: string;
//   avatar: string;
//   bio: string;
// }

export default function DashboardPage() {
  const [thoughts, setThoughts] = useState<DisplayThought[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [bookmarkedThoughtIds, setBookmarkedThoughtIds] = useState<Set<string>>(new Set());

  // Fetch current user and their bookmarks
  const fetchUserAndBookmarks = useCallback(async (user: SupabaseUser | null) => {
    if (user) {
      setCurrentUser(user);
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('bookmarked_thought_ids')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error("Error fetching user bookmarks:", userError);
      } else if (userData?.bookmarked_thought_ids) {
        setBookmarkedThoughtIds(new Set(userData.bookmarked_thought_ids));
      } else {
        setBookmarkedThoughtIds(new Set()); // Ensure it's an empty set if no bookmarks
      }
    } else {
      setCurrentUser(null);
      setBookmarkedThoughtIds(new Set());
    }
  }, []); // supabase is stable

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await fetchUserAndBookmarks(session?.user ?? null);
    });

    // Initial fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchUserAndBookmarks(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchUserAndBookmarks]);

  // Fetch thoughts
  useEffect(() => {
    async function fetchExploreThoughts() {
      setIsLoading(true);
      setError(null);

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
        console.error("Error fetching thoughts:", dbError);
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

        const mappedThoughts: DisplayThought[] = data
          .map((itemFromDb): DisplayThought | null => {
            let userForDisplay = defaultUserDisplay;
            let actualUserObject: UserData | null = null;

            if (itemFromDb.users) {
              if (Array.isArray(itemFromDb.users)) {
                if (itemFromDb.users.length > 0) actualUserObject = itemFromDb.users[0];
              } else {
                actualUserObject = itemFromDb.users as UserData;
              }
            }
            
            if (actualUserObject?.name && actualUserObject?.username) {
              userForDisplay = {
                name: actualUserObject.name,
                username: actualUserObject.username,
                avatar: actualUserObject.profile_image_url || defaultUserDisplay.avatar,
              };
            }

            return {
              id: itemFromDb.id as string,
              user: userForDisplay,
              content: itemFromDb.content as string,
              timestamp: new Date(itemFromDb.created_at as string).toLocaleString(),
            };
          })
          .filter((thought): thought is DisplayThought => thought !== null);
        setThoughts(mappedThoughts);
      } else {
        setThoughts([]);
      }
      setIsLoading(false);
    }

    fetchExploreThoughts();
  }, []); // Run once on mount to fetch thoughts

  const handleBookmarkToggle = useCallback(async (thoughtId: string) => {
    if (!currentUser) {
      // Optionally, redirect to login or show a message
      alert("Please log in to bookmark thoughts.");
      return;
    }

    const newBookmarkedIds = new Set(bookmarkedThoughtIds);
    let isNowBookmarked;

    if (newBookmarkedIds.has(thoughtId)) {
      newBookmarkedIds.delete(thoughtId);
      isNowBookmarked = false;
    } else {
      newBookmarkedIds.add(thoughtId);
      isNowBookmarked = true;
    }

    setBookmarkedThoughtIds(newBookmarkedIds); // Optimistic update

    const { error: updateError } = await supabase
      .from('users')
      .update({ bookmarked_thought_ids: Array.from(newBookmarkedIds) })
      .eq('id', currentUser.id);

    if (updateError) {
      console.error("Error updating bookmarks:", updateError);
      // Revert optimistic update on error
      const revertedBookmarks = new Set(bookmarkedThoughtIds);
      if (isNowBookmarked) { 
        revertedBookmarks.delete(thoughtId);
      } else { 
        revertedBookmarks.add(thoughtId);
      }
      setBookmarkedThoughtIds(revertedBookmarks);
      alert("Failed to update bookmark. Please try again.");
    }
  }, [currentUser, bookmarkedThoughtIds]); // supabase client is stable

  // const suggestedUsers: SuggestedUser[] = [ ... ]; // If needed

  return (
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
            <SingleThoughtDisplayCard
              key={thought.id}
              thought={thought}
              isBookmarked={bookmarkedThoughtIds.has(thought.id)}
              onBookmarkToggle={handleBookmarkToggle}
              currentUserId={currentUser?.id}
            />
          ))}
        </div>
      </div>

      {/* "Who to follow" section - uncomment if needed
      <div className="md:col-span-1">
        ...
      </div> 
      */}
    </div>
  );
}