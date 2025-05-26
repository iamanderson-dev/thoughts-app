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

  const [newThought, setNewThought] = useState("");
  const [posting, setPosting] = useState(false);
  
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  
  const [thoughts, setThoughts] = useState<Thought[]>([]);

  const isMountedRef = useRef(true);

  const fetchProfileData = useCallback(async (usernameToFetch: string, currentAuthUser: any | null) => {
    // ... (fetchProfileData implementation remains the same as before)
    if (!isMountedRef.current) return;
    // setLoading(true); // setLoading will be managed by initializeProfilePage or caller
    // setError(null); // setError will be managed by initializeProfilePage or caller
    // setViewedUser(null); // These resets should happen before calling fetchProfileData
    // setThoughts([]);
    // setIsOwnProfile(false);

    try {
      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .select("id, name, username, profile_image_url, bio, joined_at")
        .eq("username", usernameToFetch)
        .single();

      if (profileError) {
        if (profileError.code === "PGRST116") {
          throw new Error(`User @${usernameToFetch} not found.`);
        }
        throw new Error(`Error fetching profile: ${profileError.message}`);
      }
      if (!profileData) {
          throw new Error(`User @${usernameToFetch} not found.`);
      }
      
      if (isMountedRef.current) {
        setViewedUser(profileData as UserProfile);
        setIsOwnProfile(currentAuthUser && profileData.id === currentAuthUser.id);

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
        setThoughtCount(thoughtsCountVal || 0);
      }
    } catch (e) {
      const message = getErrorMessage(e);
      console.error("fetchProfileData CATCH:", message);
      if (isMountedRef.current) setError(message);
    } finally {
      if (isMountedRef.current) setLoading(false); // setLoading to false happens here
    }
  }, []); // Dependencies are stable or empty

  // --- MODIFIED: Define initializeProfilePage with useCallback ---
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
      setViewedUser(null); // Reset viewed user before fetching
      setThoughts([]);     // Reset thoughts
      setIsOwnProfile(false); // Reset ownership status
    }

    // Get current authenticated user
    const { data: { user: currentAuthUser }, error: authErr } = await supabase.auth.getUser();
    
    if (authErr && isMountedRef.current) {
        console.warn("Auth error getting user during initialization:", authErr.message);
        // Depending on requirements, you might set an error or proceed
    }

    if (isMountedRef.current) {
        setAuthUser(currentAuthUser); // Store/update the authenticated user state
        // Now call fetchProfileData with the username and the (potentially updated) auth user
        await fetchProfileData(usernameFromParams, currentAuthUser);
    }
    // setLoading(false) is handled within fetchProfileData's finally block
  }, [usernameFromParams, fetchProfileData, setAuthUser, setError, setLoading, setViewedUser, setThoughts, setIsOwnProfile]);
  // --- END MODIFIED ---

  useEffect(() => {
    isMountedRef.current = true;
    initializeProfilePage(); // Call the useCallback-wrapped function

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMountedRef.current) return;
      
      const newAuthUser = session?.user || null;
      setAuthUser(newAuthUser);

      if (event === "SIGNED_OUT") {
        setIsOwnProfile(false);
      } else if (event === "USER_UPDATED" || event === "SIGNED_IN") {
        if (viewedUser) { // Re-evaluate isOwnProfile if viewedUser exists
            setIsOwnProfile(viewedUser.id === newAuthUser?.id);
        }
        // Optionally, if auth change might affect displayed profile data not tied to `viewedUser` directly,
        // you might re-trigger parts of `initializeProfilePage` or `fetchProfileData`.
        // For now, just updating `isOwnProfile` if `viewedUser` is already loaded.
        // If you want to fully refresh based on auth state change (e.g. if their own profile was edited elsewhere)
        // then you might call initializeProfilePage() again, but be mindful of loops.
      }
    });

    const handleNewThoughtPosted = (event: Event) => {
        // ... (handleNewThoughtPosted implementation remains the same)
      if (!isMountedRef.current || !isOwnProfile || !viewedUser) return;
      const customEvent = event as CustomEvent;
      const newThoughtData = customEvent.detail as Thought;

      if (!newThoughtData || !newThoughtData.id || newThoughtData.user_id !== viewedUser.id) {
        console.warn("ProfilePage: Received new-thought-posted event for wrong user or invalid data", newThoughtData);
        return;
      }
      setThoughts((prevThoughts) => {
        if (!prevThoughts.find(t => t.id === newThoughtData.id)) {
          return [newThoughtData, ...prevThoughts];
        }
        return prevThoughts;
      });
      setThoughtCount((prevCount) => prevCount + 1);
    };
    document.addEventListener('new-thought-posted', handleNewThoughtPosted);

    return () => {
      isMountedRef.current = false;
      authListener?.subscription?.unsubscribe();
      document.removeEventListener('new-thought-posted', handleNewThoughtPosted);
    };
  }, [initializeProfilePage]); // useEffect now depends on initializeProfilePage
                               // which changes if usernameFromParams changes.

  // --- Action Handlers (handlePost, handleDeleteThought, etc. remain the same) ---
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
    if (!authUser || !isMountedRef.current || !isOwnProfile) return;
    setError(null);
    try {
      if (!editName.trim() || !editUsername.trim()) {
        throw new Error("Name and Username cannot be empty.");
      }
      const newUsernameTrimmed = editUsername.trim();
      if (viewedUser && newUsernameTrimmed !== viewedUser.username) {
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
        if (viewedUser && newUsernameTrimmed !== viewedUser.username) {
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


  // --- RENDER LOGIC ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600" />
        <p className="ml-3 text-white">Loading profile for @{usernameFromParams || "user"}...</p>
      </div>
    );
  }

  // Error loading profile (e.g., user not found, or initial fetch failed)
  if (error && !viewedUser) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-red-500 text-center mb-4 text-lg">Oops! Could not load profile:</p>
        <p className="text-red-400 text-center mb-6 bg-gray-800 p-3 rounded-md">{error}</p>
        <button
          onClick={() => {
            // `initializeProfilePage` already handles setError(null) and setLoading(true)
            // and the usernameFromParams check.
            initializeProfilePage(); // Re-run the initialization logic
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
          <p className="text-gray-400 text-center">Profile data for @{usernameFromParams} is unavailable or could not be found.</p>
           <Link href="/" className="mt-3 px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
             Go Home
           </Link>
        </div>
      );
  }

  // --- MAIN PROFILE PAGE RENDER (viewedUser is available) ---
  // ... (Rest of the JSX render logic remains the same)
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Display non-critical errors */}
      {error && ( // This error is for subsequent operations IF profile data (viewedUser) IS loaded
        <div className="mb-4 p-3 bg-red-900 bg-opacity-30 border border-red-700 text-red-300 rounded">
          <div className="flex justify-between items-center">
            <p>Update: {error}</p>
            <button onClick={() => setError(null)} className="text-xs underline ml-2">Dismiss</button>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative group w-24 h-24"> {/* Added w-24 h-24 here for proper relative positioning of label */}
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
        {isOwnProfile && ( // Avatar upload pencil icon
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
        </div> {/* End of relative group for avatar */}
  
        <div className="text-center mt-4"> {/* Added mt-4 to space it from avatar */}
          <h2 className="text-xl font-bold text-white">{viewedUser.name}</h2>
          <p className="text-gray-400">@{viewedUser.username}</p>
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
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50" 
              disabled={!authUser /* Disable if not logged in, or implement follow logic */}
              onClick={() => alert("Follow functionality to be implemented!")} // Placeholder
            >
              Follow {/* Implement Follow logic */}
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
  
      {/* Edit Modal (only if isOwnProfile) */}
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
  
      {/* New Thought Input (only if isOwnProfile) */}
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
  
      {/* Thoughts List */}
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