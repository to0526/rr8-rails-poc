# CLAUDE.md

このファイルは、このリポジトリで Claude Code に実装を依頼する際のガイドラインです。

## プロジェクトの目的

React Router v8(Data Mode)の検証用リポジトリです。既存の本番プロジェクトとは切り離した、
**新規に作成する Rails(API モード)+ React Router v8 フロントエンド** という構成を
Docker 環境上で動かし、実運用への採用可否を判断するための PoC です。

バックエンドは `rails new --api` で新規に作成する、このリポジトリ専用の Rails アプリ。
既存の本番 Rails アプリ(Explorer / OEM Admin など)とは無関係で、コードの流用や
依存関係も持たない。

検証したい主なポイント:

- `loader` / `action` を使った Rails API とのデータ取得・更新のやり取り
- Rails 側のバリデーションエラー(422 など)を `action` の戻り値としてどう扱うか
- `useFetcher()` によるフォーム送信・楽観的 UI 更新との相性
- CORS 設定(`rack-cors`)を挟んだ場合の実際の挙動

認証は **一旦なし**。SEO や SSR が必要になった場合は Framework Mode への移行を
別途検討するが、現時点ではスコープ外。

## 技術スタックとバージョン

### Frontend
- React 19.2.7+
- react-router 8.2.0+ (**react-router-dom は使わない**。v8 で廃止されたパッケージ)
- Vite 7.0.0+
- TypeScript
- Node.js 22.22.0+
- **Data Mode のみを使用する**(`createBrowserRouter` + `loader` / `action`)
  - Framework Mode(SSR・ファイルベースルーティング)は使わない
  - Declarative Mode(`useEffect` + fetch の素朴な書き方)は比較用に 1 画面だけ残す想定

### Backend
- Ruby on Rails(`rails new --api` で新規作成。APIモード)
- 既存の本番 Rails アプリとは完全に独立した、このリポジトリ専用の新規アプリ
  - ビューは持たない。JSON API に徹する
  - Gemfile・DB スキーマ・設定はすべてこの検証用に最小構成で作る
    (既存アプリの Gemfile 等をコピーしない。必要な gem だけを都度追加する)
- `rack-cors` で CORS を設定(検証用オリジンのみ許可)

### Infra
- Docker / docker-compose でローカル環境を構築
  - `frontend` コンテナ(Vite dev server)
  - `backend` コンテナ(Rails)
  - `db` コンテナ(既存アプリの DB 種別に合わせる。MySQL 想定)
- 本番運用は想定しない(検証用途に限定)

## ディレクトリ構成(想定)

```
.
├── CLAUDE.md
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── app/
│   │   ├── controllers/api/v1/   # 新規APIアプリのコントローラ
│   │   └── models/               # 新規APIアプリのモデル
│   └── config/
│       ├── initializers/cors.rb
│       └── routes.rb
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── main.tsx
        ├── router.tsx             # createBrowserRouter 定義
        ├── routes/                # loader/action を持つルートコンポーネント
        ├── routes-legacy/         # 比較用: useEffect+fetch の従来型
        └── lib/
            └── api.ts             # fetch 共通ラッパー、エラーハンドリング
```

## 開発ワークフロー(最重要)

**このリポジトリでは実装を細かいステップに分割し、都度 PR を作成しながら進める。**
一度に大きな変更をまとめて実装しない。以下のルールを厳守すること。

1. **タスクを小さく分解する**
   - 1 PR = 1 つの検証観点、が目安(例: 「Rails 側の CORS 設定のみ」「一覧取得の loader のみ」
     「フォーム送信の action のみ」など)
   - 「Docker 環境構築」と「アプリケーションコード」も別 PR に分ける

2. **実装前に計画を提示する**
   - コードを書き始める前に、これから作成・変更するファイルと概要を箇条書きで示し、
     ユーザーの確認を得てから着手する

3. **1 PR ごとに動作確認手順を明記する**
   - `docker-compose up` 後にどのコマンド・URL で動作確認できるかを PR の説明に含める
   - 手動確認ポイント(ブラウザでの見え方、curl でのレスポンス例など)を書く

4. **PR のブランチ・コミット規約**
   - ブランチ名: `feature/<短い説明>` (例: `feature/rails-cors-setup`)
   - コミットメッセージは日本語で簡潔に、変更理由がわかるように書く
   - 1 コミットが大きくなりすぎないよう、論理的な単位で分ける

5. **迷ったら止まって聞く**
   - Data Mode か Framework Mode か迷うような設計判断、認証方式、DB スキーマ変更を
     伴う変更などは、実装前に確認を取ってから進める

## コーディング規約・方針

### Frontend
- `react-router` からのみ import する(`react-router-dom` は使用禁止)
- ルート定義は `router.tsx` に集約し、`loader` / `action` はルートごとのファイルに実装
- API 呼び出しは `lib/api.ts` の共通関数を経由する(個々のコンポーネントで直接 `fetch` しない)
- Rails のバリデーションエラー(422)は `action` 内でキャッチし、`useActionData()` で
  フォームにエラーメッセージを表示できる形に整形する

### Backend
- コントローラは `app/controllers/api/v1/` 以下に配置する
- レスポンスは JSON:API 的な形式にこだわらず、シンプルな JSON 構造で良い
  (例: `{ data: [...] }` / エラー時は `{ errors: {...} }`)
- Gemfile には検証に必要な最小限の gem のみを追加する(rack-cors など)。
  既存の本番アプリの Gemfile を参考にする場合も、そのままコピーせず必要な物だけ選ぶ

### 共通
- 認証は実装しない(このフェーズでは意図的にスコープ外)
- コメントは日本語で可。ただし変数名・関数名は英語を使う

## Docker 環境

- `docker-compose up` だけでフロント・バックエンドの両方が立ち上がる状態を目指す
- フロントは `http://localhost:5173`、バックエンド API は `http://localhost:3000/api/v1/...`
  を想定(ポート番号は実装時に調整可)
- `.env` や `.env.example` を用意し、CORS の許可オリジンなど環境依存の値は環境変数化する

## やらないこと(スコープ外の明示)

- Framework Mode の導入(SSR・typed routes)
- 認証・認可の実装
- 本番デプロイ設定(ECS Fargate 等への反映)
- 既存の本番 Rails アプリ(Explorer / OEM Admin など)への一切の変更・参照
