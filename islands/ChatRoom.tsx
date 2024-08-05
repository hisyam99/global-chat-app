import { useEffect, useState } from "preact/hooks";
import { Message } from "../routes/api/ws.ts";

export default function ChatRoom() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    fetchMessages();
    const ws = new WebSocket(`ws://${window.location.host}/api/ws`);
    setSocket(ws);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    return () => {
      ws.close();
    };
  }, []);

  async function fetchMessages() {
    const response = await fetch("/api/messages");
    const data = await response.json();
    setMessages(data);
  }

  const sendMessage = (e: Event) => {
    e.preventDefault();
    if (inputMessage.trim() && socket) {
      socket.send(inputMessage);
      setInputMessage("");
    }
  };

  return (
    <div>
      <ul>
        {messages.map((msg) => (
          <li key={msg.id}>
            {new Date(msg.timestamp).toLocaleString()} - {msg.text}
          </li>
        ))}
      </ul>
      <form onSubmit={sendMessage}>
        <input
          type="text"
          value={inputMessage}
          onInput={(e) => setInputMessage((e.target as HTMLInputElement).value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}