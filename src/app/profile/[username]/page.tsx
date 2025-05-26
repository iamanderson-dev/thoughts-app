"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Image from "next/image";
import { FaPencilAlt } from "react-icons/fa";
import Link from "next/link";

// Helper to get error message (keep as is)
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return "An unknown error occurred";
  }
}

interface UserProfile {
  id: string;
  email?: string;
  name: string;
  username: string;
  profile_image_url: string | null;
  bio: string | null;
  joined_at: string;
}

interface Thought {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const usernameFromParams = params.username as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [viewedUser, setViewedUser] = useState<UserProfile | null>(null);
  const [authUser, setAuthUser] = useState<any | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  const [thoughtCount, setThoughtCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isCurrentlyFollowing, setIsCurrentlyFollowing] = useState(false);
  const [checkingFollowStatus, setCheckingFollowStatus] = useState(false);
  const [followActionLoading, setFollowActionLoading] = useState(false);

  const [newThought, setNewThought] = useState("");
  const [posting, setPosting] = useState(false);
  
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  
  const [thoughts, setThoughts] = useState<Thought[]>([]);

  const isMountedRef = useRef(true);

  const fetchProfileData = useCallback(async (usernameToFetch: string) => {
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
        setThoughts(userThoughts as Thought[] || []);
        
        const { count: thoughtsCountVal, error: thoughtsCountError } = await supabase
            .from("thoughts").select("*", { count: "exact", head: true }).eq("user_id", profileData.id);
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
      if (isMountedRef.current && !error) setError(message);
      throw e;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]); // error is included as it's used in catch block, others are stable setters or module scope

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
    
    const { data: { user: currentAuthUser }, error: authErr } = await supabase.auth.getUser();
    if (isMountedRef.current) {
        if (authErr) {
            console.warn("Auth error getting user during initialization:", authErr.message);
        }
        setAuthUser(currentAuthUser);
    }
    
