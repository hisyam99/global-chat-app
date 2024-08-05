import { Handlers } from "$fresh/server.ts";
import { kv } from "../../utils/db_chat.ts";

export const handler: Handlers = {
  async GET(_req) {
    const messages = [];
    const entries = kv.list({ prefix: ["messages"] });
    for await (const entry of entries) {
      messages.push(entry.value);
    }
    return Response.json(messages);
  },
};