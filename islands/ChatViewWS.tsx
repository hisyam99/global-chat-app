import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { Message } from "@/shared/api.ts";

interface ChatViewProps {
  initialData: Message[];
  latency: number;
}

export default function ChatViewWS({ initialData, latency }: ChatViewProps) {
  const [data, setData] = useState(initialData);
  const [dirty, setDirty] = useState(false);
  const localMutations = useRef(new Map<string, string>());
  const [hasLocalMutations, setHasLocalMutations] = useState(false);
  const busy = hasLocalMutations || dirty;
  const [sending, setSending] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${window.location.host}/api/chat`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => console.log("WebSocket connected");
    ws.onmessage = (event) => {
      const newData = JSON.parse(event.data);
      if (Array.isArray(newData)) {
        setData(newData);
        setDirty(false);
        setSending(false);
      } else if (newData.error) {
        console.error("Received error:", newData.error);
        // Handle error (e.g., show a notification to the user)
      }
    };
    ws.onerror = (error) => console.error("WebSocket error:", error);
    ws.onclose = () => console.log("WebSocket closed");

    wsRef.current = ws;

    return () => ws.close();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const mutations = Array.from(localMutations.current);
      if (mutations.length && wsRef.current?.readyState === WebSocket.OPEN) {
        setDirty(true);
        const message = JSON.stringify(mutations.map(([id, text]) => ({
          id,
          text,
        })));
        wsRef.current.send(message);
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
    <div className="container mx-auto p-4 max-w-xl">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center gap-2">
            <h1 className="card-title">Global Chat</h1>
            <div className={`badge ${busy ? "badge-warning" : "badge-success"}`}>
              {busy ? "Syncing" : "Synced"}
            </div>
          </div>
          <div className="divider"></div>
          <ul className="menu bg-base-100 w-full p-0">
            {data.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </ul>
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
          <div className="text-sm opacity-50 mt-4">
            Load time: {latency}ms
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ message }: { message: Message }) {
  return (
    <li className="border-b border-base-300 py-2">
      <div className="flex items-center gap-2">
        <span className="font-bold">{message.sender}:</span>
        <span className="flex-grow">{message.text}</span>
        <div className="flex-none text-xs opacity-50">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </li>
  );
}