    try {
        await fetchProfileData(usernameFromParams);
    } catch (e) {
        if (isMountedRef.current && !error) { 
            setError(getErrorMessage(e));
        }
    } finally {
        if (isMountedRef.current) setLoading(false);
    }
  }, [usernameFromParams, fetchProfileData, error]);


  // --- MODIFIED useEffects START ---

  // 1. Initialize profile data on mount and when username changes
  useEffect(() => {
    isMountedRef.current = true;
    initializeProfilePage();
    return () => {
        isMountedRef.current = false;
    };
  }, [initializeProfilePage]);

  // 2. Supabase Auth Listener to update authUser state
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (!isMountedRef.current) return;
        console.log("Auth Listener Event:", event, "User:", session?.user?.id);
        setAuthUser(session?.user || null);
    });
    return () => {
        authListener?.subscription?.unsubscribe();
    };
  }, []);

  // 3. Derive isOwnProfile based on authUser and viewedUser
  useEffect(() => {
    if (authUser && viewedUser) {
        setIsOwnProfile(authUser.id === viewedUser.id);
    } else {
        setIsOwnProfile(false);
    }
  }, [authUser, viewedUser]);

   // 5. Sync isCurrentlyFollowing based on authUser and viewedUser
   useEffect(() => {
    if (!isMountedRef.current) return;

    const checkFollowStatus = async () => {
      if (!authUser || !viewedUser || authUser.id === viewedUser.id) {
        setIsCurrentlyFollowing(false);
        setCheckingFollowStatus(false);
        return;
      }

      setCheckingFollowStatus(true);
      try {
        const { data: followRecord, error: followError } = await supabase
          .from("followers")
          .select("follower_id") //  <--- CHANGED THIS LINE (you can also use "following_id" or "*")
          .eq("follower_id", authUser.id)
          .eq("following_id", viewedUser.id)
          .limit(1)
          .maybeSingle(); // maybeSingle returns null if no record, or the record if found

        if (!isMountedRef.current) return;

        if (followError) {
          // This condition handles actual database errors, not "record not found"
          console.error("Error checking follow status:", followError.message);
          setIsCurrentlyFollowing(false); // Default to false on error
        } else {
          // If followRecord is not null, it means a record was found
          setIsCurrentlyFollowing(!!followRecord); 
        }
      } catch (e) {
        if (isMountedRef.current) {
          console.error("Unexpected error checking follow status:", getErrorMessage(e));
          setIsCurrentlyFollowing(false);
        }
      } finally {
        if (isMountedRef.current) setCheckingFollowStatus(false);
      }
    };
    checkFollowStatus();
  }, [authUser, viewedUser]);

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

  const handlePost = useCallback(async () => {
    if (!newThought.trim() || !isMountedRef.current || !authUser || !isOwnProfile) return;
    setPosting(true);
    setError(null);
    try {
      const { data: thought, error: thoughtError } = await supabase
        .from("thoughts")
        .insert({ user_id: authUser.id, content: newThought.trim() })
        .select()
        .single();
      if (thoughtError) throw new Error(`Posting thought: ${thoughtError.message}`);
      if (isMountedRef.current) {
        setNewThought("");
        setThoughts((prev) => [thought as Thought, ...prev]);
        setThoughtCount((c) => c + 1);
      }
    } catch (err) {
      if (isMountedRef.current) setError(getErrorMessage(err));
    } finally {
      if (isMountedRef.current) setPosting(false);
    }
  }, [newThought, authUser, isOwnProfile]);

  const handleDeleteThought = async (thoughtId: string) => {
    if (!isMountedRef.current || !authUser || !isOwnProfile) return;
    try {
      const { error } = await supabase
        .from("thoughts")
        .delete()
        .eq("id", thoughtId)
        .eq("user_id", authUser.id);
      if (error) throw error;
      if(isMountedRef.current) {
        setThoughts((prev) => prev.filter((t) => t.id !== thoughtId));
        setThoughtCount((count) => count - 1);
      }
    } catch (err) {
      if(isMountedRef.current) setError(getErrorMessage(err));
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
    try {
      if (!editName.trim() || !editUsername.trim()) {
        throw new Error("Name and Username cannot be empty.");
      }
      const newUsernameTrimmed = editUsername.trim();
      if (newUsernameTrimmed !== viewedUser.username) {
        const { data: existingUser, error: checkError } = await supabase
          .from("users").select("id").eq("username", newUsernameTrimmed).neq("id", authUser.id)
          .limit(1).single();
        if (checkError && checkError.code !== "PGRST116") throw new Error(`Checking username: ${checkError.message}`);
        if (existingUser) throw new Error("Username already taken.");
      }

      const updates = { name: editName.trim(), username: newUsernameTrimmed, bio: editBio.trim() };
      const { error: updateError } = await supabase
        .from("users").update(updates).eq("id", authUser.id);
      if (updateError) throw new Error(`Saving profile: ${updateError.message}`);
      
      if (isMountedRef.current) {
        setViewedUser((prev) => prev ? { ...prev, ...updates } : null);
        setEditing(false);
        if (newUsernameTrimmed !== viewedUser.username) {
          router.replace(`/profile/${newUsernameTrimmed}`);
        }
      }
    } catch (err) {
      if (isMountedRef.current) setError(getErrorMessage(err));
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !authUser || !isMountedRef.current || !isOwnProfile) return;
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${authUser.id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;
    setError(null);

    try {
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
          cacheControl: '3600', upsert: true
        });
      if (uploadError) throw new Error(`Storage upload error: ${uploadError.message}`);
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      if (!urlData || !urlData.publicUrl) throw new Error("Failed to get public URL for avatar.");
      const publicUrl = urlData.publicUrl;
      const { error: updateError } = await supabase.from('users').update({ profile_image_url: publicUrl }).eq('id', authUser.id);
      if (updateError) throw new Error(`DB profile image update error: ${updateError.message}`);
      if(isMountedRef.current) {
        setViewedUser((prev) => prev ? { ...prev, profile_image_url: publicUrl } : null);
      }
    } catch (err) {
      if(isMountedRef.current) setError(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600" />
        <p className="ml-3 text-white">Loading profile for @{usernameFromParams || "user"}...</p>
      </div>
    );
  }

  if (error && !viewedUser) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-red-500 text-center mb-4 text-lg">Oops! Could not load profile:</p>
        <p className="text-red-400 text-center mb-6 bg-gray-800 p-3 rounded-md">{error}</p>
        <button
          onClick={initializeProfilePage}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Try Again
        </button>
        <Link href="/" className="mt-3 px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
          Go Home
        </Link>
      </div>
    );
  }
  
  if (!viewedUser) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <p className="text-gray-400 text-center">Profile data for @{usernameFromParams} is unavailable or could not be found.</p>
           <Link href="/" className="mt-3 px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
             Go Home
           </Link>
        </div>
      );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {error && ( // This error is for actions like save profile, post thought, follow/unfollow
        <div className="mb-4 p-3 bg-red-900 bg-opacity-30 border border-red-700 text-red-300 rounded">
          <div className="flex justify-between items-center">
            <p>Update: {error}</p>
            <button onClick={() => setError(null)} className="text-xs underline ml-2">Dismiss</button>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center mb-8">
        <div className="relative group w-24 h-24">
            <div className="w-full h-full rounded-full bg-gray-700 mb-4 overflow-hidden border-2 border-gray-600">
            {viewedUser.profile_image_url ? (
            <Image
                key={viewedUser.profile_image_url} 
                src={`${viewedUser.profile_image_url}${viewedUser.profile_image_url.includes('?') ? '&v=' : '?v='}${Date.now()}`} 
                alt={`${viewedUser.name}'s Profile`}
                unoptimized={true} 
                width={96}
                height={96}
                quality={90}
                className="w-full h-full object-cover"
                priority 
            />
            ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
            </div>
            )}
        </div>
        {isOwnProfile && (
            <label htmlFor="avatar-upload-input" className="absolute inset-0 w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                <input 
                id="avatar-upload-input"
                type="file" 
                accept="image/*" 
                onChange={handleAvatarUpload}
                className="hidden" 
                />
                <div className="bg-black bg-opacity-60 rounded-full p-3">
                <FaPencilAlt className="text-white text-lg" />
                </div>
            </label>
        )}
        </div>
  
        <div className="text-center mt-4">
          <h2 className="text-xl font-bold text-white">{viewedUser.name}</h2>
          <p className="text-gray-400">@{viewedUser.username}</p>
          {viewedUser.joined_at && typeof viewedUser.joined_at === 'string' ? (
            <p className="text-xs text-gray-500 mt-1">
              Joined: {new Date(viewedUser.joined_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">Joined: N/A</p>
          )}
          <p className="text-sm text-gray-500 mt-2 px-4 max-w-md mx-auto whitespace-pre-line">
            {viewedUser.bio ? viewedUser.bio : "No bio yet."}
          </p>
        </div>
  
        <div className="mt-4">
          {isOwnProfile ? (
            <button onClick={handleEditToggle} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Edit Profile
            </button>
          ) : (
            <button 
              onClick={handleFollowToggle}
              className={`px-4 py-2 text-white rounded transition-colors duration-150 ease-in-out
                ${isCurrentlyFollowing ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={!authUser || followActionLoading || checkingFollowStatus}
            >
              {followActionLoading 
                ? (isCurrentlyFollowing ? 'Unfollowing...' : 'Following...') 
                : checkingFollowStatus 
                  ? 'Checking...' 
                  : (isCurrentlyFollowing ? 'Unfollow' : 'Follow')}
            </button>
          )}
        </div>
  
        <div className="flex space-x-6 mt-6 text-sm">
          <div className="text-center text-gray-300">
            <span className="font-bold text-white">{thoughtCount}</span>
            <div>Thoughts</div>
          </div>
          <div className="text-center text-gray-300">
            <span className="font-bold text-white">{followersCount}</span>
            <div>Followers</div>
          </div>
          <div className="text-center text-gray-300">
            <span className="font-bold text-white">{followingCount}</span>
            <div>Following</div>
          </div>
        </div>
      </div>
  
      {editing && isOwnProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-5">Edit Profile</h3>
            {error && ( 
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm dark:bg-red-900 dark:bg-opacity-30 dark:border-red-700 dark:text-red-300">
                <p>{error}</p>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input id="edit-name" type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label htmlFor="edit-username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                <input id="edit-username" type="text" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label htmlFor="edit-bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
                <textarea id="edit-bio" value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none" placeholder="Tell us a little about yourself..." />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button onClick={() => { setEditing(false); setError(null); }} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                <button onClick={handleSaveProfile} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
  
      {isOwnProfile && (
        <div className="mb-8">
          <textarea
            value={newThought}
            onChange={(e) => setNewThought(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full p-3 rounded bg-gray-800 text-white resize-none border border-gray-700 focus:ring-blue-500 focus:border-blue-500"
            rows={4}
            disabled={posting} />
          <button onClick={handlePost} disabled={posting || !newThought.trim()} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
            {posting ? "Posting..." : "Post Thought"}
          </button>
        </div>
      )}
  
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white mb-3">
          {isOwnProfile ? "Your Thoughts" : `Thoughts by @${viewedUser.username}`}
        </h3>
        {thoughts.length === 0 ? (
          <p className="text-gray-400 text-center py-4">
            {isOwnProfile ? "No thoughts posted yet." : `@${viewedUser.username} hasn't posted any thoughts yet.`}
          </p>
        ) : (
          thoughts.map((thought) => (
            <div key={thought.id} className="bg-gray-800 p-4 rounded-lg shadow text-white relative border border-gray-700">
              <p className="whitespace-pre-wrap break-words">{thought.content}</p>
              <p className="text-xs text-gray-500 mt-3">{new Date(thought.created_at).toLocaleString()}</p>
              {isOwnProfile && (
                <button onClick={() => handleDeleteThought(thought.id)} className="absolute top-3 right-3 text-red-500 hover:text-red-400 text-xs p-1 rounded hover:bg-red-500 hover:bg-opacity-10" aria-label="Delete thought">
                  Delete
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}