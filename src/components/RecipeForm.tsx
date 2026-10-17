"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CATEGORIES, CUISINES, SEASONS, SITUATION_SUGGESTIONS, TASTES, WEATHERS, type TasteKey } from "@/lib/labels";
import { PHOTO_BUCKET, resizeImage } from "@/lib/photos";
import { createClient } from "@/lib/supabase/client";
import type { Ingredient, Recipe, Step } from "@/lib/types";

type Props = {
  userId: string;
  recipe?: Recipe;
  ingredients?: Ingredient[];
  steps?: Step[];
  photoUrl?: string | null;
};

type IngRow = { key: string; group_label: string; name: string; amount: string; note: string };
type StepRow = { key: string; body: string; timer_min: string; caution: string };

const newKey = () => crypto.randomUUID();
const emptyIng = (): IngRow => ({ key: newKey(), group_label: "", name: "", amount: "", note: "" });
const emptyStep = (): StepRow => ({ key: newKey(), body: "", timer_min: "", caution: "" });
const num = (s: string) => (s.trim() === "" ? null : Number(s));
const text = (s: string) => (s.trim() === "" ? null : s.trim());

export default function RecipeForm({ userId, recipe, ingredients = [], steps = [], photoUrl = null }: Props) {
  const router = useRouter();
  const r = recipe;

  const [title, setTitle] = useState(r?.title ?? "");
  const [description, setDescription] = useState(r?.description ?? "");
  const [category, setCategory] = useState(r?.category ?? "main");
  const [cuisine, setCuisine] = useState(r?.cuisine ?? "");
  const [difficulty, setDifficulty] = useState(r?.difficulty ?? 2);
  const [servings, setServings] = useState(r?.servings?.toString() ?? "");
  const [prepMin, setPrepMin] = useState(r?.prep_min?.toString() ?? "");
  const [cookMin, setCookMin] = useState(r?.cook_min?.toString() ?? "");
  const [taste, setTaste] = useState<Record<TasteKey, number>>(
    () => Object.fromEntries(TASTES.map(([k]) => [k, r?.[k] ?? 0])) as Record<TasteKey, number>,
  );
  const [seasons, setSeasons] = useState<string[]>(r?.seasons ?? []);
  const [weathers, setWeathers] = useState<string[]>(r?.weathers ?? []);
  const [situations, setSituations] = useState<string[]>(r?.situations ?? []);
  const [tags, setTags] = useState<string[]>(r?.tags ?? []);
  const [situationDraft, setSituationDraft] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [tips, setTips] = useState(r?.tips ?? "");
  const [sourceUrl, setSourceUrl] = useState(r?.source_url ?? "");

  const [ings, setIngs] = useState<IngRow[]>(() =>
    ingredients.length
      ? ingredients.map((i) => ({ key: newKey(), group_label: i.group_label ?? "", name: i.name, amount: i.amount ?? "", note: i.note ?? "" }))
      : [emptyIng(), emptyIng(), emptyIng()],
  );
  const [stepRows, setStepRows] = useState<StepRow[]>(() =>
    steps.length
      ? steps.map((s) => ({ key: newKey(), body: s.body, timer_min: s.timer_sec ? String(s.timer_sec / 60) : "", caution: s.caution ?? "" }))
      : [emptyStep(), emptyStep()],
  );

  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(photoUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const addFree = (list: string[], set: (v: string[]) => void, draft: string, clear: () => void) => {
    const v = draft.trim().replace(/^#/, "");
    if (v && !list.includes(v)) set([...list, v]);
    clear();
  };

  const updateIng = (key: string, patch: Partial<IngRow>) => setIngs((rows) => rows.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  const updateStep = (key: string, patch: Partial<StepRow>) =>
    setStepRows((rows) => rows.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  function pickPhoto(file: File | undefined) {
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("料理名を入れてください");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const id = r?.id ?? crypto.randomUUID();

    try {
      let photo_path = r?.photo_path ?? null;
      if (photo) {
        const blob = await resizeImage(photo);
        photo_path = `${userId}/${id}.jpg`;
        const up = await supabase.storage.from(PHOTO_BUCKET).upload(photo_path, blob, { upsert: true, contentType: "image/jpeg" });
        if (up.error) throw up.error;
      }

      const row = {
        id,
        title: title.trim(),
        description: text(description),
        category,
        cuisine: cuisine || null,
        difficulty,
        servings: num(servings),
        prep_min: num(prepMin),
        cook_min: num(cookMin),
        ...taste,
        seasons,
        weathers,
        situations,
        tags,
        tips: text(tips),
        source_url: text(sourceUrl),
        photo_path,
        updated_at: new Date().toISOString(),
      };
      const res = await supabase.from("recipes").upsert(row);
      if (res.error) throw res.error;

      // 材料と手順は「全部消して入れ直す」。並び順をそのまま position にする
      const del = await Promise.all([
        supabase.from("ingredients").delete().eq("recipe_id", id),
        supabase.from("steps").delete().eq("recipe_id", id),
      ]);
      for (const d of del) if (d.error) throw d.error;

      const ingRows = ings
        .filter((i) => i.name.trim())
        .map((i, n) => ({ recipe_id: id, position: n + 1, group_label: text(i.group_label), name: i.name.trim(), amount: text(i.amount), note: text(i.note) }));
      const stRows = stepRows
        .filter((s) => s.body.trim())
        .map((s, n) => {
          const m = num(s.timer_min);
          return { recipe_id: id, position: n + 1, body: s.body.trim(), timer_sec: m ? Math.round(m * 60) : null, caution: text(s.caution) };
        });
      const ins = await Promise.all([
        ingRows.length ? supabase.from("ingredients").insert(ingRows) : null,
        stRows.length ? supabase.from("steps").insert(stRows) : null,
      ]);
      for (const i of ins) if (i?.error) throw i.error;

      router.push(`/recipes/${id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存できませんでした");
      setSaving(false);
    }
  }

  async function remove() {
    if (!r) return;
    setSaving(true);
    const supabase = createClient();
    const res = await supabase.from("recipes").delete().eq("id", r.id);
    if (res.error) {
      setError(res.error.message);
      setSaving(false);
      return;
    }
    if (r.photo_path) await supabase.storage.from(PHOTO_BUCKET).remove([r.photo_path]);
    router.push("/");
    router.refresh();
  }

  return (
    <main className="wrap">
      <div className="top">
        <Link className="back" href={r ? `/recipes/${r.id}` : "/"}>‹ {r ? "戻る" : "レシピ一覧"}</Link>
      </div>

      <form className="sheet form" onSubmit={save}>
        <section className="sec">
          <input className="titlein" placeholder="料理名（例: 豚の生姜焼き）" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <textarea className="field" rows={2} placeholder="ひとことメモ（どんな料理か、誰に好評だったか など）" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="photo-pick">
            <div className="prev">{preview ? <img src={preview} alt="" /> : "写真なし"}</div>
            <label className="btn ghost sm">
              {preview ? "写真を変える" : "写真を選ぶ"}
              <input type="file" accept="image/*" hidden onChange={(e) => pickPhoto(e.target.files?.[0])} />
            </label>
          </div>
        </section>

        <section className="sec">
          <h2>基本</h2>
          <div className="grid2">
            <label className="fld">
              <span className="label">種類</span>
              <select className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="fld">
              <span className="label">ジャンル</span>
              <select className="field" value={cuisine} onChange={(e) => setCuisine(e.target.value)}>
                <option value="">未設定</option>
                {CUISINES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="fld">
              <span className="label">難易度</span>
              <select className="field" value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))}>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}
              </select>
            </label>
            <label className="fld">
              <span className="label">何人分</span>
              <input className="field" type="number" inputMode="numeric" min={1} value={servings} onChange={(e) => setServings(e.target.value)} />
            </label>
            <label className="fld">
              <span className="label">下ごしらえ（分）</span>
              <input className="field" type="number" inputMode="numeric" min={0} value={prepMin} onChange={(e) => setPrepMin(e.target.value)} />
            </label>
            <label className="fld">
              <span className="label">調理（分）</span>
              <input className="field" type="number" inputMode="numeric" min={0} value={cookMin} onChange={(e) => setCookMin(e.target.value)} />
            </label>
          </div>
        </section>

        <section className="sec">
          <h2>味</h2>
          {TASTES.map(([k, l]) => (
            <label key={k} className="slider">
              <span>{l}</span>
              <input type="range" min={0} max={5} value={taste[k]} onChange={(e) => setTaste({ ...taste, [k]: Number(e.target.value) })} />
              <output>{taste[k]}</output>
            </label>
          ))}
        </section>

        <section className="sec">
          <h2>いつ作る？</h2>
          <span className="label">季節</span>
          <div className="chips">
            {SEASONS.map(([v, l]) => (
              <button type="button" key={v} className="chip" aria-pressed={seasons.includes(v)} onClick={() => toggle(seasons, setSeasons, v)}>{l}</button>
            ))}
          </div>
          <span className="label">天気・気温</span>
          <div className="chips">
            {WEATHERS.map(([v, l]) => (
              <button type="button" key={v} className="chip" aria-pressed={weathers.includes(v)} onClick={() => toggle(weathers, setWeathers, v)}>{l}</button>
            ))}
          </div>
          <span className="label">シチュエーション</span>
          <div className="chips">
            {[...SITUATION_SUGGESTIONS, ...situations.filter((s) => !SITUATION_SUGGESTIONS.includes(s))].map((s) => (
              <button type="button" key={s} className="chip" aria-pressed={situations.includes(s)} onClick={() => toggle(situations, setSituations, s)}>{s}</button>
            ))}
          </div>
          <div className="adder">
            <input
              className="field"
              placeholder="ほかのシチュエーションを追加"
              value={situationDraft}
              onChange={(e) => setSituationDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  addFree(situations, setSituations, situationDraft, () => setSituationDraft(""));
                }
              }}
            />
            <button type="button" className="btn sm" onClick={() => addFree(situations, setSituations, situationDraft, () => setSituationDraft(""))}>追加</button>
          </div>
          <span className="label">タグ</span>
          {tags.length > 0 && (
            <div className="chips">
              {tags.map((t) => (
                <span key={t} className="chip static">
                  #{t}
                  <button type="button" className="x" aria-label={`${t} を外す`} onClick={() => setTags(tags.filter((x) => x !== t))}>×</button>
                </span>
              ))}
            </div>
          )}
          <div className="adder">
            <input
              className="field"
              placeholder="例: 作り置き向き、子ども好き"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  addFree(tags, setTags, tagDraft, () => setTagDraft(""));
                }
              }}
            />
            <button type="button" className="btn sm" onClick={() => addFree(tags, setTags, tagDraft, () => setTagDraft(""))}>追加</button>
          </div>
        </section>

        <section className="sec">
          <h2>材料</h2>
          <div className="rowed">
            {ings.map((i) => (
              <div key={i.key} className="irow">
                <input className="field" placeholder="グループ" aria-label="グループ（A、タレ など）" value={i.group_label} onChange={(e) => updateIng(i.key, { group_label: e.target.value })} />
                <input className="field" placeholder="材料" aria-label="材料" value={i.name} onChange={(e) => updateIng(i.key, { name: e.target.value })} />
                <input className="field" placeholder="分量" aria-label="分量" value={i.amount} onChange={(e) => updateIng(i.key, { amount: e.target.value })} />
                <button type="button" className="icon" aria-label="この材料を消す" onClick={() => setIngs(ings.filter((x) => x.key !== i.key))}>×</button>
              </div>
            ))}
          </div>
          <button type="button" className="btn ghost sm" onClick={() => setIngs([...ings, emptyIng()])}>＋ 材料を追加</button>
        </section>

        <section className="sec">
          <h2>作り方</h2>
          <div className="rowed">
            {stepRows.map((s, n) => (
              <div key={s.key} className="srow">
                <span className="n">{n + 1}</span>
                <div>
                  <textarea className="field" rows={2} placeholder="手順" aria-label={`手順 ${n + 1}`} value={s.body} onChange={(e) => updateStep(s.key, { body: e.target.value })} />
                  <div className="sub">
                    <input className="field" type="number" inputMode="decimal" min={0} step="0.5" placeholder="⏱ 分" aria-label="タイマー（分）" value={s.timer_min} onChange={(e) => updateStep(s.key, { timer_min: e.target.value })} />
                    <input className="field" placeholder="⚠ この手順の注意点" aria-label="この手順の注意点" value={s.caution} onChange={(e) => updateStep(s.key, { caution: e.target.value })} />
                  </div>
                </div>
                <button type="button" className="icon" aria-label="この手順を消す" onClick={() => setStepRows(stepRows.filter((x) => x.key !== s.key))}>×</button>
              </div>
            ))}
          </div>
          <button type="button" className="btn ghost sm" onClick={() => setStepRows([...stepRows, emptyStep()])}>＋ 手順を追加</button>
        </section>

        <section className="sec">
          <h2>コツ・注意点</h2>
          <textarea className="field" rows={3} placeholder="失敗しやすいところ、次に作るときに気をつけること" value={tips} onChange={(e) => setTips(e.target.value)} />
          <label className="fld">
            <span className="label">参考にしたページ</span>
            <input className="field" type="url" inputMode="url" placeholder="https://" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
          </label>
        </section>

        <section className="sec">
          {r &&
            (confirmDelete ? (
              <div className="confirm">
                このレシピを消しますか？元に戻せません。
                <button type="button" className="btn danger sm" onClick={remove} disabled={saving}>消す</button>
                <button type="button" className="btn ghost sm" onClick={() => setConfirmDelete(false)}>やめる</button>
              </div>
            ) : (
              <button type="button" className="btn ghost sm" onClick={() => setConfirmDelete(true)}>このレシピを削除</button>
            ))}
        </section>

        <div className="savebar">
          {error && <span className="err">{error}</span>}
          <Link className="btn ghost" href={r ? `/recipes/${r.id}` : "/"}>キャンセル</Link>
          <button className="btn primary" disabled={saving}>{saving ? "保存中…" : "保存"}</button>
        </div>
      </form>
    </main>
  );
}
