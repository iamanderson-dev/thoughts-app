"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Image from "next/image";
import 'flowbite';


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

    // If error other than no rows found, throw
    if (error && error.code !== "PGRST116") {
      throw new Error(error.message);
    }

    // If no existing user found with username, return this username
    if (!data) break;

    username = `${base}${suffix}`;
    suffix++;
  }

  return username;
}

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


  const [thoughts, setThoughts] = useState<Array<{ id: string; content: string; created_at: string }>>([]);


  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        // Get authenticated user directly
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw new Error(authError.message);
        if (!authUser) throw new Error("No authenticated user found");

        

        const userId = authUser.id;
        const { data: userThoughts, error: thoughtsError } = await supabase
  .from("thoughts")
  .select("*")
  .eq("user_id", userId)
  .order("created_at", { ascending: false });

if (thoughtsError) throw thoughtsError;
setThoughts(userThoughts || []);


        // Try to fetch user profile by id
        const { data: userProfileById, error: userByIdError } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();

        let profileUser = userProfileById;

        if (userByIdError && userByIdError.code === "PGRST116") {
          // If no user by id, fallback to email lookup
          const { data: userByEmail, error: userByEmailError } = await supabase
            .from("users")
            .select("*")
            .eq("email", authUser.email)
            .single();

          if (userByEmailError && userByEmailError.code === "PGRST116") {
            // Insert new user since none found
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
              })
              .select()
              .single();

            if (insertError) throw new Error(insertError.message);
            profileUser = newUser;
          } else if (userByEmail) {
            profileUser = userByEmail;
          } else {
            throw new Error(userByEmailError?.message || "Error fetching user by email");
          }
        } else if (userByIdError) {
          throw new Error(userByIdError.message);
        }

        if (isMounted) {
          setUser(profileUser);

          // Fetch counts in parallel
          const [thoughtsCountRes, followersCountRes, followingCountRes] = await Promise.all([
            supabase.from("thoughts").select("*", { count: "exact", head: true }).eq("user_id", userId),
            supabase.from("followers").select("*", { count: "exact", head: true }).eq("following_id", userId),
            supabase.from("followers").select("*", { count: "exact", head: true }).eq("follower_id", userId),
          ]);

          if (thoughtsCountRes.error) throw new Error(thoughtsCountRes.error.message);
          if (followersCountRes.error) throw new Error(followersCountRes.error.message);
          if (followingCountRes.error) throw new Error(followingCountRes.error.message);

          setThoughtCount(thoughtsCountRes.count || 0);
          setFollowersCount(followersCountRes.count || 0);
          setFollowingCount(followingCountRes.count || 0);
        }
      } catch (e) {
        const message = getErrorMessage(e);
        setError(message);
        router.push(`/authentication/login?error=${encodeURIComponent(message)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!isMounted) return;
      if (event === "SIGNED_OUT") router.push("/authentication/login");
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
    
  }, [router]);

  

  const handlePost = useCallback(async () => {
    if (!newThought.trim()) return;
  
    setPosting(true);
    setError(null);
  
    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();
  
      if (authError || !authUser) {
        setError("User not authenticated.");
        return;
      }
  
      const userId = String(authUser.id).trim();
  
      // Check if user already exists by ID or email
      const { data: existingUser, error: fetchUserError } = await supabase
        .from("users")
        .select("id")
        .or(`id.eq.${userId},email.eq.${authUser.email}`)
        .maybeSingle();
  
      if (fetchUserError) throw fetchUserError;
  
      // Insert only if user does not exist
      if (!existingUser) {
        const defaultName = authUser.user_metadata?.name || "Anonymous";
        const rawUsername = authUser.user_metadata?.username || `user_${userId.slice(0, 8)}`;
        const baseUsername = rawUsername.toLowerCase().replace(/\s+/g, "_");
        const uniqueUsername = await generateUniqueUsername(baseUsername);
  
        const { error: insertUserError } = await supabase.from("users").insert({
          id: userId,
          email: authUser.email,
          name: defaultName,
          username: uniqueUsername,
          joined_at: new Date().toISOString(),
        });
  
        if (insertUserError) throw insertUserError;
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
  
      if (thoughtError) throw thoughtError;
  
      setNewThought("");
      setThoughtCount((c) => c + 1);
      setThoughts((prev) => [thought, ...prev]);
    } catch (err) {
      setError(getErrorMessage(err));
      console.error("Post error:", err);
    } finally {
      setPosting(false);
    }
  }, [newThought]);
  
  const handleDeleteThought = async (id: string) => {
    try {
      const { error } = await supabase
        .from("thoughts")
        .delete()
        .eq("id", id);
  
      if (error) throw error;
  
      setThoughts((prev) => prev.filter((t) => t.id !== id));
      setThoughtCount((count) => count - 1);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };
  

  const handleEditToggle = () => {
    setEditName(user.name);
    setEditUsername(user.username);
    setEditing(true);
  };
  
  const handleSaveProfile = async () => {
    setError(null);
  
    try {
      const { error } = await supabase
        .from("users")
        .update({ name: editName, username: editUsername })
        .eq("id", user.id);
  
      if (error) throw error;
  
      setUser((prev: any) => ({ ...prev, name: editName, username: editUsername }));
      setEditing(false);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };
  
  
  
  
  
  
  
  
  
  
  
  

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-600 text-center">{error}</p>
        <button
          onClick={() => location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-24 h-24 rounded-full bg-gray-200 mb-4 overflow-hidden">
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt="Profile"
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
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
  
        {/* User Info */}
        <div className="text-center">
          <h2 className="text-xl font-bold">{user.name}</h2>
          <p className="text-gray-600">@{user.username}</p>
        </div>
  
        {/* Edit Button */}
        <div className="mt-4">
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Edit Profile
          </button>
        </div>
  
        {/* Profile Stats */}
        <div className="flex space-x-6 mt-4 text-sm">
          <div className="text-center text-gray-100">
            <span className="font-bold text-white">{thoughtCount}</span>
            <div>Thoughts</div>
          </div>
          <div className="text-center text-gray-100">
            <span className="font-bold text-white">{followersCount}</span>
            <div>Followers</div>
          </div>
          <div className="text-center text-gray-100">
            <span className="font-bold text-white">{followingCount}</span>
            <div>Following</div>
          </div>
        </div>
      </div>
  
      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow max-w-md w-full p-6 relative">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Edit Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              <div className="flex justify-between">
                <button
                  onClick={handleSaveProfile}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 dark:bg-gray-500 dark:text-white"
                >
                  Cancel
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
          className="w-full p-3 rounded bg-gray-800 text-white resize-none"
          rows={4}
          disabled={posting}
        />
        <button
          onClick={handlePost}
          disabled={posting || !newThought.trim()}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {posting ? "Posting..." : "Post"}
        </button>
      </div>
  
      {/* Thoughts List */}
      <div className="space-y-4">
        {thoughts.length === 0 ? (
          <p className="text-gray-400 text-center">No thoughts posted yet.</p>
        ) : (
          thoughts.map((thought) => (
            <div
              key={thought.id}
              className="bg-gray-800 p-4 rounded shadow text-white relative"
            >
              <p>{thought.content}</p>
              <p className="text-sm text-gray-400 mt-2">
                {new Date(thought.created_at).toLocaleString()}
              </p>
              <button
                onClick={() => handleDeleteThought(thought.id)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm"
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
