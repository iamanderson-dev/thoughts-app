"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function MyProfileRedirectPage() {
  const router = useRouter();
  // Keep a generic loading state, or even no text if you prefer a purely visual loader
  const [status, setStatus] = useState("Loading..."); 
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchUserAndRedirect = async () => {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (!isMounted) return;

        if (authError) {
          console.error("Authentication error:", authError.message);
          setStatus("Redirecting to login...");
          setError(`Auth Error: ${authError.message}`);
          // Don't wait too long if auth fails, redirect faster
          setTimeout(() => router.push("/authentication/login"), 1500); 
          return;
        }

        if (!authUser) {
          setStatus("Redirecting to login...");
          setError("No authenticated user found.");
          setTimeout(() => router.push("/authentication/login"), 1500);
          return;
        }

        // User is authenticated, now get their username
        const { data: userProfile, error: profileError } = await supabase
          .from("users")
          .select("username")
          .eq("id", authUser.id)
          .single();
        
        if (!isMounted) return;

        if (profileError) {
          console.error("Error fetching user profile:", profileError.message);
          setStatus("Profile error. Redirecting...");
          setError(`Profile fetch error: ${profileError.message}. Ensure a profile exists.`);
          // Redirect to a safe place like home or a setup page
          setTimeout(() => router.push("/"), 2000); 
          return;
        }

        if (userProfile?.username) {
          router.replace(`/profile/${userProfile.username}`);
          // No need to setStatus here as redirection will happen
        } else {
          setStatus("Username not found. Redirecting...");
          setError(`Username missing for user. Check profile data.`);
          setTimeout(() => router.push("/"), 2000);
        }
      } catch (err: any) {
        if (isMounted) {
            console.error("Unexpected error in redirector:", err);
            setStatus("An unexpected error occurred.");
            setError(err.message || "Unknown error.");
            setTimeout(() => router.push("/"), 2000);
        }
      }
    };

    fetchUserAndRedirect();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mb-4"></div>
      {/* You can choose to show the status or not. For a faster feel, sometimes less text is better */}
      {/* <p className="text-white text-lg mb-2">{status}</p> */}
      {error && <p className="text-red-400 text-sm bg-gray-800 p-2 rounded mt-2">Error: {error}</p>}
    </div>
  );
}