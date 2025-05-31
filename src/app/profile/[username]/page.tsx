// ProfilePage.tsx
"use client"

import type React from "react"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import Image from "next/image"
import { FaPencilAlt } from "react-icons/fa"
import Link from "next/link"

// Helper to get error message (keep as is)
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  try {
    return JSON.stringify(error, null, 2)
  } catch {
    return "An unknown error occurred"
  }
}

interface UserProfile {
  id: string
  email?: string
  name: string
  username: string
  profile_image_url: string | null
  bio: string | null
  joined_at: string
}

interface Thought {
  id: string
  content: string
  created_at: string
  user_id: string
}

// Skeleton component for the profile header
const ProfileHeaderSkeleton: React.FC<{ usernameFromParams?: string }> = ({ usernameFromParams }) => {
  return (
    <>
      {/* Mobile Skeleton */}
      <div className="block sm:hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="w-16 h-16 rounded-full bg-gray-700 animate-pulse"></div>
          <div className="w-24 h-10 bg-gray-700 rounded-full animate-pulse"></div>
        </div>
        <div className="space-y-3">
          <div className="h-6 bg-gray-700 rounded w-3/4 animate-pulse"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2 animate-pulse"></div>
          <div className="h-12 bg-gray-700 rounded w-full animate-pulse mt-1"></div> {/* Bio placeholder */}
          <div className="flex items-center gap-4 text-sm">
            <div className="h-4 bg-gray-700 rounded w-20 animate-pulse"></div>
            <div className="h-4 bg-gray-700 rounded w-20 animate-pulse"></div>
            <div className="h-4 bg-gray-700 rounded w-20 animate-pulse"></div>
          </div>
          <div className="h-3 bg-gray-700 rounded w-1/3 animate-pulse mt-1"></div> {/* Joined date placeholder */}
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">Loading profile for @{usernameFromParams || "user"}...</p>
      </div>

      {/* Desktop Skeleton */}
      <div className="hidden sm:flex items-start gap-6">
        <div className="w-20 h-20 rounded-full bg-gray-700 animate-pulse flex-shrink-0"></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="h-7 bg-gray-700 rounded w-1/2 animate-pulse mb-2"></div>
              <div className="h-5 bg-gray-700 rounded w-1/3 animate-pulse mb-3"></div>
              <div className="h-16 bg-gray-700 rounded w-full max-w-lg animate-pulse mb-4"></div> {/* Bio placeholder */}
              <div className="flex items-center gap-6 text-sm">
                <div className="h-4 bg-gray-700 rounded w-24 animate-pulse"></div>
                <div className="h-4 bg-gray-700 rounded w-24 animate-pulse"></div>
                <div className="h-4 bg-gray-700 rounded w-24 animate-pulse"></div>
              </div>
              <div className="h-3 bg-gray-700 rounded w-1/4 animate-pulse mt-4"></div> {/* Joined date placeholder */}
            </div>
            <div className="flex-shrink-0 ml-4">
              <div className="w-32 h-11 bg-gray-700 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-left text-sm text-gray-500 mt-6">Loading profile for @{usernameFromParams || "user"}...</p>
        </div>
      </div>
    </>
  );
};


