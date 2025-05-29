"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client";
import type { User as AuthUser } from "@supabase/supabase-js"; // For authUser type

interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string | null;
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null);

  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});
  const [followActionLoading, setFollowActionLoading] = useState<Record<string, boolean>>({});

  // Fetch authenticated user and listen for auth changes
  useEffect(() => {
    const getAuthUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setAuthUser(user);
    };
    getAuthUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Fetch follow status for search results when authUser or searchResults change
  useEffect(() => {
    if (!authUser || searchResults.length === 0) {
      // Clear status if no auth user or no results
      const newStatus: Record<string, boolean> = {};
       searchResults.forEach(u => {
           if (u.id !== authUser?.id) newStatus[u.id] = false;
       });
      setFollowingStatus(newStatus);
      return;
    }

    const checkAllFollowStatus = async () => {
      const newStatusUpdate: Record<string, boolean> = {};
      const promises = searchResults.map(async (user) => {
        if (user.id === authUser.id) return; // Skip self

        try {
          const { data, error } = await supabase
            .from("followers")
            .select("follower_id") // Could be any column, just checking existence
            .eq("follower_id", authUser.id)
            .eq("following_id", user.id)
            .maybeSingle();

          if (error) {
            console.error(`Error checking follow status for ${user.username}:`, error.message);
            newStatusUpdate[user.id] = false; // Default to false on error
          } else {
            newStatusUpdate[user.id] = !!data; // True if a record exists, false otherwise
          }
        } catch (e: any) {
          console.error(`Unexpected error checking follow status for ${user.username}:`, e.message);
          newStatusUpdate[user.id] = false;
        }
      });

      await Promise.all(promises);
      // Merge with previous statuses to maintain status for users not in current check (though unlikely here)
      setFollowingStatus(prevStatus => ({ ...prevStatus, ...newStatusUpdate }));
    };

    checkAllFollowStatus();
  }, [searchResults, authUser]);


  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      setSearchResults([])
      setIsSearching(false)
      setSearchError(null);
      setFollowingStatus({}); // Clear follow status on new search/clear
      return
    }

    setIsSearching(true)
    setSearchError(null);
    setFollowingStatus({}); // Clear follow status on new search

    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, username, profile_image_url, bio")
        .or(
          `name.ilike.%${searchQuery.trim()}%` +
          `,username.ilike.%${searchQuery.trim()}%`
        )
        .limit(20);

      if (error) {
        console.error("Error searching users:", error)
        setSearchError(`Failed to fetch results: ${error.message}`);
        setSearchResults([])
      } else {
        const results: User[] = data
          ? data.map((dbUser) => ({
              id: dbUser.id,
              name: dbUser.name,
              username: dbUser.username,
              avatar: dbUser.profile_image_url || "/placeholder.svg?height=40&width=40",
              bio: dbUser.bio,
            }))
          : []
        setSearchResults(results)
        // The useEffect [searchResults, authUser] will handle fetching follow statuses.
      }
    } catch (err: any) {
      console.error("An unexpected error occurred during search:", err)
      setSearchError(`An unexpected error occurred: ${err.message || 'Unknown error'}`);
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleFollowToggle = useCallback(async (targetUserId: string, targetUsername: string) => {
    if (!authUser) {
      // Ideally, redirect to login or show a modal
      setSearchError("Please log in to follow users.");
      return;
    }
    if (authUser.id === targetUserId) return; // Should not happen if button is hidden for self

    setFollowActionLoading(prev => ({ ...prev, [targetUserId]: true }));
    setSearchError(null); // Clear previous errors

    const currentlyFollowing = followingStatus[targetUserId];

    try {
      if (currentlyFollowing) {
        // Unfollow
        const { error: unfollowError } = await supabase
          .from("followers")
          .delete()
          .match({ follower_id: authUser.id, following_id: targetUserId });

        if (unfollowError) {
          throw new Error(`Error unfollowing @${targetUsername}: ${unfollowError.message}`);
        }
        setFollowingStatus(prev => ({ ...prev, [targetUserId]: false }));
      } else {
        // Follow
        const { error: followError } = await supabase
          .from("followers")
          .insert({ follower_id: authUser.id, following_id: targetUserId });

        if (followError) {
          throw new Error(`Error following @${targetUsername}: ${followError.message}`);
        }
        setFollowingStatus(prev => ({ ...prev, [targetUserId]: true }));
      }
    } catch (err: any) {
      console.error("Follow/Unfollow error:", err);
      setSearchError(err.message || "Failed to update follow status.");
      // Optionally revert optimistic update here if you were doing one
    } finally {
      setFollowActionLoading(prev => ({ ...prev, [targetUserId]: false }));
    }
  }, [authUser, followingStatus, supabase]); // supabase is stable, setSearchError from useState is stable

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-white mb-4">Search</h2>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for people by name or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#2a2a2a] border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-gray-600"
          />
          <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white" aria-label="Search">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>
      </form>

      {isSearching ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
          <p className="text-gray-400 mt-2">Searching...</p>
        </div>
      ) : searchError ? ( // Display general search errors or follow/unfollow errors
        <div className="text-center py-4">
          <p className="text-red-400 bg-red-900 bg-opacity-30 p-3 rounded-md">Error: {searchError}</p>
          <button onClick={() => setSearchError(null)} className="text-xs text-gray-400 underline mt-1">Dismiss</button>
        </div>
      ) : searchQuery && searchResults.length === 0 && !isSearching ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No results found for "{searchQuery}"</p>
        </div>
      ) : searchQuery && searchResults.length > 0 ? (
        <div className="bg-[#242424] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-white font-medium">Results for "{searchQuery}"</h3>
          </div>
          <div className="p-4">
            {searchResults.map((user) => (
              <div key={user.id} className="flex items-start py-3 border-b border-gray-800 last:border-b-0">
                <Link href={`/profile/${user.username}`} className="flex-shrink-0">
                  <img
                    src={user.avatar}
                    alt={`${user.name}'s avatar`}
                    className="w-10 h-10 rounded-full mr-3 object-cover"
                    width={40}
                    height={40}
                  />
                </Link>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <Link href={`/profile/${user.username}`} className="text-white font-medium hover:underline">
                        {user.name}
                      </Link>
                      <p className="text-gray-400 text-sm">@{user.username}</p>
                    </div>
                    {/* Follow/Unfollow Button */}
                    {authUser && authUser.id !== user.id && (
                      <button
                        onClick={() => handleFollowToggle(user.id, user.username)}
                        disabled={followActionLoading[user.id]}
                        className={`text-sm px-3 py-1 rounded-full font-medium transition-colors
                          ${followingStatus[user.id]
                            ? "bg-gray-600 text-white hover:bg-gray-700" // Unfollow style
                            : "bg-white text-black hover:bg-gray-200"    // Follow style
                          }
                          ${followActionLoading[user.id] ? "opacity-50 cursor-not-allowed" : ""}
                        `}
                      >
                        {followActionLoading[user.id]
                          ? "..."
                          : followingStatus[user.id]
                            ? "Unfollow"
                            : "Follow"}
                      </button>
                    )}
                  </div>
                  {user.bio && (
                     <p className="text-gray-300 text-sm mt-1 whitespace-pre-line">{user.bio}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}