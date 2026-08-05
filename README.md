# 予定管理・通知アプリ

個人利用向けの予定登録・一覧確認・事前プッシュ通知アプリ。要件定義は [`docs/requirements.md`](./docs/requirements.md) を参照。

このリポジトリは MVP フェーズ（F-01〜F-06、要件定義書の優先度「高」）を実装しています。

- F-01 予定登録 / F-02 予定一覧表示 / F-03 予定詳細表示 / F-04 予定編集 / F-05 予定削除
- F-06 プッシュ通知（Web Push, VAPID）

カレンダー表示・カテゴリ分け・繰り返し設定・完了履歴などは v1.0/v2.0 フェーズとして要件定義書にのみ記載され、未実装です。

## 技術スタック

- Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS
- Supabase（Postgres + Auth、RLSでユーザーごとにデータを分離）
- Web Push API（VAPID）+ Service Worker によるプッシュ通知
- Vercel（ホスティング + Cron Jobs）

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数

`.env.example` を `.env.local` にコピーして値を埋める。

```bash
cp .env.example .env.local
```

| 変数 | 取得方法 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabaseダッシュボード > Project Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | 同上（**秘密情報**。cron からの通知送信でRLSを越えて全ユーザーのデータを扱うために使用。クライアントには絶対露出しない） |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | `npx web-push generate-vapid-keys` で生成 |
| `VAPID_SUBJECT` | `mailto:自分のメールアドレス` |
| `CRON_SECRET` | 任意のランダム文字列。`/api/cron/send-reminders` を保護する |

### 3. Supabaseのテーブル作成

`supabase/migrations/` にSQLを配置済み。Supabase CLIがあれば：

```bash
supabase link --project-ref <project-ref>
supabase db push
```

CLIを使わない場合は、SQL Editorで `supabase/migrations/*.sql` を順番に実行する。

### 4. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 を開く。初回は `/login` から「新規登録」でアカウントを作成する（このアプリは個人利用前提のため、メール+パスワードでの簡易認証のみ）。

## プッシュ通知の仕組み（F-06）

1. ログイン後トップページの「プッシュ通知を有効にする」ボタンでブラウザの通知許可 → Service Worker (`public/sw.js`) 経由でプッシュ購読を作成し、`push_subscriptions` テーブルに保存。
2. `/api/cron/send-reminders` が「まだ通知していない・完了していない・通知予定時刻を過ぎた」予定を探し、該当ユーザーの購読先へ Web Push を送信、送信済みとして `notified_at` を記録する。
3. 本番では `vercel.json` の Cron Job がこのエンドポイントを5分おきに叩く。

**既知の制約**: 要件定義書では「通知は指定時刻±1分以内に配信」を求めているが、Vercel Hobby（無料）プランの Cron Job は頻度に制限がある場合がある。無料枠のまま高頻度に実行したい場合は、[cron-job.org](https://cron-job.org) 等の外部無料Cronサービスから `GET /api/cron/send-reminders` を `Authorization: Bearer <CRON_SECRET>` 付きで毎分叩く方法に切り替えることを推奨。

## デプロイ（Vercel）

1. このリポジトリをGitHubにpushし、Vercelでインポート。
2. `.env.local` と同じ環境変数をVercelのProject Settings > Environment Variablesに設定。
3. `vercel.json` のCron設定は自動的に有効化される（Vercelダッシュボードの Cron Jobs で確認・調整可能）。
4. SupabaseダッシュボードのAuth設定で、本番URLを Redirect URLs / Site URL に追加する。

## ディレクトリ構成

```
src/
  app/
    (main)/          認証必須ページ（ホーム・予定一覧・登録・詳細・編集）
    login/            ログイン・新規登録
    actions/          Server Actions（認証・予定CRUD）
    api/
      push/           プッシュ購読の登録・解除
      cron/            リマインド送信バッチ
  components/          UIコンポーネント
  lib/
    supabase/          Supabaseクライアント（browser/server/service-role）
    data/               データ取得（Server Components用）
    push.ts             Web Push送信
  proxy.ts               認証ガード（Next.js 16の旧middleware）
supabase/migrations/    DBスキーマ
public/sw.js             Service Worker（push通知）
```
