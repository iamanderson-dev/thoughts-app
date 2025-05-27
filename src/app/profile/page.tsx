// MyProfileRedirectPage.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/utils";
import Link from "next/link";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";

// Define if your app requires email confirmation for core functionality.
// Check your Supabase Auth settings. If "Require email confirmation" is ON, set this to true.
const APP_REQUIRES_EMAIL_CONFIRMATION = true; // Or false, based on your Supabase settings

export default function MyProfileRedirectPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Checking authentication...");
  const [error, setError] = useState<string | null>(null);
  const hasRedirectedRef = useRef(false); // To prevent multiple redirects

  useEffect(() => {
    let isMounted = true;

    const fetchUserAndRedirect = async (sessionUser: SupabaseAuthUser | null) => {
      if (!isMounted || hasRedirectedRef.current) return;

      if (!sessionUser || !sessionUser.id) {
        setStatus("No active session for profile redirect. Redirecting to login...");
        setError("You need to be logged in.");
        hasRedirectedRef.current = true;
        router.replace("/login");
        return;
      }

      // Check for email confirmation if required
      if (APP_REQUIRES_EMAIL_CONFIRMATION && !sessionUser.email_confirmed_at) {
          setStatus("Email confirmation pending.");
          setError("Please confirm your email address to access your profile. Check your inbox for a confirmation link.");
          // Optionally, you could redirect to a dedicated "please confirm email" page
          // For now, we'll stop here and show the message.
          // hasRedirectedRef.current = true; // If you add a redirect, set this.
          // router.push('/please-confirm-email');
          return;
      }

      setStatus("Authenticated. Fetching your profile details...");
      try {
        const { data: userProfile, error: profileError } = await supabase
          .from("users")
          .select("username")
          .eq("id", sessionUser.id)
          .single();

        if (!isMounted) return;

        if (profileError) {
          if (profileError.code === "PGRST116") { // Profile not yet created by trigger
            setStatus("Your profile is being set up. Please wait a moment...");
            setError(
              "Your profile is currently being created. This usually happens right after registration and might take a few seconds. " +
              "If this message persists, try refreshing or navigating to the dashboard and back."
            );
            // Give the trigger some time
            setTimeout(async () => {
                if (isMounted && !hasRedirectedRef.current) {
                    // Attempt to fetch again if the user hasn't navigated away
                    // This is an optional retry, user might also manually refresh/navigate
                    console.log("MyProfileRedirectPage: Re-checking profile after PGRST116 delay...");
                    const { data: { session: refreshedSession } } = await supabase.auth.getSession();
                    if (refreshedSession?.user) {
                        fetchUserAndRedirect(refreshedSession.user); // Recursive call, be cautious
                    }
                }
            }, 5000); // Wait 5 seconds
            return;
          }
          throw profileError; // Other errors
        }

        if (userProfile && userProfile.username) {
          setStatus(`Redirecting to @${userProfile.username}...`);
          hasRedirectedRef.current = true;
          router.replace(`/profile/${userProfile.username}`);
        } else {
          setStatus("Profile found, but essential details (like username) are missing.");
          setError("Your profile data seems incomplete. This could be a temporary issue during setup. Please try again shortly or contact support if it persists.");
          console.error("MyProfileRedirectPage: User profile fetched but username is missing for ID:", sessionUser.id);
          // Potentially redirect to dashboard or a safe page
          // setTimeout(() => { if (isMounted && !hasRedirectedRef.current) router.replace('/'); }, 3000);
        }
      } catch (err) {
        if (!isMounted) return;
        const message = getErrorMessage(err);
        console.error("Error fetching user profile for redirect:", message);
        setStatus("Error fetching profile.");
        setError(`Failed to load your profile: ${message}`);
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted || hasRedirectedRef.current) return;
        console.log("MyProfileRedirectPage: Auth event:", event, "Session user ID:", session?.user?.id);

        if (event === "SIGNED_IN") {
          if (session?.user) {
            await fetchUserAndRedirect(session.user);
          } else {
            console.error("MyProfileRedirectPage: SIGNED_IN event but no session.user data.");
            setStatus("Authentication issue. Please try logging in again.");
          }
        } else if (event === "INITIAL_SESSION") {
          if (session?.user) {
            await fetchUserAndRedirect(session.user);
          } else {
            setStatus("Verifying session... If you just signed up, this might take a moment.");
            // No user on initial load. Wait for a potential SIGNED_IN.
            // If this page is strictly for logged-in users, and SIGNED_IN doesn't fire soon, then redirect.
            setTimeout(async () => {
                if (isMounted && !hasRedirectedRef.current) {
                    const { data: { session: currentSession } } = await supabase.auth.getSession(); // Re-check
                    if (currentSession?.user) {
                        if (!hasRedirectedRef.current) await fetchUserAndRedirect(currentSession.user);
                    } else if (!hasRedirectedRef.current) { // Check hasRedirectedRef again before redirecting
                        setStatus("No active session found. Redirecting to login...");
                        hasRedirectedRef.current = true;
                        router.replace("/login");
                    }
                }
            }, 3000); // Wait 3 seconds for SIGNED_IN
          }
        } else if (event === "SIGNED_OUT") {
          setStatus("Signed out. Redirecting to login...");
          hasRedirectedRef.current = true;
          router.replace("/login");
        }
      }
    );

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-lg mb-2">{status}</p>
      {error && (
        <div className="text-red-400 bg-red-900 bg-opacity-30 p-3 rounded-md max-w-md text-center mb-4">
          <p>{error}</p>
        </div>
      )}
      {(error || status.includes("Your profile is being set up") || status.includes("Email confirmation pending")) && (
         <Link href="/" className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">
            Go Home / Dashboard
          </Link>
      )}
      {status.includes("Email confirmation pending") && (
          <button
            onClick={async () => {
                const {data: { user }} = await supabase.auth.getUser();
                if (user && user.email) {
                    const { error: resendError } = await supabase.auth.resend({ type: 'signup', email: user.email });
                    if (resendError) {
                        setError(`Error resending confirmation: ${resendError.message}`);
                    } else {
                        setStatus("Confirmation email resent. Please check your inbox.");
                        setError(null);
                    }
                } else {
                    setError("Could not identify user to resend confirmation.");
                }
            }}
            className="mt-4 px-4 py-2 bg-orange-500 rounded hover:bg-orange-600"
            >
            Resend Confirmation Email
            </button>
      )}
    </div>
  );
}