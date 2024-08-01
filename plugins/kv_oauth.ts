// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.
import type { Plugin } from "$fresh/server.ts";
import {
  createGoogleOAuthConfig,
  createFacebookOAuthConfig,
  createHelpers,
  createClerkOAuthConfig,
} from "@deno/kv-oauth";
import {
  createUser,
  getUser,
  updateUserSession,
  type User,
} from "@/utils/db.ts";
import { isStripeEnabled, stripe } from "@/utils/stripe.ts";
import { getGoogleUser } from "@/utils/google.ts";
import { getFacebookUser } from "@/utils/facebook.ts";
import { getClerkUser } from "@/utils/clerk.ts";
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";

// Load environment variables from .env file
const _env = await load();

// Function to normalize user ID
function normalizeUserId(profile: { id?: string; user_id?: string }) {
  return profile.user_id || profile.id || "";
}

// Configure OAuth for Google, Facebook, and Clerk
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

// Create OAuth helpers for Google, Facebook, and Clerk
const {
  signIn: googleSignIn,
  handleCallback: googleHandleCallback,
  signOut: googleSignOut,
  getSessionId: googleGetSessionId,
} = createHelpers(googleOAuthConfig);

const {
  signIn: facebookSignIn,
  handleCallback: facebookHandleCallback,
  signOut: facebookSignOut,
  getSessionId: facebookGetSessionId,
} = createHelpers(facebookOAuthConfig);

const {
  signIn: clerkSignIn,
  handleCallback: clerkHandleCallback,
  signOut: clerkSignOut,
  getSessionId: clerkGetSessionId,
} = createHelpers(clerkOAuthConfig);

// Function to save user profile to KV
async function setUserProfile(
  sessionId: string,
  profile: { id: string; name?: string; email?: string }
) {
  const kv = await Deno.openKv();
  await kv.set(["userProfiles", sessionId], profile);
}

export async function getUserProfileFromSession(sessionId: string) {
  const kv = await Deno.openKv();
  const result = await kv.get(["userProfiles", sessionId]);
  return result.value as {
    id: string;
    name?: string;
    email?: string;
  } | null;
}

async function handleUserCreation(
  profile: { id: string; name?: string; email?: string },
  sessionId: string
) {
  const user = await getUser(profile.id);
  if (user === null) {
    const newUser: User = {
      login: profile.id,
      sessionId,
      isSubscribed: false,
    };
    if (isStripeEnabled()) {
      const customer = await stripe.customers.create({
        email: profile.email,
        name: profile.name,
      });
      newUser.stripeCustomerId = customer.id;
    }
    await createUser(newUser);
  } else {
    await updateUserSession(user, sessionId);
  }
}

export default {
  name: "kv-oauth",
  routes: [
    {
      path: "/signin/google",
      handler: async (req) => await googleSignIn(req),
    },
    {
      path: "/signin/facebook",
      handler: async (req) => await facebookSignIn(req),
    },
    {
      path: "/signin/clerk",
      handler: async (req) => await clerkSignIn(req),
    },
    {
      path: "/google/callback",
      handler: async (req) => {
        const { response, sessionId, tokens } = await googleHandleCallback(req);
        if (tokens?.accessToken && sessionId) {
          const profile = await getGoogleUser(tokens.accessToken);
          await setUserProfile(sessionId, profile);
          await handleUserCreation(profile, sessionId);
        }
        return response;
      },
    },
    {
      path: "/facebook/callback",
      handler: async (req) => {
        const { response, sessionId, tokens } = await facebookHandleCallback(
          req
        );
        if (tokens?.accessToken && sessionId) {
          const profile = await getFacebookUser(tokens.accessToken);
          await setUserProfile(sessionId, profile);
          await handleUserCreation(profile, sessionId);
        }
        return response;
      },
    },
    {
      path: "/clerk/callback",
      handler: async (req) => {
        const { response, sessionId, tokens } = await clerkHandleCallback(req);
        if (tokens?.accessToken && sessionId) {
          const profile = await getClerkUser(tokens.accessToken);
          profile.id = normalizeUserId(profile);
          await setUserProfile(sessionId, profile);
          await handleUserCreation(profile, sessionId);
        }
        return response;
      },
    },
    {
      path: "/signout",
      handler: async (req) => {
        await googleSignOut(req);
        await facebookSignOut(req);
        return await clerkSignOut(req);
      },
    },
    {
      path: "/protected",
      handler: async (req) => {
        const sessionId =
          (await googleGetSessionId(req)) ||
          (await facebookGetSessionId(req)) ||
          (await clerkGetSessionId(req));
        if (sessionId === undefined) {
          return new Response("Unauthorized", { status: 401 });
        }
        const profile = await getUserProfileFromSession(sessionId);
        if (!profile) {
          return new Response("Profile not found", { status: 404 });
        }
        return new Response(
          `Welcome, ${profile.name || "User"}! You are allowed.`
        );
      },
    },
    {
      path: "/api/profile",
      handler: async (req) => {
        const sessionId =
          (await googleGetSessionId(req)) ||
          (await facebookGetSessionId(req)) ||
          (await clerkGetSessionId(req));
        if (sessionId === undefined) {
          return new Response("Unauthorized", { status: 401 });
        }
        const profile = await getUserProfileFromSession(sessionId);
        if (!profile) {
          return new Response("Profile not found", { status: 404 });
        }
        return new Response(JSON.stringify(profile), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  ],
} as Plugin;
