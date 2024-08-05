import { kv } from "../../utils/db.ts";

export interface Message {
  id: string;
  text: string;
  timestamp: string;
}

const sockets = new Set<WebSocket>();

async function broadcast(message: Message) {
  const promises = [];
  for (const socket of sockets) {
    if (socket.readyState === WebSocket.OPEN) {
      promises.push(socket.send(JSON.stringify(message)));
    }
  }
  await Promise.all(promises);
}

export const handler = (req: Request): Response => {
  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onopen = () => {
    sockets.add(socket);
    console.log("WebSocket connected");
  };

  socket.onmessage = async (e) => {
    const message: Message = {
      id: crypto.randomUUID(),
      text: e.data,
      timestamp: new Date().toISOString(),
    };
    await kv.set(["messages", message.id], message);
    await broadcast(message);
  };

  socket.onclose = () => {
    sockets.delete(socket);
    console.log("WebSocket disconnected");
  };

  return response;
};
