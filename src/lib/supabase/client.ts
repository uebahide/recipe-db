import { createBrowserClient } from "@supabase/ssr";
import { assertSupabaseEnv, supabaseKey, supabaseSchema, supabaseUrl } from "./env";

export function createClient() {
  assertSupabaseEnv();
  return createBrowserClient(
    supabaseUrl,
    supabaseKey,
    { db: { schema: supabaseSchema } },
  );
}
