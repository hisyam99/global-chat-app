// File: /plugins/session.ts
// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.
import { Plugin } from "$fresh/server.ts";
import type { FreshContext } from "$fresh/server.ts";
import {
  createHelpers,
  createGoogleOAuthConfig,
  createFacebookOAuthConfig,
  createClerkOAuthConfig,
} from "@deno/kv-oauth";
import { getUserBySession } from "@/utils/db.ts";
import type { User } from "@/utils/db.ts";
import { UnauthorizedError } from "@/utils/http.ts";

export interface State {
  sessionUser?: User;
}

export type SignedInState = Required<State>;

export function assertSignedIn(ctx: {
  state: State;
}): asserts ctx is { state: SignedInState } {
  if (ctx.state.sessionUser === undefined) {
    throw new UnauthorizedError("User must be signed in");
  }
}

// Create helpers for Google, Facebook, and Clerk OAuth
const googleOAuthConfig = createGoogleOAuthConfig({
  redirectUri: `${Deno.env.get("REDIRECT_URI")}/google/callback`,
  scope:
    "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
});

const facebookOAuthConfig = createFacebookOAuthConfig({
  redirectUri: `${Deno.env.get("REDIRECT_URI")}/facebook/callback`,
  scope: "public_profile,email",
});

const clerkOAuthConfig = createClerkOAuthConfig({
  redirectUri: `${Deno.env.get("REDIRECT_URI")}/clerk/callback`,
  scope: "email profile public_metadata",
});

const googleHelpers = createHelpers(googleOAuthConfig);
const facebookHelpers = createHelpers(facebookOAuthConfig);
const clerkHelpers = createHelpers(clerkOAuthConfig);

async function setSessionState(req: Request, ctx: FreshContext<State>) {
  if (ctx.destination !== "route") return await ctx.next();

  // Initial state
  ctx.state.sessionUser = undefined;

  const googleSessionId = await googleHelpers.getSessionId(req);
  const facebookSessionId = await facebookHelpers.getSessionId(req);
  const clerkSessionId = await clerkHelpers.getSessionId(req);
  const sessionId = googleSessionId || facebookSessionId || clerkSessionId;

  if (sessionId === undefined) return await ctx.next();

  const user = await getUserBySession(sessionId);
  if (user === null) return await ctx.next();

  ctx.state.sessionUser = user;
  return await ctx.next();
}

async function ensureSignedIn(_req: Request, ctx: FreshContext<State>) {
  assertSignedIn(ctx);
  return await ctx.next();
}

/**
 * Adds middleware to the defined routes that ensures the client is signed-in
 * before proceeding. The {@linkcode ensureSignedIn} middleware throws an error
 * equivalent to the
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401|HTTP 401 Unauthorized}
 * error if `ctx.state.sessionUser` is `undefined`.
 *
 * The thrown error is then handled by {@linkcode handleWebPageErrors}, or
 * {@linkcode handleRestApiErrors}, if the request is made to a REST API
 * endpoint.
 *
 * @see {@link https://fresh.deno.dev/docs/concepts/plugins|Plugins documentation}
 * for more information on Fresh's plugin functionality.
 */
export default {
  name: "session",
  middlewares: [
    {
      path: "/",
      middleware: { handler: setSessionState },
    },
    {
      path: "/account",
      middleware: { handler: ensureSignedIn },
    },
    {
      path: "/dashboard",
      middleware: { handler: ensureSignedIn },
    },
    {
      path: "/api/me",
      middleware: { handler: ensureSignedIn },
    },
    {
      path: "/api/vote",
      middleware: { handler: ensureSignedIn },
    },
  ],
} as Plugin<State>;