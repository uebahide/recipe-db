import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { assertSupabaseEnv, supabaseKey, supabaseSchema, supabaseUrl } from "./env";

export async function createClient() {
  // 先に cookies() を読んで、このページが毎回サーバーで描画される（ビルド時に実行されない）ようにする
  const cookieStore = await cookies();
  assertSupabaseEnv();
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      db: { schema: supabaseSchema },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Component から呼ばれた場合は書き込めない。middleware がセッションを更新する。
          }
        },
      },
    },
  );
}
