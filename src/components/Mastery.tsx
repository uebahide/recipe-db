import { MASTERY } from "@/lib/labels";
import type { Mastery as M } from "@/lib/types";

export default function MasteryBadge({ mastery }: { mastery: M | undefined }) {
  const m = MASTERY[mastery ?? "untried"];
  if (m.level === 0) return <span className="lvl none">{m.label}</span>;
  return (
    <span className="lvl" title={`熟練度 ${m.level} / 4`}>
      {m.label} <span className="dots" aria-hidden>{"●".repeat(m.level)}{"○".repeat(4 - m.level)}</span>
    </span>
  );
}
