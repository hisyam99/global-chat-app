// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.
import { createFacebookOAuthConfig } from "@deno/kv-oauth";
import { BadRequestError } from "@/utils/http.ts";

export function isFacebookSetup() {
  try {
    createFacebookOAuthConfig({
      redirectUri: `${Deno.env.get("REDIRECT_URI")}/facebook/callback`,
      scope: "public_profile,email",
    });
    return true;
  } catch {
    return false;
  }
}

interface FacebookUser {
  id: string;
  name: string;
  email: string;
}

export async function getFacebookUser(accessToken: string): Promise<FacebookUser> {
  const resp = await fetch(
    "https://graph.facebook.com/me?fields=id,name,email",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!resp.ok) {
    const { error } = await resp.json();
    throw new BadRequestError(error.message);
  }
  return await resp.json() as FacebookUser;
}