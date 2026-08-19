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

認証は **一旦なし**。

将来的な SEO 対策を見据え、React Router v8 の **Framework Mode(SSR)へ移行する**
方針が決定している。移行は複数の PR に分割して段階的に進める(詳細は移行計画を参照)。
移行完了までの間は、本ドキュメントの記述と実装が一時的に乖離する箇所がある点に注意。

## 技術スタックとバージョン

### Frontend
- React 19.2.7+
- react-router 8.2.0+ (**react-router-dom は使わない**。v8 で廃止されたパッケージ)
- Vite 7.0.0+
- TypeScript
- Node.js 22.22.0+
- **Framework Mode(SSR)を使用する**(`loader` / `action` は Data Mode 時代と同じ形で
  ルートごとのファイルに実装しつつ、`react-router.config.ts` の `ssr: true` により
  全ルートをサーバーサイドレンダリングする)
  - 移行前は Data Mode(`createBrowserRouter`)のみを使用していたが、SEO 対策のため
    Framework Mode へ移行した(移行の背景・経緯は `docs/frontend-guide-for-rails-engineers.md`
    10節を参照)
  - ファイルベースルーティングは使わず、`routes.ts` にルートを明示的に列挙する
    (Data Mode 時代の `router.tsx` と同じ「集中管理」の考え方を踏襲)
  - Declarative Mode(`useEffect` + fetch の素朴な書き方)は比較用に 1 画面
    (`/tasks-legacy`)だけ残す(SSR 対象ではあるが loader を持たないため、Framework Mode
    移行後も従来通り初回描画は空の状態から `useEffect` で描画される)

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

> **Note:** 以下は Data Mode 時代からの記述で、Framework Mode 移行が完了していません。
> `frontend/src/` は Framework Mode の標準に合わせて `frontend/app/` にリネームし、
> `router.tsx` / `main.tsx` は `routes.ts` / `root.tsx` / `entry.server.tsx` /
> `entry.client.tsx` に置き換わる予定。移行完了後にこのセクションを更新する。

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
   - GitHub PR の Description(本文)に、動作確認手順を必ず記載する。実装後に思い出して書くのではなく、
     PR作成/更新のタイミングで毎回記載する
   - 手順は Docker 環境だけで完結する形で書く(`docker build` / `docker run` / `docker-compose up` など)。
     ローカルに Ruby や Node がインストールされていない前提でも再現できるようにする
   - 実装作業を行った環境で Docker(dockerd)が使えず、実際に `docker build` / `docker run` を
     実行できなかった場合は、その旨を PR に明記した上で、レビュー側が実行する前提の手順として記載する
   - `docker-compose up` 後にどのコマンド・URL で動作確認できるかを含める(該当PRで docker-compose が
     未導入の場合は、その回のPRで実行可能な `docker build` / `docker run` ベースの手順で代替する)
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
- **ユーザーはフロントエンド初心者。フロントエンドのコードは日本語コメントを多めに書く**
  - `loader` / `action` / `useFetcher` など React Router 固有の概念は、それが何をしているか
    (いつ呼ばれるか、何を返すか)がコメントだけで追えるように説明する
  - 「何をしているか」だけでなく「なぜそう書くか」(素の `useEffect` + fetch と何が違うか等)も
    要所で補足する

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

- 認証・認可の実装
- 本番デプロイ設定(ECS Fargate 等への反映)。Framework Mode 移行後の
  本番相当ビルド検証も、あくまで Docker 上でのローカル確認に限定する
- 既存の本番 Rails アプリ(Explorer / OEM Admin など)への一切の変更・参照
