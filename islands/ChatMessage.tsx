import { decodeTime } from "$std/ulid/mod.ts";
import { timeAgo } from "@/utils/display.ts";
import { Message } from "@/shared/api.ts";

export function ChatMessage({ message }: { message: Message }) {
  const formatter = new Intl.DateTimeFormat("default", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });

  let formattedTime = "Invalid date"; // Default fallback

  try {
    const date = new Date(message.timestamp);
    if (!isNaN(date.getTime())) {
      // Check if the date is valid
      formattedTime = formatter.format(date);
    }
  } catch (e) {
    console.error("Error formatting date:", e);
  }

  return (
    <li className="border-b border-base-300 py-2">
      <div className="flex items-center gap-2">
        <span className="font-bold">{message.sender}:</span>
        <span className="flex-grow">{message.text}</span>
        {timeAgo(new Date(decodeTime(message.id)))}
        <div className="flex-none text-xs opacity-50">{formattedTime}</div>
      </div>
    </li>
  );
}
