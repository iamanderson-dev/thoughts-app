// ProfilePage.tsx
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
  // You might want to add other fields if your 'thoughts' table has them
  // and if they are selected in the modal's insert operation
  // e.g. upvotes, etc. For now, this matches the modal's selection.
}

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const usernameFromParams = params.username as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [viewedUser, setViewedUser] = useState<UserProfile | null>(null);
  const [authUser, setAuthUser] = useState<any | null>(null); // Consider using a more specific type for authUser if possible
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  const [thoughtCount, setThoughtCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isCurrentlyFollowing, setIsCurrentlyFollowing] = useState(false);
  const [checkingFollowStatus, setCheckingFollowStatus] = useState(false);
  const [followActionLoading, setFollowActionLoading] = useState(false);

  const [newThought, setNewThought] = useState(""); // For the inline thought posting form
  const [posting, setPosting] = useState(false); // For the inline thought posting form
  
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  
  const [thoughts, setThoughts] = useState<Thought[]>([]);

  const isMountedRef = useRef(true);

  const fetchProfileData = useCallback(async (usernameToFetch: string) => {
    // ... (keep existing fetchProfileData logic)
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
          .select("*") // Ensure this selects all fields needed for the Thought interface
          .eq("user_id", profileData.id)
          .order("created_at", { ascending: false });

        if (thoughtsError) throw new Error(`Thoughts fetch error: ${thoughtsError.message}`);
        setThoughts(userThoughts as Thought[] || []); // Cast to Thought[]
        
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
      if (isMountedRef.current && !error) setError(message); // Check if error is already set to avoid loops
      throw e;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]); // Removed setError from dependencies as it can cause loops. Check if 'error' is truly needed.

  const initializeProfilePage = useCallback(async () => {
    // ... (keep existing initializeProfilePage logic)
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
        if (isMountedRef.current && !error) { // Check if error is already set
            setError(getErrorMessage(e));
        }
    } finally {
        if (isMountedRef.current) setLoading(false);
    }
  }, [usernameFromParams, fetchProfileData, error]); // Same here for 'error'


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
        console.log("Auth Listener Event (ProfilePage):", event, "User:", session?.user?.id);
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

  // 4. Sync isCurrentlyFollowing based on authUser and viewedUser
  // ... (keep existing useEffect for follow status)
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
        const { data: followRecord, error: followError } = await supabase
          .from("followers")
          .select("follower_id")
          .eq("follower_id", authUser.id)
          .eq("following_id", viewedUser.id)
          .limit(1)
          .maybeSingle(); 

        if (!isMountedRef.current) return;

        if (followError) {
          console.error("Error checking follow status:", followError.message);
          setIsCurrentlyFollowing(false); 
        } else {
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


  // ***** START OF THE FIX *****
  // 5. Listen for new thoughts posted from the modal
  useEffect(() => {
    const handleNewThought = (event: Event) => {
      if (!isMountedRef.current) return;

      const customEvent = event as CustomEvent<Thought>;
      const newThoughtFromModal = customEvent.detail;

      // Ensure the thought is for the currently viewed user
      if (viewedUser && newThoughtFromModal.user_id === viewedUser.id) {
        console.log("ProfilePage: Received new thought from modal for current user", newThoughtFromModal);
        setThoughts((prevThoughts) => [newThoughtFromModal, ...prevThoughts]);
        setThoughtCount((prevCount) => prevCount + 1);
      } else if (viewedUser) {
        console.log(`ProfilePage: Received new thought, but user_id ${newThoughtFromModal.user_id} does not match viewedUser.id ${viewedUser.id}`);
      } else {
        console.log("ProfilePage: Received new thought, but viewedUser is null.");
      }
    };

    document.addEventListener('new-thought-posted', handleNewThought);
    console.log("ProfilePage: Event listener for 'new-thought-posted' added.");

    return () => {
      document.removeEventListener('new-thought-posted', handleNewThought);
      console.log("ProfilePage: Event listener for 'new-thought-posted' removed.");
    };
  }, [viewedUser]); // Re-run if viewedUser changes, to ensure correct user_id comparison
  // ***** END OF THE FIX *****


  const handleFollowToggle = useCallback(async () => {
    // ... (keep existing handleFollowToggle logic)
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

  // For the inline thought posting form on the profile page itself
  const handlePostThoughtInline = useCallback(async () => {
    if (!newThought.trim() || !isMountedRef.current || !authUser || !isOwnProfile || !viewedUser) return;
    setPosting(true);
    setError(null);
    try {
      const { data: thoughtData, error: thoughtError } = await supabase
        .from("thoughts")
        .insert({ user_id: authUser.id, content: newThought.trim() })
        .select() // Ensure this selects all fields for the Thought interface
        .single<Thought>(); // Cast to Thought

      if (thoughtError) throw new Error(`Posting thought: ${thoughtError.message}`);
      if (!thoughtData) throw new Error("Failed to retrieve thought data after posting.");

      if (isMountedRef.current) {
        setNewThought("");
        setThoughts((prev) => [thoughtData, ...prev]); // Prepend the new thought
        setThoughtCount((c) => c + 1);
      }
    } catch (err) {
      if (isMountedRef.current) setError(getErrorMessage(err));
    } finally {
      if (isMountedRef.current) setPosting(false);
    }
  }, [newThought, authUser, isOwnProfile, viewedUser]); // Added viewedUser dependency


  const handleDeleteThought = async (thoughtId: string) => {
    // ... (keep existing handleDeleteThought logic)
    if (!isMountedRef.current || !authUser || !isOwnProfile) return;
    try {
      const { error } = await supabase
        .from("thoughts")
        .delete()
        .eq("id", thoughtId)
        .eq("user_id", authUser.id); // Important: ensure only own thoughts can be deleted
      if (error) throw error;
      if(isMountedRef.current) {
        setThoughts((prev) => prev.filter((t) => t.id !== thoughtId));
        setThoughtCount((count) => Math.max(0, count - 1)); // Prevent negative count
      }
    } catch (err) {
      if(isMountedRef.current) setError(getErrorMessage(err));
    }
  };

  const handleEditToggle = () => {
    // ... (keep existing handleEditToggle logic)
    if (!viewedUser || !isMountedRef.current || !isOwnProfile) return;
    setEditName(viewedUser.name);
    setEditUsername(viewedUser.username);
    setEditBio(viewedUser.bio || "");
    setEditing(true);
    setError(null);
  };

  const handleSaveProfile = async () => {
    // ... (keep existing handleSaveProfile logic)
    if (!authUser || !isMountedRef.current || !isOwnProfile || !viewedUser) return;
    setError(null);
    setLoading(true); // Indicate loading during save
    try {
      if (!editName.trim() || !editUsername.trim()) {
        throw new Error("Name and Username cannot be empty.");
      }
      const newUsernameTrimmed = editUsername.trim().toLowerCase(); // Consider normalizing username
      if (newUsernameTrimmed !== viewedUser.username) {
        const { data: existingUser, error: checkError } = await supabase
          .from("users").select("id").eq("username", newUsernameTrimmed).neq("id", authUser.id)
          .limit(1).single();
        if (checkError && checkError.code !== "PGRST116") throw new Error(`Checking username: ${checkError.message}`);
        if (existingUser) throw new Error("Username already taken.");
      }

      const updates = { 
          name: editName.trim(), 
          username: newUsernameTrimmed, 
          bio: editBio.trim() 
      };
      const { error: updateError } = await supabase
        .from("users").update(updates).eq("id", authUser.id);
      if (updateError) throw new Error(`Saving profile: ${updateError.message}`);
      
      if (isMountedRef.current) {
        setViewedUser((prev) => prev ? { ...prev, ...updates } : null);
        setEditing(false);
        if (newUsernameTrimmed !== viewedUser.username) {
          // Important: Use router.replace to update URL without adding to history,
          // and to trigger a re-evaluation of the page for the new username.
          router.replace(`/profile/${newUsernameTrimmed}`, { scroll: false }); 
          // initializeProfilePage will be called due to usernameFromParams changing if you make it a dep of the first useEffect
          // or you can call it manually here if needed after router.replace finishes.
          // For now, relying on Next.js router to handle the page data update.
        }
      }
    } catch (err) {
      if (isMountedRef.current) setError(getErrorMessage(err));
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // ... (keep existing handleAvatarUpload logic)
    if (!e.target.files || e.target.files.length === 0 || !authUser || !isMountedRef.current || !isOwnProfile || !viewedUser) return;
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${authUser.id}-${Date.now()}.${fileExt}`; // Use authUser.id for consistency
    const filePath = `${fileName}`; 
    setError(null);
    // Consider adding a loading state for avatar upload
    try {
      // Ensure the user has 'insert' and 'update' permissions on the 'avatars' bucket
      // and 'update' permission on their own row in the 'users' table for 'profile_image_url'
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
          cacheControl: '3600', upsert: true // upsert:true is good for replacing existing avatar if named the same
        });
      if (uploadError) throw new Error(`Storage upload error: ${uploadError.message}`);
      
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      if (!urlData || !urlData.publicUrl) throw new Error("Failed to get public URL for avatar.");
      
      const publicUrl = urlData.publicUrl;
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_image_url: publicUrl })
        .eq('id', authUser.id); // Update the user's record
      if (updateError) throw new Error(`DB profile image update error: ${updateError.message}`);
      
      if(isMountedRef.current) {
        setViewedUser((prev) => prev ? { ...prev, profile_image_url: publicUrl } : null);
        // Also update authUser if it holds profile_image_url and is used for the avatar in a navbar, for example
        // setAuthUser((prev: any) => prev ? {...prev, user_metadata: {...prev.user_metadata, avatar_url: publicUrl }} : null);
        // The above line depends on how you structure/use authUser.
        // A more robust way is to re-fetch authUser or rely on onAuthStateChange to provide updated user metadata if Supabase Auth does that.
      }
    } catch (err) {
      if(isMountedRef.current) setError(getErrorMessage(err));
    }
  };


  // --- JSX Rendering ---
  if (loading && !viewedUser) { // Modified condition to show loading only if no user data yet
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
          onClick={() => {
            setError(null); // Clear error before retrying
            initializeProfilePage();
          }}
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
          <p className="text-gray-400 text-center">Profile data for @{usernameFromParams} could not be found or is unavailable.</p>
           <Link href="/" className="mt-3 px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
             Go Home
           </Link>
        </div>
      );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 text-white"> {/* Added text-white for base color */}
      {/* Action Error Display (for follow, post, save profile errors) */}
      {error && ( 
        <div className="mb-4 p-3 bg-red-900 bg-opacity-30 border border-red-700 text-red-300 rounded">
          <div className="flex justify-between items-center">
            <span>Error: {error}</span>
            <button onClick={() => setError(null)} className="text-xs underline ml-2 hover:text-red-200">Dismiss</button>
          </div>
        </div>
      )}

      {/* Profile Header Section */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative group w-24 h-24 mb-4">
            <div className="w-full h-full rounded-full bg-gray-700 overflow-hidden border-2 border-gray-600">
            {viewedUser.profile_image_url ? (
            <Image
                key={viewedUser.profile_image_url} // Key to force re-render on change
                src={`${viewedUser.profile_image_url}${viewedUser.profile_image_url.includes('?') ? '&v=' : '?v='}${Date.now()}`} 
                alt={`${viewedUser.name}'s Profile`}
                unoptimized={true} // Useful if image URLs are from Supabase Storage without transformations
                width={96}
                height={96}
                quality={90}
                className="w-full h-full object-cover"
                priority 
            />
            ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-700"> {/* Added bg-gray-700 */}
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
            </div>
            )}
        </div>
        {isOwnProfile && (
            <label htmlFor="avatar-upload-input" className="absolute inset-0 w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full bg-black bg-opacity-30 group-hover:bg-opacity-50">
                <input 
                id="avatar-upload-input"
                type="file" 
                accept="image/*" 
                onChange={handleAvatarUpload}
                className="hidden" 
                />
                <div className="p-2 rounded-full bg-black bg-opacity-70"> {/* Adjusted styling for better visibility */}
                <FaPencilAlt className="text-white text-lg" />
                </div>
            </label>
        )}
        </div>
  
        <div className="text-center"> {/* Removed mt-4 as parent div has mb-4 */}
          <h1 className="text-2xl font-bold text-white">{viewedUser.name}</h1> {/* Changed h2 to h1 for semantic main heading */}
          <p className="text-gray-400">@{viewedUser.username}</p>
          {viewedUser.joined_at && typeof viewedUser.joined_at === 'string' ? (
            <p className="text-xs text-gray-500 mt-1">
              Joined: {new Date(viewedUser.joined_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })} {/* Simplified date */}
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">Joined: N/A</p>
          )}
          <p className="text-sm text-gray-300 mt-3 px-4 max-w-md mx-auto whitespace-pre-line"> {/* Changed text color for bio */}
            {viewedUser.bio ? viewedUser.bio : <span className="italic text-gray-500">This user hasn't shared a bio yet.</span>}
          </p>
        </div>
  
        {/* Action Buttons (Edit/Follow) */}
        <div className="mt-6">
          {isOwnProfile ? (
            <button onClick={handleEditToggle} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">
              Edit Profile
            </button>
          ) : (
            <button 
              onClick={handleFollowToggle}
              className={`px-6 py-2 text-white rounded-md transition-colors duration-150 ease-in-out text-sm font-medium
                ${isCurrentlyFollowing ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                disabled:opacity-60 disabled:cursor-not-allowed`}
              disabled={!authUser || followActionLoading || checkingFollowStatus}
            >
              {followActionLoading 
                ? (isCurrentlyFollowing ? 'Unfollowing...' : 'Following...') 
                : checkingFollowStatus 
                  ? 'Loading...' 
                  : (isCurrentlyFollowing ? 'Unfollow' : 'Follow')}
            </button>
          )}
        </div>
  
        {/* Stats */}
        <div className="flex space-x-8 mt-8 text-sm">
          <div className="text-center text-gray-300">
            <span className="block font-bold text-white text-lg">{thoughtCount}</span>
            <span className="text-gray-400">Thoughts</span>
          </div>
          <div className="text-center text-gray-300">
            <span className="block font-bold text-white text-lg">{followersCount}</span>
            <span className="text-gray-400">Followers</span>
          </div>
          <div className="text-center text-gray-300">
            <span className="block font-bold text-white text-lg">{followingCount}</span>
            <span className="text-gray-400">Following</span>
          </div>
        </div>
      </div>
  
      {/* Edit Profile Modal */}
      {editing && isOwnProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-75 p-4 backdrop-blur-sm"> {/* Increased z-index */}
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-6">Edit Your Profile</h3>
            {error && ( // Error specific to edit modal
              <div className="mb-4 p-3 bg-red-900 bg-opacity-40 border border-red-700 text-red-300 rounded text-sm">
                <p>{error}</p>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input id="edit-name" type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="block w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500" />
              </div>
              <div>
                <label htmlFor="edit-username" className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                <input id="edit-username" type="text" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="block w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500" />
              </div>
              <div>
                <label htmlFor="edit-bio" className="block text-sm font-medium text-gray-300 mb-1">Bio</label>
                <textarea id="edit-bio" value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={4} className="block w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-none placeholder-gray-500" placeholder="Tell us a little about yourself..." />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button onClick={() => { setEditing(false); setError(null); }} className="px-4 py-2 bg-gray-600 text-gray-200 rounded-md hover:bg-gray-500 transition-colors font-medium">Cancel</button>
                <button onClick={handleSaveProfile} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
  
      {/* Inline Thought Posting (Only for own profile) */}
      {isOwnProfile && (
        <div className="my-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-3">Share a quick thought</h3>
          <textarea
            value={newThought}
            onChange={(e) => setNewThought(e.target.value)}
            placeholder={`What's on your mind, ${viewedUser.name.split(" ")[0]}?`}
            className="w-full p-3 rounded bg-gray-700 text-white resize-none border border-gray-600 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
            rows={3}
            disabled={posting} 
          />
          <button 
            onClick={handlePostThoughtInline} 
            disabled={posting || !newThought.trim()} 
            className="mt-3 px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            {posting ? "Sharing..." : "Share Thought"}
          </button>
        </div>
      )}
  
      {/* Thoughts List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">
          {isOwnProfile ? "Your Thoughts" : `Thoughts by @${viewedUser.username}`}
        </h3>
        {loading && thoughts.length === 0 && <p className="text-gray-400 text-center py-4">Loading thoughts...</p> /* Show loading for thoughts specifically */}
        {!loading && thoughts.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 text-lg">
              {isOwnProfile ? "You haven't shared any thoughts yet." : `@${viewedUser.username} hasn't shared any thoughts yet.`}
            </p>
            {isOwnProfile && 
                <p className="text-gray-400 mt-2">Why not share what's on your mind?</p>
            }
          </div>
        ) : (
          thoughts.map((thought) => (
            <div key={thought.id} className="bg-gray-800 p-4 rounded-lg shadow text-white relative border border-gray-700 hover:border-gray-600 transition-colors">
              <p className="whitespace-pre-wrap break-words text-gray-100">{thought.content}</p>
              <p className="text-xs text-gray-500 mt-3">{new Date(thought.created_at).toLocaleString(undefined, {dateStyle: 'medium', timeStyle: 'short'})}</p>
              {isOwnProfile && (
                <button 
                    onClick={() => handleDeleteThought(thought.id)} 
                    className="absolute top-2 right-2 text-gray-500 hover:text-red-400 p-1.5 rounded-full hover:bg-red-500 hover:bg-opacity-20 transition-colors" 
                    aria-label="Delete thought"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                  </svg>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}