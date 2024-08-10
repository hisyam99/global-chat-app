import { Head } from "$fresh/runtime.ts";
import ChatView from "@/islands/ChatView.tsx";
import { handler } from "../api/chat.ts";
import { Message } from "@/shared/api.ts";

export { handler };

export default function Home({
  data: { data, latency },
}: {
  data: { data: Message[]; latency: number };
}) {
  return (
    <>
      <Head>
        <title>Global Chat</title>
      </Head>
      <div class="p-4 mx-auto max-w-screen-md">
        <ChatView initialData={data} latency={latency} />
      </div>
    </>
  );
}
