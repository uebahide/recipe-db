"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function FavoriteButton({ id, initial }: { id: string; initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="btn sm"
      aria-pressed={on}
      disabled={busy}
      style={on ? { color: "var(--chili)", borderColor: "var(--chili)" } : undefined}
      onClick={async () => {
        setBusy(true);
        const next = !on;
        const { error } = await createClient().from("recipes").update({ is_favorite: next }).eq("id", id);
        if (!error) setOn(next);
        setBusy(false);
      }}
    >
      {on ? "♥ お気に入り" : "♡ お気に入りに追加"}
    </button>
  );
}
