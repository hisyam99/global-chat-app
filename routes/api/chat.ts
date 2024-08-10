import { Handlers } from "$fresh/server.ts";
import { db, loadMessages, writeMessages } from "@/services/database.ts";

const chatId = "global"; // Use a standardized chat ID

// Define handler for GET request
export const handler: Handlers = {
  GET: async (req, ctx) => {
    const url = new URL(req.url);

    // WebSocket handler
    if (req.headers.get("upgrade") === "websocket") {
      try {
        const { socket, response } = Deno.upgradeWebSocket(req);

        socket.onopen = () => {
          console.log(`WebSocket opened for chat ${chatId}`);
        };

        socket.onmessage = async (event) => {
          try {
            const mutations = JSON.parse(event.data);
            await writeMessages(chatId, mutations);
            const updatedData = await loadMessages(chatId, "strong");
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify(updatedData));
            }
          } catch (error) {
            console.error(
              `Error processing message for chat ${chatId}:`,
              error
            );
            socket.close(1011, "Unexpected error");
          }
        };

        socket.onclose = () => {
          console.log(`WebSocket closed for chat ${chatId}`);
        };

        const watcher = db.watch([["chat_updated", chatId]]);

        (async () => {
          for await (const _change of watcher) {
            try {
              const updatedData = await loadMessages(chatId, "strong");
              if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify(updatedData));
              }
            } catch (error) {
              console.error(`Error sending update for chat ${chatId}:`, error);
            }
          }
        })();

        return response; // Ensure the WebSocket upgrade response is returned
      } catch (error) {
        console.error("WebSocket upgrade failed:", error);
        return new Response("WebSocket upgrade failed", { status: 500 });
      }
    }

    // Standard GET request handler
    const startTime = Date.now();
    const data = await loadMessages(
      chatId,
      url.searchParams.get("consistency") === "strong" ? "strong" : "eventual"
    );
    const endTime = Date.now();

    // Create a new Response object with the rendered content and set headers upfront
    const renderedContent = await ctx.render({
      data,
      latency: endTime - startTime,
    });
    const response = new Response(renderedContent.body, renderedContent);

    // Set headers before returning the response
    response.headers.set("x-list-load-time", `${endTime - startTime}`);

    return response;
  },
};