export default function ProfilePage() {
  const router = useRouter()
  const params = useParams()
  const usernameFromParams = params.username as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [viewedUser, setViewedUser] = useState<UserProfile | null>(null)
  const [authUser, setAuthUser] = useState<any | null>(null)
  const [isOwnProfile, setIsOwnProfile] = useState(false)

  const [thoughtCount, setThoughtCount] = useState(0)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isCurrentlyFollowing, setIsCurrentlyFollowing] = useState(false)
  const [checkingFollowStatus, setCheckingFollowStatus] = useState(false)
  const [followActionLoading, setFollowActionLoading] = useState(false)

  const [newThought, setNewThought] = useState("")
  const [posting, setPosting] = useState(false)

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editUsername, setEditUsername] = useState("")
  const [editBio, setEditBio] = useState("")

  const [thoughts, setThoughts] = useState<Thought[]>([])

  const isMountedRef = useRef(true)

  const fetchProfileData = useCallback(
    async (usernameToFetch: string) => {
      if (!isMountedRef.current) return;

      try {
        const { data: profileData, error: profileError } = await supabase
          .from("users")
          .select("id, name, username, profile_image_url, bio, joined_at")
          .eq("username", usernameToFetch)
          .single();

        if (profileError) {
          if (profileError.code === "PGRST116") throw new Error(`User @${usernameToFetch} not found.`);
          throw new Error(`Error fetching profile: ${profileError.message}`);
        }
        if (!profileData) {
          throw new Error(`User @${usernameToFetch} not found.`);
        }

        if (isMountedRef.current) {
          setViewedUser(profileData as UserProfile);

          const { data: userThoughts, error: thoughtsError } = await supabase
            .from("thoughts")
            .select("*")
            .eq("user_id", profileData.id)
            .order("created_at", { ascending: false });

          if (thoughtsError) throw new Error(`Thoughts fetch error: ${thoughtsError.message}`);
          setThoughts((userThoughts as Thought[]) || []);

          const { count: thoughtsCountVal, error: thoughtsCountError } = await supabase
            .from("thoughts")
            .select("*", { count: "exact", head: true })
            .eq("user_id", profileData.id);
          if (thoughtsCountError) console.error("Error fetching thoughts count:", thoughtsCountError.message);
          else if (isMountedRef.current) setThoughtCount(thoughtsCountVal || 0);

          const { count: fetchedFollowersCount, error: followersError } = await supabase
            .from("followers")
            .select("*", { count: "exact", head: true })
            .eq("following_id", profileData.id);
          if (followersError) console.error("Error fetching followers count for viewed user:", followersError.message);
          else if (isMountedRef.current) setFollowersCount(fetchedFollowersCount || 0);

          const { count: fetchedFollowingCount, error: followingError } = await supabase
            .from("followers")
            .select("*", { count: "exact", head: true })
            .eq("follower_id", profileData.id);
          if (followingError) console.error("Error fetching following count for viewed user:", followingError.message);
          else if (isMountedRef.current) setFollowingCount(fetchedFollowingCount || 0);
        }
      } catch (e) {
        const message = getErrorMessage(e);
        console.error("fetchProfileData CATCH:", message);
        // Set error state only if not already set to prevent loops, handled by initializeProfilePage
        if (isMountedRef.current && !error ) setError(message);
        throw e;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [error] // Keep error dependency sparse if it causes issues, or ensure setError is stable.
  );

  const initializeProfilePage = useCallback(async () => {
    if (!isMountedRef.current) return;

    if (!usernameFromParams) {
      if (isMountedRef.current) {
        setError("Username not provided in URL.");
        setLoading(false);
      }
      return;
    }

    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
      setViewedUser(null);
      setThoughts([]);
      setThoughtCount(0);
      setFollowersCount(0);
      setFollowingCount(0);
      setIsCurrentlyFollowing(false);
      setIsOwnProfile(false);
      setCheckingFollowStatus(false);
      setFollowActionLoading(false);
    }

    const {
      data: { user: currentAuthUser },
      error: authErr,
    } = await supabase.auth.getUser();

    if (isMountedRef.current) {
      if (authErr) {
        console.warn("Auth error getting user during initialization:", authErr.message);
      }
      setAuthUser(currentAuthUser);
    }

    try {
      await fetchProfileData(usernameFromParams);
    } catch (e) {
      if (isMountedRef.current && !error) { // Check if error is already set
        setError(getErrorMessage(e));
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [usernameFromParams, fetchProfileData, error]);

  // 1. Initialize profile data on mount and when username changes
  useEffect(() => {
    isMountedRef.current = true;
    initializeProfilePage();
    return () => {
      isMountedRef.current = false;
    };
  }, [initializeProfilePage]);

  // 2. Supabase Auth Listener
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMountedRef.current) return;
      setAuthUser(session?.user || null);
    });
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // 3. Derive isOwnProfile
  useEffect(() => {
    if (authUser && viewedUser) {
      setIsOwnProfile(authUser.id === viewedUser.id);
    } else {
      setIsOwnProfile(false);
    }
  }, [authUser, viewedUser]);

  // 4. Sync isCurrentlyFollowing
  useEffect(() => {
    if (!isMountedRef.current) return;
    const checkFollowStatus = async () => {
      if (!authUser || !viewedUser || authUser.id === viewedUser.id) {
        if (isMountedRef.current) {
          setIsCurrentlyFollowing(false);
          setCheckingFollowStatus(false);
        }
        return;
      }
      if (isMountedRef.current) setCheckingFollowStatus(true);
      try {
        const { data: followRecord } = await supabase
          .from("followers")
          .select("follower_id")
          .eq("follower_id", authUser.id)
          .eq("following_id", viewedUser.id)
          .limit(1)
          .maybeSingle();
        if (isMountedRef.current) setIsCurrentlyFollowing(!!followRecord);
      } catch (e) {
        if (isMountedRef.current) {
          console.error("Error checking follow status:", getErrorMessage(e));
          setIsCurrentlyFollowing(false);
        }
      } finally {
        if (isMountedRef.current) setCheckingFollowStatus(false);
      }
    };
    checkFollowStatus();
  }, [authUser, viewedUser]);

  // 5. Listen for new thoughts from modal
  useEffect(() => {
    const handleNewThought = (event: Event) => {
      if (!isMountedRef.current) return;
      const customEvent = event as CustomEvent<Thought>;
      const newThoughtFromModal = customEvent.detail;
      if (viewedUser && newThoughtFromModal.user_id === viewedUser.id) {
        setThoughts((prevThoughts) => [newThoughtFromModal, ...prevThoughts]);
        setThoughtCount((prevCount) => prevCount + 1);
      }
    };
    document.addEventListener("new-thought-posted", handleNewThought);
    return () => {
      document.removeEventListener("new-thought-posted", handleNewThought);
    };
  }, [viewedUser]);

  const handleFollowToggle = useCallback(async () => {
    if (!authUser || !viewedUser || authUser.id === viewedUser.id || !isMountedRef.current) return;
    setFollowActionLoading(true);
    setError(null);
    try {
      if (isCurrentlyFollowing) {
        const { error: unfollowError } = await supabase
          .from("followers")
          .delete()
          .match({ follower_id: authUser.id, following_id: viewedUser.id });
        if (unfollowError) throw new Error(`Error unfollowing user: ${unfollowError.message}`);
        if (isMountedRef.current) {
          setIsCurrentlyFollowing(false);
          setFollowersCount((prev) => Math.max(0, prev - 1));
        }
      } else {
        const { error: followError } = await supabase
          .from("followers")
          .insert({ follower_id: authUser.id, following_id: viewedUser.id });
        if (followError) throw new Error(`Error following user: ${followError.message}`);
        if (isMountedRef.current) {
          setIsCurrentlyFollowing(true);
          setFollowersCount((prev) => prev + 1);
        }
      }
    } catch (err) {
      if (isMountedRef.current) setError(getErrorMessage(err));
    } finally {
      if (isMountedRef.current) setFollowActionLoading(false);
    }
  }, [authUser, viewedUser, isCurrentlyFollowing]);

  const handlePostThoughtInline = useCallback(async () => {
    if (!newThought.trim() || !isMountedRef.current || !authUser || !isOwnProfile || !viewedUser) return;
    setPosting(true);
    setError(null);
    try {
      const { data: thoughtData, error: thoughtError } = await supabase
        .from("thoughts")
        .insert({ user_id: authUser.id, content: newThought.trim() })
        .select()
        .single<Thought>();
      if (thoughtError) throw new Error(`Posting thought: ${thoughtError.message}`);
      if (!thoughtData) throw new Error("Failed to retrieve thought data after posting.");
      if (isMountedRef.current) {
        setNewThought("");
        setThoughts((prev) => [thoughtData, ...prev]);
        setThoughtCount((c) => c + 1);
      }
    } catch (err) {
      if (isMountedRef.current) setError(getErrorMessage(err));
    } finally {
      if (isMountedRef.current) setPosting(false);
    }
  }, [newThought, authUser, isOwnProfile, viewedUser]);

  const handleDeleteThought = async (thoughtId: string) => {
    if (!isMountedRef.current || !authUser || !isOwnProfile) return;
    try {
      const { error: deleteError } = await supabase.from("thoughts").delete().eq("id", thoughtId).eq("user_id", authUser.id);
      if (deleteError) throw deleteError;
      if (isMountedRef.current) {
        setThoughts((prev) => prev.filter((t) => t.id !== thoughtId));
        setThoughtCount((count) => Math.max(0, count - 1));
      }
    } catch (err) {
      if (isMountedRef.current) setError(getErrorMessage(err));
    }
  };

  const handleEditToggle = () => {
    if (!viewedUser || !isMountedRef.current || !isOwnProfile) return;
    setEditName(viewedUser.name);
    setEditUsername(viewedUser.username);
    setEditBio(viewedUser.bio || "");
    setEditing(true);
    setError(null);
  };

  const handleSaveProfile = async () => {
    if (!authUser || !isMountedRef.current || !isOwnProfile || !viewedUser) return;
    setError(null);
    setLoading(true);
    try {
      if (!editName.trim() || !editUsername.trim()) {
        throw new Error("Name and Username cannot be empty.");
      }
      const newUsernameTrimmed = editUsername.trim().toLowerCase();
      if (newUsernameTrimmed !== viewedUser.username) {
        const { data: existingUser, error: checkError } = await supabase
          .from("users")
          .select("id")
          .eq("username", newUsernameTrimmed)
          .neq("id", authUser.id)
          .limit(1)
          .single();
        if (checkError && checkError.code !== "PGRST116") throw new Error(`Checking username: ${checkError.message}`);
        if (existingUser) throw new Error("Username already taken.");
      }
      const updates = {
        name: editName.trim(),
        username: newUsernameTrimmed,
        bio: editBio.trim(),
      };
      const { error: updateError } = await supabase.from("users").update(updates).eq("id", authUser.id);
      if (updateError) throw new Error(`Saving profile: ${updateError.message}`);
      if (isMountedRef.current) {
        setViewedUser((prev) => (prev ? { ...prev, ...updates } : null));
        setEditing(false);
        if (newUsernameTrimmed !== viewedUser.username) {
          router.replace(`/profile/${newUsernameTrimmed}`, { scroll: false });
        }
      }
    } catch (err) {
      if (isMountedRef.current) setError(getErrorMessage(err));
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !authUser || !isMountedRef.current || !isOwnProfile || !viewedUser) return;
    const file = e.target.files[0];
    const fileExt = file.name.split(".").pop();
    const fileName = `${authUser.id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;
    setError(null);
    try {
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });
      if (uploadError) throw new Error(`Storage upload error: ${uploadError.message}`);
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      if (!urlData || !urlData.publicUrl) throw new Error("Failed to get public URL for avatar.");
      const publicUrl = urlData.publicUrl;
      const { error: updateError } = await supabase
        .from("users")
        .update({ profile_image_url: publicUrl })
        .eq("id", authUser.id);
      if (updateError) throw new Error(`DB profile image update error: ${updateError.message}`);
      if (isMountedRef.current) {
        setViewedUser((prev) => (prev ? { ...prev, profile_image_url: publicUrl } : null));
      }
    } catch (err) {
      if (isMountedRef.current) setError(getErrorMessage(err));
    }
  };

  // --- JSX Rendering ---

  // Full-page error state if initial load fails catastrophically
  if (error && !viewedUser && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-red-500 text-center mb-4 text-lg">Oops! Could not load profile:</p>
        <p className="text-red-400 text-center mb-6 bg-gray-800 p-3 rounded-md">{error}</p>
        <button
          onClick={() => {
            //setError(null); // initializeProfilePage will reset error
            initializeProfilePage();
          }}
          className="mt-4 px-6 py-2 bg-white text-black rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
        >
          Try Again
        </button>
        <Link href="/" className="mt-3 px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
          Go Home
        </Link>
      </div>
    );
  }

  // Full-page "not found" state if loading finished, no error, but no user
  if (!loading && !viewedUser && !error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-400 text-center">
          Profile data for @{usernameFromParams} could not be found or is unavailable.
        </p>
        <Link href="/" className="mt-3 px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
          Go Home
        </Link>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto px-4 py-4 sm:py-8 text-white">
      {/* Action Error Display (for follow, post, save profile errors IF profile is loaded) */}
      {error && viewedUser && (
        <div className="mb-4 p-3 bg-red-900 bg-opacity-30 border border-red-700 text-red-300 rounded">
          <div className="flex justify-between items-center">
            <span>Error: {error}</span>
            <button onClick={() => setError(null)} className="text-xs underline ml-2 hover:text-red-200">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Profile Header Section */}
      <div className="mb-8 p-4 sm:p-6 bg-gray-900/50 rounded-xl border border-gray-800">
        { (loading && !viewedUser) ? (
          <ProfileHeaderSkeleton usernameFromParams={usernameFromParams} />
        ) : viewedUser ? (
          <>
            {/* Mobile Layout */}
            <div className="block sm:hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="relative group flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gray-700 overflow-hidden border-2 border-gray-600">
                    {viewedUser.profile_image_url ? (
                      <Image
                        key={viewedUser.profile_image_url}
                        src={`${viewedUser.profile_image_url}${viewedUser.profile_image_url.includes("?") ? "&v=" : "?v="}${Date.now()}`}
                        alt={`${viewedUser.name}'s Profile`}
                        unoptimized={true}
                        width={64}
                        height={64}
                        quality={90}
                        className="w-full h-full object-cover"
                        priority
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-700">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                      </div>
                    )}
                  </div>
                  {isOwnProfile && (
                    <label htmlFor="avatar-upload-input-mobile" className="absolute inset-0 w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full bg-black bg-opacity-50">
                      <input id="avatar-upload-input-mobile" type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                      <div className="p-1.5 rounded-full bg-black bg-opacity-70"><FaPencilAlt className="text-white text-xs" /></div>
                    </label>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {isOwnProfile ? (
                    <button onClick={handleEditToggle} className="px-4 py-2 bg-white text-gray-900 rounded-full hover:bg-gray-100 transition-colors text-sm font-medium border border-gray-300">Edit Profile</button>
                  ) : (
                    <button onClick={handleFollowToggle} className={`px-4 py-2 rounded-full transition-colors duration-150 ease-in-out text-sm font-medium border ${isCurrentlyFollowing ? "bg-transparent border-gray-600 text-gray-300 hover:bg-red-600 hover:border-red-600 hover:text-white" : "bg-white text-gray-900 border-white hover:bg-gray-100"} disabled:opacity-60 disabled:cursor-not-allowed`} disabled={!authUser || followActionLoading || checkingFollowStatus}>
                      {followActionLoading ? (isCurrentlyFollowing ? "Unfollowing..." : "Following...") : checkingFollowStatus ? "Loading..." : isCurrentlyFollowing ? "Unfollow" : "Follow"}
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <h1 className="text-xl font-bold text-white">{viewedUser.name}</h1>
                  <p className="text-gray-400 text-base">@{viewedUser.username}</p>
                </div>
                {viewedUser.bio && <p className="text-gray-300 text-sm leading-relaxed">{viewedUser.bio}</p>}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1"><span className="font-semibold text-white">{thoughtCount}</span><span className="text-gray-400">Thoughts</span></div>
                  <div className="flex items-center gap-1"><span className="font-semibold text-white">{followersCount}</span><span className="text-gray-400">Followers</span></div>
                  <div className="flex items-center gap-1"><span className="font-semibold text-white">{followingCount}</span><span className="text-gray-400">Following</span></div>
                </div>
                {viewedUser.joined_at && typeof viewedUser.joined_at === "string" && (<p className="text-xs text-gray-500">Joined {new Date(viewedUser.joined_at).toLocaleDateString(undefined, { year: "numeric", month: "long" })}</p>)}
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden sm:flex items-start gap-6">
              <div className="relative group flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-gray-700 overflow-hidden border-2 border-gray-600">
                  {viewedUser.profile_image_url ? (
                    <Image key={viewedUser.profile_image_url} src={`${viewedUser.profile_image_url}${viewedUser.profile_image_url.includes("?") ? "&v=" : "?v="}${Date.now()}`} alt={`${viewedUser.name}'s Profile`} unoptimized={true} width={80} height={80} quality={90} className="w-full h-full object-cover" priority />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-700"><svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg></div>
                  )}
                </div>
                {isOwnProfile && (
                  <label htmlFor="avatar-upload-input-desktop" className="absolute inset-0 w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full bg-black bg-opacity-50">
                    <input id="avatar-upload-input-desktop" type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    <div className="p-2 rounded-full bg-black bg-opacity-70"><FaPencilAlt className="text-white text-sm" /></div>
                  </label>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white mb-1">{viewedUser.name}</h1>
                    <p className="text-gray-400 text-lg mb-2">@{viewedUser.username}</p>
                    {viewedUser.bio && (<p className="text-gray-300 text-sm leading-relaxed mb-4 max-w-lg">{viewedUser.bio}</p>)}
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-1"><span className="font-semibold text-white">{thoughtCount}</span><span className="text-gray-400">Thoughts</span></div>
                      <div className="flex items-center gap-1"><span className="font-semibold text-white">{followersCount}</span><span className="text-gray-400">Followers</span></div>
                      <div className="flex items-center gap-1"><span className="font-semibold text-white">{followingCount}</span><span className="text-gray-400">Following</span></div>
                    </div>
                    {viewedUser.joined_at && typeof viewedUser.joined_at === "string" && (<p className="text-xs text-gray-500 mt-3">Joined {new Date(viewedUser.joined_at).toLocaleDateString(undefined, { year: "numeric", month: "long" })}</p>)}
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    {isOwnProfile ? (
                      <button onClick={handleEditToggle} className="px-6 py-2.5 bg-white text-gray-900 rounded-full hover:bg-gray-100 transition-colors text-sm font-medium border border-gray-300">Edit Profile</button>
                    ) : (
                      <button onClick={handleFollowToggle} className={`px-6 py-2.5 rounded-full transition-colors duration-150 ease-in-out text-sm font-medium border ${isCurrentlyFollowing ? "bg-transparent border-gray-600 text-gray-300 hover:bg-red-600 hover:border-red-600 hover:text-white" : "bg-white text-gray-900 border-white hover:bg-gray-100"} disabled:opacity-60 disabled:cursor-not-allowed`} disabled={!authUser || followActionLoading || checkingFollowStatus}>
                        {followActionLoading ? (isCurrentlyFollowing ? "Unfollowing..." : "Following...") : checkingFollowStatus ? "Loading..." : isCurrentlyFollowing ? "Unfollow" : "Follow"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
            // Fallback if viewedUser is somehow null after loading checks (should ideally not be reached)
            <div className="text-center py-10"><p className="text-gray-400">Profile information is currently unavailable.</p></div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {editing && isOwnProfile && viewedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full mx-4 border border-gray-700/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700/50 bg-gray-800/50"><div className="flex items-center justify-between"><h3 className="text-xl font-semibold text-white">Edit Profile</h3><button onClick={() => { setEditing(false); setError(null);}} className="p-2 hover:bg-gray-700 rounded-full transition-colors"><svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div></div>
            <div className="p-6">
              {error && (<div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm"><div className="flex items-center gap-2"><svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg><span>{error}</span></div></div>)}
              <div className="space-y-6">
                <div><label htmlFor="edit-name" className="block text-sm font-medium text-gray-300 mb-2">Display Name</label><input id="edit-name" type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="block w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white shadow-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent placeholder-gray-500 transition-all" placeholder="Enter your display name"/></div>
                <div><label htmlFor="edit-username" className="block text-sm font-medium text-gray-300 mb-2">Username</label><div className="relative"><span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">@</span><input id="edit-username" type="text" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="block w-full bg-gray-800 border border-gray-600 rounded-xl pl-8 pr-4 py-3 text-white shadow-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-none placeholder-gray-500 transition-all" placeholder="username"/></div></div>
                <div><label htmlFor="edit-bio" className="block text-sm font-medium text-gray-300 mb-2">Bio</label><textarea id="edit-bio" value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={4} className="block w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white shadow-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-none placeholder-gray-500 transition-all" placeholder="Tell us a little about yourself..."/><p className="text-xs text-gray-500 mt-2">{editBio.length}/160 characters</p></div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-800/30 border-t border-gray-700/50"><div className="flex justify-end gap-3"><button onClick={() => { setEditing(false); setError(null);}} className="px-6 py-2.5 bg-transparent border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors font-medium">Cancel</button><button onClick={handleSaveProfile} disabled={loading} className="px-6 py-2.5 bg-white text-black rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors font-medium">{loading ? "Saving..." : "Save Changes"}</button></div></div>
          </div>
        </div>
      )}

      {/* Inline Thought Posting (Only for own profile) */}
      {viewedUser && isOwnProfile && (
        <div className="my-6 sm:my-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-3">Share a quick thought</h3>
          <textarea value={newThought} onChange={(e) => setNewThought(e.target.value)} placeholder={`What's on your mind, ${viewedUser.name.split(" ")[0]}?`} className="w-full p-3 rounded bg-gray-700 text-white resize-none border border-gray-600 focus:ring-2 focus:ring-gray-400 focus:border-transparent placeholder-gray-500 text-sm sm:text-base" rows={3} disabled={posting}/>
          <button onClick={handlePostThoughtInline} disabled={posting || !newThought.trim()} className="mt-3 px-4 sm:px-5 py-2 bg-white text-black rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors font-medium text-sm sm:text-base">{posting ? "Sharing..." : "Share Thought"}</button>
        </div>
      )}

      {/* Thoughts List */}
      <div className="space-y-4">
        { (loading && !viewedUser) ? ( // If profile itself is still loading, show a generic loader for thoughts area
            <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-400 mb-3"></div>
                <p className="text-gray-400">Loading thoughts for @{usernameFromParams || "user"}...</p>
            </div>
        ) : viewedUser ? ( // Profile loaded, now handle thoughts display
          <>
            <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">
              {isOwnProfile ? "Your Thoughts" : `Thoughts by @${viewedUser.username}`}
            </h3>
            {/* `loading` here is the main page loading state. It's true until initializeProfilePage fully completes. */}
            {loading && thoughts.length === 0 && ( /* If page still loading (e.g. counts) but thoughts not yet shown */
              <p className="text-gray-400 text-center py-4">Loading thoughts...</p>
            )}
            {!loading && thoughts.length === 0 && ( /* Page done loading, and no thoughts */
              <div className="text-center py-10">
                <p className="text-gray-500 text-lg">
                  {isOwnProfile
                    ? "You haven't shared any thoughts yet."
                    : `@${viewedUser.username} hasn't shared any thoughts yet.`}
                </p>
                {isOwnProfile && <p className="text-gray-400 mt-2">Why not share what's on your mind?</p>}
              </div>
            )}
            {thoughts.length > 0 && thoughts.map((thought) => (
              <div key={thought.id} className="bg-gray-800 p-4 rounded-lg shadow text-white relative border border-gray-700 hover:border-gray-600 transition-colors">
                <p className="whitespace-pre-wrap break-words text-gray-100">{thought.content}</p>
                <p className="text-xs text-gray-500 mt-3">{new Date(thought.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p>
                {isOwnProfile && (
                  <button onClick={() => handleDeleteThought(thought.id)} className="absolute top-2 right-2 text-gray-500 hover:text-red-400 p-1.5 rounded-full hover:bg-red-500 hover:bg-opacity-20 transition-colors" aria-label="Delete thought">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" /><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" /></svg>
                  </button>
                )}
              </div>
            ))}
          </>
        ) : null // Fallback for thoughts section if viewedUser is null (should be covered by outer logic)
        }
      </div>
    </div>
  );
}