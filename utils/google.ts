// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.
import { createGoogleOAuthConfig } from "@deno/kv-oauth";
import { BadRequestError } from "@/utils/http.ts";

export function isGoogleSetup() {
  try {
    createGoogleOAuthConfig({
      redirectUri: `${Deno.env.get("REDIRECT_URI")}/google/callback`,
      scope: "profile email",
    });
    return true;
  } catch {
    return false;
  }
}

interface GoogleUser {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

/**
 * Returns the Google profile information of the user with the given access token.
 *
 * @see {@link https://developers.google.com/identity/protocols/oauth2/openid-connect#obtainuserinfo}
 *
 * @example
 * ```ts
 * import { getGoogleUser } from "@/utils/google.ts";
 *
 * const user = await getGoogleUser("<access token>");
 * user.email; // Returns "user@example.com"
 * user.name; // Returns "John Doe"
 * ```
 */
export async function getGoogleUser(accessToken: string): Promise<GoogleUser> {
  const resp = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) {
    const { error } = await resp.json();
    throw new BadRequestError(error.message);
  }
  return await resp.json();
}
