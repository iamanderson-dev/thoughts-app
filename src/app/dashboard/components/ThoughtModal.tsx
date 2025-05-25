"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { X } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { supabase } from "@/lib/supabase/client"

interface AppUser {
  id: string;
  email?: string | null;
  name?: string | null;
  username?: string | null;
  profile_image_url?: string | null;
}

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
    if (error && error.code !== "PGRST116") {
        console.error("Error checking username uniqueness:", error);
        throw new Error(error.message);
    }
    if (!data) break;
    username = `${base}${suffix}`;
    suffix++;
  }
  return username;
}


export default function ThoughtModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [thought, setThought] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null)
  const [error, setError] = useState<string | null>(null)

  const modalRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  const fetchCurrentUserAndEnsureProfile = useCallback(async (): Promise<AppUser | null> => {
    setError(null);
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError) throw new Error(`Authentication error: ${authError.message}`);
      if (!authUser) {
        setIsOpen(false);
        console.warn("ThoughtModal: No authenticated user. Modal will not function correctly.");
        setError("You must be logged in to share a thought.");
        return null;
      }

      let { data: profileById, error: profileByIdError } = await supabase
        .from("users")
        .select("id, name, username, profile_image_url, email")
        .eq("id", authUser.id)
        .single();

      if (profileByIdError && profileByIdError.code !== "PGRST116") {
        throw new Error(`Fetching profile by ID error: ${profileByIdError.message}`);
      }

      if (profileById) {
        setCurrentUser(profileById as AppUser);
        return profileById as AppUser;
      }

      if (authUser.email) {
        let { data: profileByEmail, error: profileByEmailError } = await supabase
          .from("users")
          .select("id, name, username, profile_image_url, email")
          .eq("email", authUser.email)
          .single();

        if (profileByEmailError && profileByEmailError.code !== "PGRST116") {
          throw new Error(`Fetching profile by email error: ${profileByEmailError.message}`);
        }

        if (profileByEmail) {
          if (profileByEmail.id !== authUser.id) {
            console.warn(
              `ThoughtModal: Profile email (${authUser.email}) exists with ID ${profileByEmail.id} but current authUser ID is ${authUser.id}. Consolidating to authUser ID.`
            );
            const { data: updatedProfile, error: updateError } = await supabase
              .from("users")
              .update({ id: authUser.id, email: authUser.email })
              .eq("id", profileByEmail.id)
              .select("id, name, username, profile_image_url, email")
              .single();

            if (updateError) {
              throw new Error(
                `Failed to link existing profile (email: ${authUser.email}) to your current login. Error: ${updateError.message}`
              );
            }
            setCurrentUser(updatedProfile as AppUser);
            return updatedProfile as AppUser;
          } else {
            setCurrentUser(profileByEmail as AppUser);
            return profileByEmail as AppUser;
          }
        }
      }
      const defaultName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || "User";
      const rawUsernameBase = authUser.user_metadata?.user_name || authUser.user_metadata?.username || authUser.email?.split('@')[0] || `user`;
      const sanitizedUsernameBase = rawUsernameBase.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/_{2,}/g, '_').slice(0, 15) || "user";
      const uniqueUsername = await generateUniqueUsername(`${sanitizedUsernameBase}_${authUser.id.slice(0, 4)}`);


      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          id: authUser.id,
          email: authUser.email,
          name: defaultName,
          username: uniqueUsername,
          joined_at: new Date().toISOString(),
        })
        .select("id, name, username, profile_image_url, email")
        .single();

      if (insertError) {
        if (insertError.message.includes("users_username_key")) {
             throw new Error(`Failed to create profile: The username '${uniqueUsername}' might be taken or there was an issue generating a unique one. Details: ${insertError.message}`);
        }
        throw new Error(`Creating user profile error: ${insertError.message}`);
      }
      setCurrentUser(newUser as AppUser);
      return newUser as AppUser;

    } catch (err: any) {
      console.error("Error in fetchCurrentUserAndEnsureProfile:", err);
      setError(err.message || "Failed to load your user data. Please try again.");
      setCurrentUser(null);
      return null;
    }
  }, []);


  useEffect(() => {
    const handleOpenModal = async () => {
      setIsOpen(true);
      setError(null);
      setThought("");
      setIsSubmitting(false);

      const user = await fetchCurrentUserAndEnsureProfile();
      if (user) {
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }, 100);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("open-thought-modal", handleOpenModal);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("open-thought-modal", handleOpenModal);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [fetchCurrentUserAndEnsureProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!thought.trim()) {
        setError("Thought cannot be empty.");
        return;
    }
    if (!currentUser || !currentUser.id) {
      setError("User information is not available. Cannot post thought. Please try reopening the modal or logging in again.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: newThoughtFromDB, error: thoughtError } = await supabase
        .from("thoughts")
        .insert({
          user_id: currentUser.id,
          content: thought.trim(),
          // Assuming created_at is handled by DB default (e.g., DEFAULT now())
        })
        .select() // Select all columns of the newly inserted row
        .single();

      if (thoughtError) {
        throw thoughtError;
      }
      if (!newThoughtFromDB) {
        // This should ideally not happen if insert was successful and RLS allows select
        throw new Error("Failed to retrieve the new thought data after posting.");
      }

      console.log("Posted thought from Modal:", newThoughtFromDB);

      // Dispatch custom event for ProfilePage or other listeners
      const event = new CustomEvent('new-thought-posted', { detail: newThoughtFromDB });
      document.dispatchEvent(event);

      setThought("");
      setIsOpen(false);
      // router.refresh() will still run to ensure data consistency across the app,
      // especially for pages other than the active ProfilePage.
      // ProfilePage will handle the event for an immediate optimistic update.
      router.refresh();
    } catch (err: any) {
      console.error("Error posting thought:", err);
      setError(err.message || "An unexpected error occurred while posting your thought.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const characterLimit = 280;
  const remainingCharacters = characterLimit - thought.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div ref={modalRef} className="bg-[#1f1f1f] rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <button className="text-gray-400 hover:text-white" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
            <h2 className="text-white font-medium">Quick Thought</h2>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!thought.trim() || isSubmitting || !currentUser}
            className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${
              !thought.trim() || isSubmitting || !currentUser
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-white text-black hover:bg-gray-200"
            }`}
          >
            {isSubmitting ? "Sharing..." : "Share"}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-3 p-3 bg-red-500 bg-opacity-20 border border-red-700 text-red-300 rounded-md text-sm">
              <p>{error}</p>
            </div>
          )}
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gray-600 rounded-full flex-shrink-0 overflow-hidden border border-gray-500">
              {currentUser && currentUser.profile_image_url ? (
                <Image
                  src={`${currentUser.profile_image_url}${currentUser.profile_image_url.includes('?') ? '&v=' : '?v='}${Date.now()}`}
                  alt={currentUser.name || currentUser.username || "User Avatar"}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                  unoptimized={true}
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
              )}
            </div>
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                placeholder={ // MODIFIED PLACEHOLDER
                  currentUser
                    ? `What's on your mind, ${currentUser.name || currentUser.username || 'friend'}?`
                    : "What's on your mind?" // Generic placeholder
                }
                value={thought}
                onChange={(e) => {
                    if (e.target.value.length <= characterLimit) {
                        setThought(e.target.value)
                    }
                }}
                className="w-full bg-transparent border-0 text-white focus:outline-none text-lg resize-none min-h-[120px] sm:min-h-[150px]"
                disabled={isSubmitting || !currentUser}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex justify-end items-center">
            <div className={`text-sm ${remainingCharacters < 0 ? "text-red-400" : (remainingCharacters < 20 ? "text-orange-400" : "text-gray-400")}`}>
              {remainingCharacters}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}