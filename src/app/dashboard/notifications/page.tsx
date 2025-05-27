"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client"; // Adjust path as needed
import NotificationItem from "@/app/dashboard/components/NotificationItem"; // Adjust path as needed
import { User } from "@supabase/supabase-js";

// Reflects your 'notifications' table structure (already defined)
interface DbNotification {
  id: string;
  recipient_id: string;
  sender_id: string | null;
  type: string;
  thought_id: string | null;
  is_read: boolean;
  created_at: string;
}

// Profile of the sender (already defined)
interface SenderProfile {
  id: string;
  username: string;
  name: string | null;
  profile_image_url: string | null;
}

// Combined type for easier use in the component (already defined and suitable)
// This interface perfectly matches the expected output of your Supabase query
export interface NotificationWithSender extends Omit<DbNotification, 'sender_id'> {
  sender_id: string | null; // Original sender_id FK
  sender: SenderProfile | null; // Joined sender's profile
  // All other fields from DbNotification are implicitly included:
  // id, recipient_id, type, thought_id, is_read, created_at
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationWithSender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);

  // markAllAsRead function remains the same...
  const markAllAsRead = async () => {
    if (!authUser || notifications.every(n => n.is_read)) return;

    const unreadNotificationIds = notifications
      .filter(n => !n.is_read)
      .map(n => n.id);

    if (unreadNotificationIds.length === 0) return;

    setNotifications(prevNotifications =>
      prevNotifications.map(n => ({ ...n, is_read: true }))
    );

    try {
      const { error: updateError } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", unreadNotificationIds)
        .eq("recipient_id", authUser.id);

      if (updateError) {
        console.error("Error marking notifications as read:", updateError);
        fetchNotifications(authUser);
        setError("Failed to mark all as read. Please try again.");
      }
    } catch (e) {
      console.error("Unexpected error marking notifications as read:", e);
      if (authUser) fetchNotifications(authUser); // Check authUser before calling
      setError("An unexpected error occurred.");
    }
  };


  const fetchNotifications = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setLoading(false);
      setNotifications([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("notifications")
        .select(`
          id,
          recipient_id,
          sender_id,
          type,
          thought_id,
          is_read,
          created_at,
          sender:users!notifications_sender_id_fkey ( 
            id, username, name, profile_image_url
          )
        `)
        .eq("recipient_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(50)
        .returns<NotificationWithSender[]>(); // <--- USE NotificationWithSender HERE

      if (fetchError) {
        console.error("Error fetching notifications:", fetchError);
        throw new Error(`Database error: ${fetchError.message} (Details: ${fetchError.details}, Hint: ${fetchError.hint}, Code: ${fetchError.code})`);
      }

      // 'data' is now correctly typed as `NotificationWithSender[] | null`
      // The `map` operation is now simpler as `item` is already the correct type.
      setNotifications(data || []);

    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  // Add dependencies for useCallback if they might change and affect the function's behavior.
  // supabase client instance is usually stable. setX state setters are stable.
  // currentUser isn't passed to useCallback so it's captured from closure.
  // If you pass currentUser to useCallback, add it to deps.
  // For now, an empty array or [supabase] is common if supabase is from a context/prop.
  // Since supabase is imported directly, [] should be fine.
  }, []); // Empty dependency array suggests it relies on closure or stable external refs.

  // useEffect for auth state change and initial fetch remains the same...
  useEffect(() => {
    let isMounted = true; // Prevent state updates on unmounted component

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        const currentUser = session?.user ?? null;
        setAuthUser(currentUser);
        if (currentUser) {
          fetchNotifications(currentUser);
        } else {
          setNotifications([]);
          setLoading(false);
        }
      }
    );

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!isMounted) return;
      setAuthUser(user);
      if (user) {
        fetchNotifications(user);
      } else {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [fetchNotifications]); // fetchNotifications is a dependency

  // Rest of the component rendering (if/else for loading, error, empty, list) remains the same...

  if (!authUser && !loading) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 text-center">
        <p className="text-gray-400">Please log in to see your notifications.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4 pt-6 px-1">
        <h2 className="text-xl font-semibold text-white">Notifications</h2>
        {notifications.some(n => !n.is_read) && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50"
            disabled={loading || notifications.every(n => n.is_read)}
          >
            Mark all as read
          </button>
        )}
      </div>

      {loading && notifications.length === 0 && (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-3"></div>
          <p className="text-gray-400">Loading notifications...</p>
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-900 bg-opacity-30 border border-red-700 text-red-300 p-4 rounded-md text-center">
          <p>Error loading notifications: {error}</p>
          <button
            onClick={() => authUser && fetchNotifications(authUser)} // Ensure authUser exists
            className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && notifications.length === 0 && (
        <div className="text-center py-10">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p className="mt-3 text-gray-400">You have no new notifications.</p>
          <p className="text-xs text-gray-500">Activity from others will show up here.</p>
        </div>
      )}
      
      <div className="border border-gray-700 rounded-lg overflow-hidden shadow-md bg-gray-900">
        {notifications.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </div>
    </div>
  );
}