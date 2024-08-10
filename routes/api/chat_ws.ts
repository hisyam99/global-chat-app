import { Handlers } from "$fresh/server.ts";
import { db, loadMessages, writeMessages } from "@/services/database.ts";

const chatId = "global";

export const handler: Handlers = {
  GET: async (req) => {
    const url = new URL(req.url);

    // WebSocket handler
    if (req.headers.get("upgrade")?.toLowerCase() === "websocket") {
      try {
        const { socket, response } = Deno.upgradeWebSocket(req);

        socket.onopen = () => {
          console.log(`WebSocket opened for chat ${chatId}`);
        };

        socket.onmessage = async (event) => {
          try {
            const mutations = JSON.parse(event.data);
            await writeMessages(chatId, mutations);

            // Send updated messages to the client
            const updatedData = await loadMessages(chatId, "strong");
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify(updatedData));
            }
          } catch (error) {
            console.error(
              `Error processing message for chat ${chatId}:`,
              error
            );
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(
                JSON.stringify({ error: "Error processing message" })
              );
            }
          }
        };

        socket.onerror = (error) => {
          console.error(`WebSocket error for chat ${chatId}:`, error);
        };

        socket.onclose = () => {
          console.log(`WebSocket closed for chat ${chatId}`);
        };

        try {
          const watcher = db.watch([["chat_updated", chatId]]);
          (async () => {
            for await (const _change of watcher) {
              try {
                const updatedData = await loadMessages(chatId, "strong");
                if (socket.readyState === WebSocket.OPEN) {
                  socket.send(JSON.stringify(updatedData));
                }
              } catch (error) {
                console.error(
                  `Error sending update for chat ${chatId}:`,
                  error
                );
                if (socket.readyState === WebSocket.OPEN) {
                  socket.send(
                    JSON.stringify({ error: "Error sending update" })
                  );
                }
              }
            }
          })();
        } catch (error) {
          console.error("Error setting up database watcher:", error);
        }

        return response; // Return the WebSocket upgrade response here
      } catch (error) {
        console.error("WebSocket upgrade failed:", error);
        return new Response("WebSocket upgrade failed", { status: 500 });
      }
    }

    // Standard GET request handler
    const startTime = Date.now();
    const consistency =
      url.searchParams.get("consistency") === "strong" ? "strong" : "eventual";
    const data = await loadMessages(chatId, consistency);
    const endTime = Date.now();

    const response = new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
    response.headers.set("x-list-load-time", `${endTime - startTime}`);
    return response;
  },
};
