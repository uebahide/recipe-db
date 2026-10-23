# レシピDB

作った料理を忘れないためのレシピ帳です。Next.js で作り、Vercel で動かし、iPhone のホーム画面に追加して使えます。

- 材料、手順（タイマー・注意点つき）、コツ、難易度、種類、季節・天気・シチュエーション、味（甘い・辛い・酸っぱい…）を記録
- 季節・種類・味・時間・お気に入りで絞り込み、迷ったときに探せる
- 作った回数から熟練度（未挑戦 → 初挑戦 → 練習中 → 得意 → 十八番）を表示
- 献立カレンダー（`/plan`）: 日付をタップして朝・昼・夜・間食の料理を入れる。登録レシピから選ぶか、外食などは自由入力。「作った」を押すと調理記録が残り熟練度に反映される
- 買い物リスト（`/plan/shopping`）: 1週間分の「予定」の献立から材料をまとめ、チェックしながら買い物できる
- 今後: 調理モードと調理記録（STEP 2）、天気や気分から AI が今日の一品を選ぶ・料理の傾向分析（STEP 3）

## データベース

Supabase の **uchinooshi** プロジェクトを「うちの推し」アプリと共有しています。

- このアプリのテーブルはすべて `recipe` スキーマにあります（`recipes` / `ingredients` / `steps` / `cook_logs` / `meal_plans` / `ai_picks` / `ai_insights`、熟練度はビュー `recipe_stats`）
- ログインは共通（`auth.users`）。うちの推しのアカウントでそのまま入れます
- 写真は Storage の `recipe-photos` バケット（非公開）に `<user_id>/<recipe_id>.jpg` で保存
- テーブルの変更は **このリポジトリではなく** [uebahide/supabase-db](https://github.com/uebahide/supabase-db) の `supabase/migrations` に追加します

アプリ側は `src/lib/supabase/env.ts` の `supabaseSchema = "recipe"` で、どのスキーマを読むかを決めています。

## 動かし方

```bash
cp .env.example .env.local   # uchinooshi の URL と anon (publishable) キーを入れる
npm install
npm run dev
```

## Vercel

1. Vercel でこのリポジトリを Import
2. Environment Variables に `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY`（uchinooshi の値）を設定
3. Supabase の Authentication > URL Configuration > Redirect URLs に `https://<vercel のドメイン>/**` を追加
