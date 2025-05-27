import Link from "next/link";
import Image from "next/image";
import { NotificationWithSender } from "@/app/dashboard/notifications/page"; // Path to your NotificationsPage

interface NotificationItemProps {
  notification: NotificationWithSender;
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const weeks = Math.round(days / 7);
  const months = Math.round(days / 30.44);
  const years = Math.round(days / 365.25);

  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 5) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return `${years}y ago`;
}

export default function NotificationItem({ notification }: NotificationItemProps) {
  const { sender, type, created_at, thought_id, is_read } = notification;

  let messageBody = "";
  let linkHref = "#"; // Default link

  if (!sender) {
    // Handle cases where sender might be null (e.g., sender account deleted and ON DELETE SET NULL)
    messageBody = "An interaction from a user whose account no longer exists.";
    // Optionally, you could have a generic icon or message.
    return (
      <div className={`p-4 border-b border-gray-700 flex items-start space-x-3 ${!is_read ? 'bg-gray-800/50' : 'bg-gray-900'}`}>
         <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-gray-400">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zM9 5h2v6H9V5zm0 7h2v2H9v-2z"></path></svg>
        </div>
        <div className="flex-grow">
          <p className="text-gray-400">{messageBody}</p>
          <p className="text-xs text-gray-500 mt-1">{timeAgo(created_at)}</p>
        </div>
        {!is_read && (
          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full self-center flex-shrink-0" title="Unread"></div>
        )}
      </div>
    );
  }

  const senderName = sender.name || `@${sender.username}`;

  switch (type) {
    case "follow":
      messageBody = `started following you.`;
      linkHref = `/profile/${sender.username}`;
      break;
    case "comment":
      messageBody = `commented on your thought.`;
      linkHref = `/thought/${thought_id}`; // Assuming you have routes like /thought/:id
      break;
    default:
      messageBody = `interacted with you.`;
      linkHref = `/profile/${sender.username}`; // Fallback link to sender's profile
  }

  return (
    <div className={`p-4 border-b border-gray-700 flex items-start space-x-3 hover:bg-gray-800 transition-colors ${!is_read ? 'bg-gray-800/50' : 'bg-gray-900'}`}>
      <Link href={linkHref} className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden">
          {sender.profile_image_url ? (
            <Image
              src={sender.profile_image_url}
              alt={`${senderName}'s avatar`}
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
            </div>
          )}
        </div>
      </Link>
      <div className="flex-grow">
        <Link href={linkHref} className="hover:underline">
          <p className="text-white">
            <span className="font-semibold">{senderName}</span>
            <span className="text-gray-400"> {messageBody}</span>
          </p>
        </Link>
        <p className="text-xs text-gray-500 mt-1">{timeAgo(created_at)}</p>
      </div>
      {!is_read && (
        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full self-center flex-shrink-0" title="Unread"></div>
      )}
    </div>
  );
}