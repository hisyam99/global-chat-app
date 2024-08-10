import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { Message } from "@/shared/api.ts";

interface ChatViewProps {
  initialData: Message[];
  latency: number;
}

export default function ChatViewSSE({ initialData, latency }: ChatViewProps) {
  const [data, setData] = useState(initialData);
  const [dirty, setDirty] = useState(false);
  const localMutations = useRef(new Map<string, string>());
  const [hasLocalMutations, setHasLocalMutations] = useState(false);
  const busy = hasLocalMutations || dirty;
  const [sending, setSending] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const sseUrl = `${window.location.origin}/api/chat_sse`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      const newData = JSON.parse(event.data);
      if (Array.isArray(newData)) {
        setData(newData);
        setDirty(false);
        setSending(false);
      } else if (newData.error) {
        console.error("Received error:", newData.error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE error:", error);
      eventSource.close();
    };

    eventSourceRef.current = eventSource;

    return () => eventSource.close();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const mutations = Array.from(localMutations.current);
      if (mutations.length) {
        setDirty(true);
        const message = JSON.stringify(
          mutations.map(([id, text]) => ({
            id,
            text,
          }))
        );

        fetch("/api/chat_sse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: message,
        })
          .then(() => {
            setSending(false);
          })
          .catch((error) => {
            console.error("Error sending message:", error);
          });

        localMutations.current.clear();
        setHasLocalMutations(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const messageInput = useRef<HTMLInputElement>(null);
  const sendMessage = useCallback(() => {
    const value = messageInput.current?.value.trim();
    if (!value) return;
    messageInput.current!.value = "";

    const id = crypto.randomUUID();
    localMutations.current.set(id, value);
    setHasLocalMutations(true);
    setSending(true);
  }, []);

  return (
   <>
      <div className="card bg-base-100 shadow-xl flex-grow overflow-hidden">
        <div className="card-body h-full flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="card-title">Global Chat</h1>
            <div className={`badge ${busy ? "badge-warning" : "badge-success"}`}>
              {busy ? "Syncing" : "Synced"}
            </div>
          </div>
          <div className="divider"></div>
          <div className="flex-grow overflow-y-auto">
            <ul className="menu bg-base-100 w-full p-0 flex flex-col-reverse">
              {data.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="sticky bottom-0 card bg-base-100 shadow-xl mt-4">
        <div className="card-body">
          <div className="form-control">
            <div className="input-group">
              <input
                type="text"
                placeholder="Type a message"
                className="input input-bordered w-full my-4"
                ref={messageInput}
              />
              <button
                className={`btn btn-primary ${sending ? "loading" : ""}`}
                onClick={sendMessage}
                disabled={sending}
              >
                Send
              </button>
            </div>
          </div>
          <div className="text-sm opacity-50 mt-4">Load time: {latency}ms</div>
        </div>
      </div>
    </>
  );
}

function ChatMessage({ message }: { message: Message }) {
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
        <div className="flex-none text-xs opacity-50">{formattedTime}</div>
      </div>
    </li>
  );
}
