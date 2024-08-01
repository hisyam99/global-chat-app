// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.
import { createClerkOAuthConfig } from "@deno/kv-oauth";
import { BadRequestError } from "@/utils/http.ts";

export function isClerkSetup() {
  try {
    createClerkOAuthConfig({
      redirectUri: `${Deno.env.get("REDIRECT_URI")}/clerk/callback`,
      scope: "email profile public_metadata",
    });
    return true;
  } catch {
    return false;
  }
}

interface ClerkUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  // Add any other fields you expect from Clerk's user profile
}

/**
 * Returns the Clerk profile information of the user with the given access token.
 *
 * @example
 * ```ts
 * import { getClerkUser } from "@/utils/clerk.ts";
 *
 * const user = await getClerkUser("<access token>");
 * user.email; // Returns "user@example.com"
 * user.name; // Returns "John Doe"
 * ```
 */
export async function getClerkUser(accessToken: string): Promise<ClerkUser> {
  const resp = await fetch(`${Deno.env.get("CLERK_DOMAIN")}/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) {
    const error = await resp.text();
    throw new BadRequestError(error);
  }
  return await resp.json();
}
