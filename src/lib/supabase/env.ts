// Supabase の画面に出るキー名は時期によって違うので、どちらでも読めるようにする。
// NEXT_PUBLIC_ の値はビルド時に埋め込まれるため、process.env.XXX と直接書く必要がある。
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  "";

// 共有DB（uchinooshi）の中で、このアプリが使うスキーマ。DB の定義は uebahide/supabase-db にある。
export const supabaseSchema = "recipe";

export function assertSupabaseEnv() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase の接続情報がありません。.env.local に NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY（または NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY）を書いて、npm run dev を起動し直してください。",
    );
  }
}
