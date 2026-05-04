import type { User } from "@supabase/supabase-js";

import { getSupabaseServerClient } from "./supabase/server";

export type VerifiedRequestUser = {
  token: string;
  user: User;
};

export async function getVerifiedRequestUser(request: Request): Promise<VerifiedRequestUser> {
  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    throw new Error("Missing Supabase access token.");
  }

  const token = match[1];
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error("Invalid or expired Supabase access token.");
  }

  return { token, user };
}
