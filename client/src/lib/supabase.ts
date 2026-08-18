import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let clientPromise: Promise<SupabaseClient> | null = null;
let accessToken: string | null = null;

export function setSupabaseAccessToken(token: string | null) {
  accessToken = token;
}

export function getSupabaseAccessToken() {
  return accessToken;
}

export function getSupabaseBrowserClient() {
  if (!clientPromise) {
    clientPromise = fetch("/api/auth/supabase-config", { credentials: "include" })
      .then(async response => {
        if (!response.ok) throw new Error("StudentGPT authentication is unavailable.");
        return response.json() as Promise<{ url: string; anonKey: string }>;
      })
      .then(({ url, anonKey }) => createClient(url, anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      }));
  }
  return clientPromise;
}
