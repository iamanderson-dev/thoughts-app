// src/app/dashboard/bookmarks/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import SingleThoughtDisplayCard from "../components/SingleThoughtDisplayCard"; // Adjust path if your structure differs
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Re-use or import DisplayThought and UserData interfaces
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
}

export default function BookmarksPage() {
  const [bookmarkedThoughts, setBookmarkedThoughts] = useState<DisplayThought[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [currentUserBookmarkedIds, setCurrentUserBookmarkedIds] = useState<Set<string>>(new Set());

  const fetchUserAndBookmarksData = useCallback(async (user: SupabaseUser | null) => {
    if (!user) {
      setCurrentUser(null);
      setBookmarkedThoughts([]);
      setCurrentUserBookmarkedIds(new Set());
      setIsLoading(false);
      return;
    }

    setCurrentUser(user);
    setIsLoading(true);
    setError(null);

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("bookmarked_thought_ids")
      .eq("id", user.id)
      .single();

    if (userError) {
      console.error("Error fetching user's bookmark IDs:", userError);
      setError("Could not load your bookmark preferences.");
      setBookmarkedThoughts([]);
      setCurrentUserBookmarkedIds(new Set());
      setIsLoading(false);
      return;
    }

    const thoughtIds = userData?.bookmarked_thought_ids;
    if (thoughtIds && thoughtIds.length > 0) {
      setCurrentUserBookmarkedIds(new Set(thoughtIds));

      const { data: thoughtsData, error: thoughtsError } = await supabase
        .from("thoughts")
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
        .in("id", thoughtIds)
        .order("created_at", { ascending: false });

      if (thoughtsError) {
        console.error("Error fetching bookmarked thoughts:", thoughtsError);
        setError("Could not load your bookmarked thoughts.");
        setBookmarkedThoughts([]);
      } else if (thoughtsData) {
        const defaultUserDisplay = { name: "Unknown User", username: "unknown", avatar: "/placeholder.svg?height=40&width=40" };
        const mappedThoughts: DisplayThought[] = thoughtsData
          .map((itemFromDb: any): DisplayThought | null => {
            let userForDisplay = defaultUserDisplay;
            if (itemFromDb.users) {
              const actualUserObject: UserData = Array.isArray(itemFromDb.users) ? itemFromDb.users[0] : itemFromDb.users;
              if (actualUserObject?.name && actualUserObject?.username) {
                userForDisplay = {
                  name: actualUserObject.name,
                  username: actualUserObject.username,
                  avatar: actualUserObject.profile_image_url || defaultUserDisplay.avatar,
                };
              }
            }
            return {
              id: itemFromDb.id,
              user: userForDisplay,
              content: itemFromDb.content,
              timestamp: new Date(itemFromDb.created_at).toLocaleString(),
            };
          })
          .filter((thought): thought is DisplayThought => thought !== null);
        setBookmarkedThoughts(mappedThoughts);
      } else {
        setBookmarkedThoughts([]);
      }
    } else {
      setBookmarkedThoughts([]);
      setCurrentUserBookmarkedIds(new Set());
    }
    setIsLoading(false);
  }, []); // supabase is stable

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await fetchUserAndBookmarksData(session?.user ?? null);
    });
     // Initial fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchUserAndBookmarksData(session?.user ?? null);
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchUserAndBookmarksData]);

  const handleBookmarkToggle = useCallback(async (thoughtId: string) => {
    if (!currentUser) return;

    const newBookmarkedIds = new Set(currentUserBookmarkedIds);
    let isNowBookmarked;

    if (newBookmarkedIds.has(thoughtId)) {
      newBookmarkedIds.delete(thoughtId);
      isNowBookmarked = false;
    } else {
      newBookmarkedIds.add(thoughtId);
      isNowBookmarked = true;
    }

    // Optimistic UI Update for this page
    setCurrentUserBookmarkedIds(newBookmarkedIds);
    if (!isNowBookmarked) { // If unbookmarked, remove from the displayed list
      setBookmarkedThoughts(prevThoughts => prevThoughts.filter(t => t.id !== thoughtId));
    }
    // If it was bookmarked (isNowBookmarked = true), it was already on another page.
    // This page will re-fetch if navigated to, or this could be made more complex with global state.

    const { error: updateError } = await supabase
      .from('users')
      .update({ bookmarked_thought_ids: Array.from(newBookmarkedIds) })
      .eq('id', currentUser.id);

    if (updateError) {
      console.error("Error updating bookmarks:", updateError);
      setError("Failed to update bookmark. Please try again.");
      // Revert optimistic UI update (can be complex, might require re-fetching or more detailed state backup)
      // For simplicity, we'll just show an error. The state might be inconsistent until next load.
      // To properly revert, you'd store the previous state of currentUserBookmarkedIds and bookmarkedThoughts.
      await fetchUserAndBookmarksData(currentUser); // Re-fetch to correct state
    }
  }, [currentUser, currentUserBookmarkedIds, fetchUserAndBookmarksData]);


  if (isLoading && !error) { // Show loading only if not errored out already
    return <p className="text-gray-300 p-4 md:p-6">Loading your bookmarks...</p>;
  }

  if (!currentUser && !isLoading) { // After loading, if no user
    return <p className="text-gray-300 p-4 md:p-6">Please log in to see your bookmarks.</p>;
  }
  
  if (error) {
    return <p className="text-red-500 p-4 md:p-6">{error}</p>;
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-semibold text-white mb-6">Your Bookmarks</h1>
      {bookmarkedThoughts.length === 0 ? (
        <p className="text-gray-400">No bookmarks saved.</p>
      ) : (
        <div className="space-y-4">
          {bookmarkedThoughts.map((thought) => (
            <SingleThoughtDisplayCard
              key={thought.id}
              thought={thought}
              isBookmarked={currentUserBookmarkedIds.has(thought.id)} // Should generally be true here
              onBookmarkToggle={handleBookmarkToggle}
              currentUserId={currentUser?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}