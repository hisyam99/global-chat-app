import { defineRoute } from "$fresh/server.ts";
import LoginPage from "../../islands/LoginPage.tsx";
import Head from "@/components/Head.tsx";
import { State } from "../../plugins/session.ts";

export default defineRoute<State>((req, ctx) => {
  const { sessionUser } = ctx.state;

  if (sessionUser) {
    const previousUrl = req.headers.get("Referer") || "/";
    return new Response(null, {
      status: 302,
      headers: {
        Location: previousUrl,
      },
    });
  }

  return (
    <>
      <Head title="Sign In" href={ctx.url.href} />
      <main class="flex-1 p-4 flex flex-col f-client-nav">
        <LoginPage url={ctx.url} />
      </main>
    </>
  );
});
