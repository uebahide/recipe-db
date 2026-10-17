"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOut({ email }: { email: string }) {
  const router = useRouter();
  return (
    <button
      className="btn sm ghost"
      title={email}
      onClick={async () => {
        await createClient().auth.signOut();
        router.replace("/login");
        router.refresh();
      }}
    >
      ログアウト
    </button>
  );
}
