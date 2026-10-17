import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import FavoriteButton from "@/components/FavoriteButton";
import MasteryBadge from "@/components/Mastery";
import { CATEGORIES, CUISINES, SEASONS, TASTES, WEATHERS, label } from "@/lib/labels";
import { loadRecipe } from "@/lib/load-recipe";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const fmtTimer = (sec: number) => (sec % 60 === 0 ? `${sec / 60}分` : `${Math.floor(sec / 60)}分${sec % 60}秒`);

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await loadRecipe(supabase, id);
  if (!data) notFound();
  const { recipe: r, ingredients, steps, stats, photoUrl } = data;

  const tags = [
    ...SEASONS.filter(([v]) => r.seasons.includes(v)).map(([, l]) => l),
    ...WEATHERS.filter(([v]) => r.weathers.includes(v)).map(([, l]) => l),
    ...r.situations,
    ...r.tags.map((t) => `#${t}`),
  ];
  let group: string | null = null;

  return (
    <main className="wrap">
      <div className="top">
        <Link className="back" href="/">‹ レシピ一覧</Link>
        <Link className="btn sm" href={`/recipes/${r.id}/edit`}>編集</Link>
      </div>

      <article className="sheet">
        <div className="hero-img">{photoUrl ? <img src={photoUrl} alt={r.title} /> : <span className="initial">{r.title.slice(0, 1)}</span>}</div>
        <div className="head">
          <div className="top">
            <h1>{r.title}</h1>
            <FavoriteButton id={r.id} initial={r.is_favorite} />
          </div>
          <div className="meta">
            <span>{[label(CUISINES, r.cuisine), label(CATEGORIES, r.category)].filter(Boolean).join("・")}</span>
            {r.prep_min != null && <span>下ごしらえ <b>{r.prep_min}</b>分</span>}
            {r.cook_min != null && <span>調理 <b>{r.cook_min}</b>分</span>}
            {r.servings != null && <span><b>{r.servings}</b>人分</span>}
            <span>難易度 <b>{r.difficulty}</b> / 5</span>
            <MasteryBadge mastery={stats?.mastery} />
          </div>
          {r.description && <p className="desc">{r.description}</p>}
          {tags.length > 0 && <div className="chips">{tags.map((t) => <span key={t} className="chip static">{t}</span>)}</div>}
        </div>

        {TASTES.some(([k]) => r[k] > 0) && (
          <section className="sec">
            <h2>味の傾向</h2>
            <div className="taste">
              {TASTES.map(([k, l]) => (
                <div key={k} style={{ display: "contents" }}>
                  <span>{l}</span>
                  <span className={`bar${k === "taste_spicy" ? " spicy" : ""}`}><i style={{ width: `${(r[k] / 5) * 100}%` }} /></span>
                  <span className="n">{r[k]}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {r.tips && (
          <section className="sec">
            <div className="warn"><b>注意点・コツ</b>{"\n"}{r.tips}</div>
          </section>
        )}

        <div className="cols">
          <section className="sec">
            <h2>材料{r.servings != null && <small className="muted">{r.servings}人分</small>}</h2>
            {ingredients.length === 0 ? (
              <p className="muted">まだ材料が登録されていません。</p>
            ) : (
              <div className="ing">
                {ingredients.map((g, i) => {
                  const showGroup = g.group_label && g.group_label !== group;
                  group = g.group_label;
                  return (
                    <div key={i} style={{ display: "contents" }}>
                      {showGroup && <div className="g">{g.group_label}</div>}
                      <div className="r">
                        <span>{g.name}{g.note && <small>（{g.note}）</small>}</span>
                        <span>{g.amount}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
          <section className="sec">
            <h2>作り方</h2>
            {steps.length === 0 ? (
              <p className="muted">まだ手順が登録されていません。</p>
            ) : (
              <ol className="steps">
                {steps.map((s, i) => (
                  <li key={i}>
                    <div>
                      <p>{s.body}</p>
                      {s.timer_sec ? <span className="timer">⏱ {fmtTimer(s.timer_sec)}</span> : null}
                      {s.caution && <div className="warn" style={{ marginTop: 6 }}><b>注意</b> {s.caution}</div>}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <div className="foot">
          <span className="muted" style={{ fontSize: ".85rem" }}>
            {stats && stats.cook_count > 0 ? `${stats.cook_count}回作りました・最後は ${stats.last_cooked_on}` : "まだ作った記録はありません"}
          </span>
          {r.source_url && <a className="btn sm ghost" href={r.source_url} target="_blank" rel="noreferrer">元のレシピ ↗</a>}
        </div>
      </article>
    </main>
  );
}
