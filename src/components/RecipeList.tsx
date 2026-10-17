"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CATEGORIES, SEASONS, TASTES, currentSeason, label, totalMinutes, type TasteKey } from "@/lib/labels";
import type { RecipeCard } from "@/lib/types";
import MasteryBadge from "./Mastery";
import SignOut from "./SignOut";

type Sort = "updated" | "cooked" | "quick";

// 味の絞り込みは「その味が 3 以上」。さっぱりだけは「こってり 1 以下」
const TASTE_FILTERS: { key: string; label: string; test: (r: RecipeCard) => boolean }[] = [
  ...TASTES.filter(([k]) => k !== "taste_umami").map(([k, l]) => ({ key: k, label: l, test: (r: RecipeCard) => r[k as TasteKey] >= 3 })),
  { key: "light", label: "さっぱり", test: (r) => r.taste_rich <= 1 },
];

function toggle(list: string[], v: string) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

export default function RecipeList({ recipes, email, loadError }: { recipes: RecipeCard[]; email: string; loadError: string | null }) {
  const [q, setQ] = useState("");
  const [cats, setCats] = useState<string[]>([]);
  const [seasons, setSeasons] = useState<string[]>([]);
  const [tastes, setTastes] = useState<string[]>([]);
  const [favOnly, setFavOnly] = useState(false);
  const [quick, setQuick] = useState(false);
  const [sort, setSort] = useState<Sort>("updated");
  const now = currentSeason();

  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list = recipes.filter((r) => {
      if (query && !JSON.stringify([r.title, r.description, r.tags, r.situations, r.tips]).toLowerCase().includes(query)) return false;
      if (cats.length && !cats.includes(r.category)) return false;
      if (seasons.length && !seasons.some((s) => r.seasons.includes(s))) return false;
      if (tastes.length && !tastes.every((k) => TASTE_FILTERS.find((t) => t.key === k)!.test(r))) return false;
      if (favOnly && !r.is_favorite) return false;
      if (quick && !((totalMinutes(r) ?? 999) <= 20)) return false;
      return true;
    });
    if (sort === "cooked") list.sort((a, b) => (b.stats?.cook_count ?? 0) - (a.stats?.cook_count ?? 0));
    if (sort === "quick") list.sort((a, b) => (totalMinutes(a) ?? 999) - (totalMinutes(b) ?? 999));
    return list;
  }, [recipes, q, cats, seasons, tastes, favOnly, quick, sort]);

  const filtered = q || cats.length || seasons.length || tastes.length || favOnly || quick;
  const clear = () => {
    setQ("");
    setCats([]);
    setSeasons([]);
    setTastes([]);
    setFavOnly(false);
    setQuick(false);
  };

  return (
    <main className="wrap">
      <header className="top">
        <div className="brand">
          <h1>レシピDB</h1>
          <small>{recipes.length}品</small>
        </div>
        <SignOut email={email} />
      </header>

      {loadError && <p className="err">レシピを読み込めませんでした（{loadError}）。少し待ってから開き直してください。</p>}

      {recipes.length === 0 && !loadError ? (
        <section className="empty">
          <h2>最初のレシピを登録しましょう</h2>
          <p>材料と作り方に加えて、季節や天気、味の傾向、注意点も残せます。登録したレシピは、あとから条件で探せます。</p>
          <Link className="btn primary" href="/recipes/new">＋ レシピを追加</Link>
        </section>
      ) : (
        <>
          <section className="filters" aria-label="レシピを探す">
            <input className="search" type="search" placeholder="料理名、タグ、シチュエーションで探す" value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="frow">
              <span className="label">季節</span>
              <div className="chips">
                {SEASONS.map(([v, l]) => (
                  <button key={v} className="chip" aria-pressed={seasons.includes(v)} onClick={() => setSeasons(toggle(seasons, v))}>
                    {l}{v === now && "（今）"}
                  </button>
                ))}
              </div>
            </div>
            <div className="frow">
              <span className="label">種類</span>
              <div className="chips">
                {CATEGORIES.map(([v, l]) => (
                  <button key={v} className="chip" aria-pressed={cats.includes(v)} onClick={() => setCats(toggle(cats, v))}>{l}</button>
                ))}
              </div>
            </div>
            <div className="frow">
              <span className="label">味</span>
              <div className="chips">
                {TASTE_FILTERS.map((t) => (
                  <button key={t.key} className="chip" aria-pressed={tastes.includes(t.key)} onClick={() => setTastes(toggle(tastes, t.key))}>{t.label}</button>
                ))}
              </div>
            </div>
            <div className="frow">
              <span className="label">その他</span>
              <div className="chips">
                <button className="chip" aria-pressed={quick} onClick={() => setQuick(!quick)}>20分以内</button>
                <button className="chip" aria-pressed={favOnly} onClick={() => setFavOnly(!favOnly)}>♥ お気に入り</button>
              </div>
            </div>
          </section>

          <div className="fhead">
            <span className="count">
              {shown.length}品{filtered ? `（${recipes.length}品中）` : ""}
              {filtered ? <> · <button className="btn sm ghost" onClick={clear}>条件をクリア</button></> : null}
            </span>
            <select className="field" style={{ width: "auto" }} value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="並び順">
              <option value="updated">新しい順</option>
              <option value="cooked">よく作る順</option>
              <option value="quick">早くできる順</option>
            </select>
          </div>

          {shown.length === 0 ? (
            <p className="muted">条件に合うレシピがありません。条件を減らしてみてください。</p>
          ) : (
            <div className="grid">
              {shown.map((r) => {
                const mins = totalMinutes(r);
                return (
                  <Link key={r.id} href={`/recipes/${r.id}`} className="card">
                    <div className="thumb">
                      {r.photoUrl ? <img src={r.photoUrl} alt="" loading="lazy" /> : <span className="initial">{r.title.slice(0, 1)}</span>}
                      {r.is_favorite && <span className="fav" aria-label="お気に入り">♥</span>}
                    </div>
                    <div className="bd">
                      <h3>{r.title}</h3>
                      <div className="meta">
                        <span>{label(CATEGORIES, r.category)}</span>
                        {mins && <span><b>{mins}</b>分</span>}
                        <span>難易度 <b>{r.difficulty}</b></span>
                      </div>
                      <div><MasteryBadge mastery={r.stats?.mastery} /></div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}

      <Link className="btn primary fab" href="/recipes/new">＋ レシピを追加</Link>
    </main>
  );
}
