import { Handlers } from "$fresh/server.ts";
import { loadMessages, writeMessages } from "@/services/database.ts";

const chatId = "global";

export const handler: Handlers = {
  GET: (req) => {
    const headers = new Headers({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    });

    const body = new ReadableStream({
      async start(controller) {
        const sendMessages = async () => {
          try {
            const data = await loadMessages(chatId, "strong");
            const message = `data: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(new TextEncoder().encode(message));
          } catch (error) {
            console.error("Error loading messages:", error);
            const errorMessage = `data: ${JSON.stringify({ error: "Failed to load messages" })}\n\n`;
            controller.enqueue(new TextEncoder().encode(errorMessage));
          }
        };

        // Send initial messages
        await sendMessages();

        const interval = setInterval(sendMessages, 10000); // Refresh every 10 seconds

        req.signal.addEventListener("abort", () => {
          clearInterval(interval);
          controller.close();
        });
      },
    });

    return new Response(body, { headers });
  },

  POST: async (req) => {
    try {
      const mutations = await req.json();
      await writeMessages(chatId, mutations);
      return new Response(null, { status: 204 });
    } catch (error) {
      console.error("Error writing messages:", error);
      return new Response("Failed to write messages", { status: 500 });
    }
  },
};
