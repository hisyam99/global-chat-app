import { defineRoute } from "$fresh/server.ts";
import ChatViewSSE from "../../islands/ChatViewSSE.tsx";
import Head from "@/components/Head.tsx";
import { State } from "@/plugins/session.ts";
import { loadMessages } from "@/services/database.ts";

export default defineRoute<State>(async (req, ctx) => {
  const url = new URL(req.url);
  const startTime = Date.now();
  const consistency =
    url.searchParams.get("consistency") === "strong" ? "strong" : "eventual";
  const data = await loadMessages("global", consistency);
  const endTime = Date.now();
  const latency = endTime - startTime;

  return (
    <>
      <Head title="Global Chat" href={ctx.url.href} />
      <main class="flex-1 p-4 flex flex-col f-client-nav">
        <ChatViewSSE initialData={data} latency={latency} />
      </main>
    </>
  );
});
