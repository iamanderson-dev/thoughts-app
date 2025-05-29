"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client"; // Ensure this path is correct for your project
import Image from "next/image";
import Link from "next/link";

// Helper function to get error messages
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return "An unknown error occurred";
  }
}

interface FollowerUser {
  id: string;
  name: string;
  username: string;
  profile_image_url: string | null;
}

export default function FollowingPage() {
  const [authUser, setAuthUser] = useState<any | null>(null);
  const [followers, setFollowers] = useState<FollowerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  const loadPageData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const { data: { user: currentAuthUser }, error: authError } = await supabase.auth.getUser();
    
    setAuthUser(currentAuthUser); 
    setIsAuthChecked(true);

    if (authError) {
      console.error("Authentication error:", authError.message);
      setError("Could not verify your session. Please try logging in again.");
      setFollowers([]); 
      setLoading(false);
      return;
    }

    if (!currentAuthUser) {
      setFollowers([]); 
      setLoading(false);
      return;
    }

    try {
      const { data: followerRecords, error: followersError } = await supabase
        .from("followers")
        .select("follower_id") 
        .eq("following_id", currentAuthUser.id);

      if (followersError) {
        throw new Error(`Error fetching follower records: ${followersError.message}`);
      }

      if (followerRecords && followerRecords.length > 0) {
        const followerIds = followerRecords.map(record => record.follower_id);

        const { data: followerProfiles, error: profilesError } = await supabase
          .from("users")
          .select("id, name, username, profile_image_url") 
          .in("id", followerIds);

        if (profilesError) {
          throw new Error(`Error fetching follower profiles: ${profilesError.message}`);
        }
        setFollowers(followerProfiles || []);
      } else {
        setFollowers([]);
      }
    } catch (err) {
      console.error("Error loading followers data:", err);
      setError(getErrorMessage(err));
      setFollowers([]); 
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const newAuthUserId = session?.user?.id || null;
        const currentAuthUserId = authUser ? authUser.id : null;

        if (newAuthUserId !== currentAuthUserId) {
             setAuthUser(session?.user || null); // Update authUser state here as well
             loadPageData();
        }
      }
    );
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [loadPageData, authUser]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 text-center">
        <h2 className="text-xl font-semibold text-white mb-6">Your Followers</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto my-4"></div>
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <h2 className="text-xl font-semibold text-white mb-6">Your Followers</h2>
        <div className="bg-red-900 bg-opacity-50 text-red-300 p-4 rounded-md mb-4">
          <p className="font-semibold">An error occurred:</p>
          <p>{error}</p>
        </div>
        <button
          onClick={loadPageData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (isAuthChecked && !authUser) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 text-center">
        <h2 className="text-xl font-semibold text-white mb-6">Your Followers</h2>
        <p className="text-gray-400 mb-4">You need to be logged in to see your followers.</p>
        {/* MODIFIED LINK: Removed legacyBehavior and <a> tag */}
        <Link 
          href="/login" /* Adjust '/login' to your actual login route */
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
            Log In
        </Link>
      </div>
    );
  }
  
  if (authUser && followers.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <h2 className="text-xl font-semibold text-white mb-6">Your Followers</h2>
        <p className="text-gray-400 text-center py-10">No one follows you yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h2 className="text-xl font-semibold text-white mb-6">Your Followers</h2>
      <div className="space-y-4">
        {followers.map((follower) => (
          <div
            key={follower.id}
            className="flex items-center space-x-4 bg-gray-800 p-4 rounded-lg shadow border border-gray-700 hover:bg-gray-700 transition-colors duration-150"
          >
            {/* MODIFIED LINK: Removed legacyBehavior, passHref, and <a> tag */}
            <Link 
              href={`/profile/${follower.username}`}
              className="flex-shrink-0 block" // ClassName moved from <a> to <Link>
            >
              <Image
                src={follower.profile_image_url || `/placeholder.svg?height=48&width=48`}
                alt={`${follower.name}'s avatar`}
                width={48}
                height={48}
                className="rounded-full object-cover"
                unoptimized={!!follower.profile_image_url} 
              />
            </Link>
            <div className="flex-grow">
              {/* MODIFIED LINK: Removed legacyBehavior, passHref, and <a> tag */}
              <Link 
                href={`/profile/${follower.username}`}
                className="group" // ClassName moved from <a> to <Link>
              >
                <p className="text-md font-semibold text-white group-hover:text-blue-400 group-hover:underline">{follower.name}</p>
                <p className="text-sm text-gray-400 group-hover:text-gray-300">@{follower.username}</p>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}