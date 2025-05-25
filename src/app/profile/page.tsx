"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Image from "next/image";
import 'flowbite'; 
import { FaPencilAlt } from "react-icons/fa";

// Helper to generate a unique username
async function generateUniqueUsername(base: string): Promise<string> {
  let username = base;
  let suffix = 1;
  while (true) {
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .limit(1)
      .single();
    if (error && error.code !== "PGRST116") throw new Error(error.message);
    if (!data) break;
    username = `${base}${suffix}`;
    suffix++;
  }
  return username;
}

// Helper to get error message
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return "An unknown error occurred";
  }
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [thoughtCount, setThoughtCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [newThought, setNewThought] = useState("");
  const [posting, setPosting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [thoughts, setThoughts] = useState<Array<{ id: string; content: string; created_at: string }>>([]);

  const isMountedRef = useRef(true);

  const fetchProfile = useCallback(async () => {
    if (!isMountedRef.current) {
      console.log("fetchProfile: Component unmounted, aborting fetch.");
      return;
    }
    console.log("fetchProfile: Starting to fetch profile data...");
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw new Error(`Auth error: ${authError.message}`);
      if (!authUser) throw new Error("No authenticated user found. Please log in.");

      const userId = authUser.id;
      const { data: userThoughts, error: thoughtsError } = await supabase
        .from("thoughts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (thoughtsError) throw new Error(`Thoughts fetch error: ${thoughtsError.message}`);
      if (isMountedRef.current) {
        setThoughts(userThoughts || []);
      }

      const { data: userProfileById, error: userByIdError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      let profileUser = userProfileById;

      if (userByIdError && userByIdError.code === "PGRST116") { // User not found by ID
        console.log("fetchProfile: User not found by ID, trying by email.");
        const { data: userByEmail, error: userByEmailError } = await supabase
          .from("users")
          .select("*")
          .eq("email", authUser.email)
          .single();

        if (userByEmailError && userByEmailError.code === "PGRST116") { // User not found by email, create new
          console.log("fetchProfile: User not found by email, creating new user entry.");
          const defaultName = authUser.user_metadata?.name || "Anonymous";
          const rawUsername =
            authUser.user_metadata?.username || `user_${userId.slice(0, 8)}`;
          const baseUsername = rawUsername.toLowerCase().replace(/\s+/g, "_");
          const uniqueUsername = await generateUniqueUsername(baseUsername);

          const { data: newUser, error: insertError } = await supabase
            .from("users")
            .insert({
              id: userId,
              email: authUser.email,
              name: defaultName,
              username: uniqueUsername,
              joined_at: new Date().toISOString(),
              bio: null,
            })
            .select()
            .single();

          if (insertError) throw new Error(`User insert error: ${insertError.message}`);
          profileUser = newUser;
        } else if (userByEmail) {
          console.log("fetchProfile: User found by email.");
          profileUser = userByEmail;
        } else if (userByEmailError) {
          throw new Error(`User by email fetch error: ${userByEmailError.message}`);
        } else {
            throw new Error("Error fetching user by email, unknown reason.");
        }
      } else if (userByIdError) { // Other error fetching by ID
        throw new Error(`User by ID fetch error: ${userByIdError.message}`);
      }
      
      if (!profileUser) {
        throw new Error("User profile could not be resolved after all attempts.");
      }
      console.log("fetchProfile: Profile user data resolved:", profileUser);

      if (isMountedRef.current) {
        setUser(profileUser);

        const [thoughtsCountRes, followersCountRes, followingCountRes] = await Promise.all([
          supabase.from("thoughts").select("*", { count: "exact", head: true }).eq("user_id", userId),
          supabase.from("followers").select("*", { count: "exact", head: true }).eq("following_id", userId),
          supabase.from("followers").select("*", { count: "exact", head: true }).eq("follower_id", userId),
        ]);

        if (thoughtsCountRes.error) throw new Error(`Thoughts count error: ${thoughtsCountRes.error.message}`);
        if (followersCountRes.error) throw new Error(`Followers count error: ${followersCountRes.error.message}`);
        if (followingCountRes.error) throw new Error(`Following count error: ${followingCountRes.error.message}`);

        setThoughtCount(thoughtsCountRes.count || 0);
        setFollowersCount(followersCountRes.count || 0);
        setFollowingCount(followingCountRes.count || 0);
        console.log("fetchProfile: Counts fetched successfully.");
      }
    } catch (e) {
      const message = getErrorMessage(e);
      console.error("fetchProfile: CATCH BLOCK:", message);
      if (isMountedRef.current) {
        setError(message);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        console.log("fetchProfile: Fetch process finished, loading set to false.");
      }
    }
  }, []); // Dependencies: state setters are stable, refs don't need to be listed. supabase & helpers are stable.

  useEffect(() => {
    isMountedRef.current = true;
    console.log("ProfilePage: Mounted. Calling fetchProfile.");
    fetchProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("ProfilePage: Auth state changed:", event);
      if (!isMountedRef.current) return;

      if (event === "SIGNED_OUT") {
        if (isMountedRef.current) setUser(null);
        router.push("/authentication/login");
      } else if (event === "USER_UPDATED" || (event === "SIGNED_IN" && session?.user)) {
        console.log("ProfilePage: User updated or signed in. Re-fetching profile.");
        fetchProfile();
      }
    });

    return () => {
      console.log("ProfilePage: Unmounting.");
      isMountedRef.current = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [router, fetchProfile]); // fetchProfile is stable due to useCallback with empty deps

  const handlePost = useCallback(async () => {
    // ... (handlePost logic as before, ensuring isMountedRef checks)
    if (!newThought.trim() || !isMountedRef.current) return;
  
    setPosting(true);
    setError(null); // Clear previous errors specific to posting
  
    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();
  
      if (authError || !authUser) {
        if (isMountedRef.current) setError("User not authenticated to post.");
        return;
      }
  
      const userId = String(authUser.id).trim();
  
      // Ensure user exists in 'users' table (idempotent check/insert)
      const { data: existingUser, error: fetchUserError } = await supabase
        .from("users")
        .select("id")
        .eq("id", userId) // Check primarily by ID
        .maybeSingle();
  
      if (fetchUserError) throw new Error(`Fetching user for post: ${fetchUserError.message}`);
  
      if (!existingUser) {
        console.log("handlePost: User not in 'users' table, creating entry before posting.");
        const defaultName = authUser.user_metadata?.name || "Anonymous";
        const rawUsername = authUser.user_metadata?.username || `user_${userId.slice(0, 8)}`;
        const baseUsername = rawUsername.toLowerCase().replace(/\s+/g, "_");
        const uniqueUsername = await generateUniqueUsername(baseUsername);
  
        const { error: insertUserError } = await supabase.from("users").insert({
          id: userId,
          email: authUser.email, // Ensure email is available and correct
          name: defaultName,
          username: uniqueUsername,
          joined_at: new Date().toISOString(),
          bio: null, 
        });
  
        if (insertUserError) throw new Error(`Inserting new user for post: ${insertUserError.message}`);
      }
  
      const { data: thought, error: thoughtError } = await supabase
        .from("thoughts")
        .insert({
          user_id: userId,
          content: newThought.trim(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
  
      if (thoughtError) throw new Error(`Posting thought: ${thoughtError.message}`);
  
      if (isMountedRef.current) {
        setNewThought("");
        setThoughtCount((c) => c + 1);
        setThoughts((prev) => [thought, ...prev]);
      }
    } catch (err) {
      console.error("Post error:", err);
      if (isMountedRef.current) setError(getErrorMessage(err));
    } finally {
      if (isMountedRef.current) setPosting(false);
    }
  }, [newThought]); // Add other dependencies if newThought uses them, e.g. supabase, generateUniqueUsername
  
  const handleDeleteThought = async (id: string) => {
    // ... (handleDeleteThought logic as before)
    if (!isMountedRef.current) return;
    try {
      const { error } = await supabase
        .from("thoughts")
        .delete()
        .eq("id", id);
  
      if (error) throw error;
  
      if(isMountedRef.current) {
        setThoughts((prev) => prev.filter((t) => t.id !== id));
        setThoughtCount((count) => count - 1);
      }
    } catch (err) {
      if(isMountedRef.current) setError(getErrorMessage(err));
    }
  };
  

  const handleEditToggle = () => {
    // ... (handleEditToggle logic as before)
    if (!user || !isMountedRef.current) return;
    setEditName(user.name);
    setEditUsername(user.username);
    setEditBio(user.bio || ""); 
    setEditing(true);
    setError(null); 
  };
  
  const handleSaveProfile = async () => {
    // ... (handleSaveProfile logic as before, ensuring isMountedRef checks)
    if (!user || !isMountedRef.current) return;
    setError(null);
  
    try {
      if (!editName.trim() || !editUsername.trim()) {
        throw new Error("Name and Username cannot be empty.");
      }

      if (editUsername !== user.username) {
        const { data: existingUserWithNewUsername, error: checkError } = await supabase
          .from("users")
          .select("id")
          .eq("username", editUsername.trim())
          .neq("id", user.id) 
          .limit(1)
          .single();

        if (checkError && checkError.code !== "PGRST116") { 
          throw new Error(`Checking username uniqueness: ${checkError.message}`);
        }
        if (existingUserWithNewUsername) {
          throw new Error("Username already taken. Please choose another one.");
        }
      }

      const { error: updateError } = await supabase
        .from("users")
        .update({ name: editName.trim(), username: editUsername.trim(), bio: editBio.trim() }) 
        .eq("id", user.id);
  
      if (updateError) throw new Error(`Saving profile: ${updateError.message}`);
  
      if (isMountedRef.current) {
        setUser((prev: any) => ({ ...prev, name: editName.trim(), username: editUsername.trim(), bio: editBio.trim() }));
        setEditing(false);
      }
    } catch (err) {
      console.error("Save profile error:", err);
      if (isMountedRef.current) setError(getErrorMessage(err)); // Error will be shown in the modal
    }
  };
  

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // ... (handleAvatarUpload logic as before, ensuring isMountedRef checks)
    if (!e.target.files || e.target.files.length === 0 || !user || !isMountedRef.current) return;
    
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`; 
    const filePath = `${fileName}`; 
  
    console.log("Uploading file:", filePath);
  
    try {
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('avatars') 
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // If file exists, replace it. Set to false if you want to prevent overwrites.
        });
  
      if (uploadError) throw new Error(`Storage upload error: ${uploadError.message}`);
  
      console.log("Upload successful:", uploadData);
  
      const { data: urlData } = supabase // No destructuring { publicUrl } here, check the structure
        .storage
        .from('avatars')
        .getPublicUrl(filePath); 
      
      if (!urlData || !urlData.publicUrl) { // Check if publicUrl is actually there
          throw new Error("Failed to get public URL for avatar.");
      }
      const publicUrl = urlData.publicUrl;
      console.log("Public URL:", publicUrl);
  
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_image_url: publicUrl })
        .eq('id', user.id);
  
      if (updateError) throw new Error(`DB profile image update error: ${updateError.message}`);
  
      console.log("User profile avatar URL updated successfully");
  
      if(isMountedRef.current) {
        setUser((prev: any) => ({ ...prev, profile_image_url: publicUrl }));
      }
    } catch (err) {
      console.error("Avatar upload failed:", err);
      if(isMountedRef.current) setError(getErrorMessage(err)); // Display error on page
    }
  };

  // --- RENDER LOGIC ---

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600" />
      </div>
    );
  }

  // This is the critical error block:
  if (error && !user) { 
    console.log("ProfilePage: Rendering full-page error UI. Error:", error);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-red-500 text-center mb-4 text-lg">Oops! Something went wrong:</p>
        <p className="text-red-400 text-center mb-6 bg-gray-800 p-3 rounded-md">{error}</p>
        <button
          onClick={() => {
            console.log("ProfilePage: Retry button clicked. Type of fetchProfile:", typeof fetchProfile);
            if (typeof fetchProfile === 'function') {
              setError(null); // Clear current error before retrying
              fetchProfile(); 
            } else {
              console.error("ProfilePage: fetchProfile is not a function when retry was clicked!", fetchProfile);
              // Fallback error if fetchProfile is somehow undefined
              setError("A critical error occurred with the retry mechanism. Please refresh the page.");
            }
          }}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Try Again
        </button>
        <button
          onClick={() => router.push("/authentication/login")}
          className="mt-3 px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
        >
          Go to Login
        </button>
      </div>
    );
  }

  // If user is somehow null after loading and no error (should be rare if fetchProfile handles all cases)
  if (!user) {
      console.log("ProfilePage: User is null after loading and no specific error. Redirecting to login.");
      // This case might ideally be handled by redirect in useEffect if authUser is null,
      // but as a fallback render:
      useEffect(() => { // Use effect to avoid direct push during render
          router.push("/authentication/login?message=User data not available.");
      }, [router]);
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <p className="text-gray-400 text-center">User data not available. Redirecting to login...</p>
        </div>
      );
  }

  // --- MAIN PROFILE PAGE RENDER (user is available) ---
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Display non-critical errors (e.g., from saving profile, posting thought) here if user data IS available */}
      {error && ( // This error is for operations AFTER user data is loaded (e.g. save profile error)
        <div className="mb-4 p-3 bg-red-900 bg-opacity-30 border border-red-700 text-red-300 rounded animate-pulse">
          <p>Update: {error}</p> {/* Changed "Error:" to "Update:" or similar to differentiate */}
           <button onClick={() => setError(null)} className="text-xs underline float-right">Dismiss</button>
        </div>
      )}

      {/* Profile Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-gray-700 mb-4 overflow-hidden border-2 border-gray-600">
            {user.profile_image_url ? (
            <Image
                src={`${user.profile_image_url}${user.profile_image_url.includes('?') ? '&v=' : '?v='}${Date.now()}`} 
                alt="Profile"
                unoptimized={true} 
                width={96}
                height={96}
                quality={90}
                className="w-full h-full object-cover"
                priority 
            />
            ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                />
                </svg>
            </div>
            )}
        </div>
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
        </div>
  
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">{user.name}</h2>
          <p className="text-gray-400">@{user.username}</p>
          <p className="text-sm text-gray-500 mt-2 px-4 max-w-md mx-auto whitespace-pre-line">
            {user.bio ? user.bio : "No bio yet."}
          </p>
        </div>
  
        <div className="mt-4">
          <button
            onClick={handleEditToggle}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Edit Profile
          </button>
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
  
      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-5">Edit Profile</h3>
            {error && ( // Modal-specific error display for save profile issues
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm dark:bg-red-900 dark:bg-opacity-30 dark:border-red-700 dark:text-red-300">
                <p>{error}</p>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input
                  id="edit-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="edit-username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                <input
                  id="edit-username"
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="edit-bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
                <textarea
                  id="edit-bio"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                  placeholder="Tell us a little about yourself..."
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => {
                    setEditing(false);
                    setError(null); 
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
  
      {/* New Thought Input */}
      <div className="mb-8">
        <textarea
          value={newThought}
          onChange={(e) => setNewThought(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full p-3 rounded bg-gray-800 text-white resize-none border border-gray-700 focus:ring-blue-500 focus:border-blue-500"
          rows={4}
          disabled={posting}
        />
        <button
          onClick={handlePost}
          disabled={posting || !newThought.trim()}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {posting ? "Posting..." : "Post Thought"}
        </button>
      </div>
  
      {/* Thoughts List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white mb-3">Your Thoughts</h3>
        {thoughts.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No thoughts posted yet.</p>
        ) : (
          thoughts.map((thought) => (
            <div
              key={thought.id}
              className="bg-gray-800 p-4 rounded-lg shadow text-white relative border border-gray-700"
            >
              <p className="whitespace-pre-wrap break-words">{thought.content}</p>
              <p className="text-xs text-gray-500 mt-3">
                {new Date(thought.created_at).toLocaleString()}
              </p>
              <button
                onClick={() => handleDeleteThought(thought.id)}
                className="absolute top-3 right-3 text-red-500 hover:text-red-400 text-xs p-1 rounded hover:bg-red-500 hover:bg-opacity-10"
                aria-label="Delete thought"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}