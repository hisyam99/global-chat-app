import { PageProps } from "$fresh/server.ts";
import { Handlers } from "$fresh/server.ts";
import LoginPage from "../../islands/LoginPage.tsx";
import { State } from "../../plugins/session.ts";

export const handler: Handlers<null, State> = {
  GET(req, ctx) {
    const { sessionUser } = ctx.state;

    if (sessionUser) {
      const previousUrl = req.headers.get("Referer") || "/";
      // Create a new Response object with the redirection
      return new Response(null, {
        status: 302,
        headers: {
          Location: previousUrl,
        },
      });
    }

    return ctx.render(null);
  },
};

export default function Home(props: PageProps) {
  return (
    <div>
      <LoginPage url={props.url} />
    </div>
  );
}
