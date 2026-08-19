# Framework Mode 移行 実行計画

React Router v8 の Data Mode から Framework Mode(SSR)への移行作業を追跡するための
ドキュメント。各 PR は個別のチャットセッションで対応することを想定しているため、
**この計画自体が唯一の引き継ぎ情報**になる。新しいセッションでこの移行作業を
担当する場合は、必ずこのファイルを最初に読むこと。

## Context(背景)

このリポジトリは React Router v8(Data Mode)+ Rails API の組み合わせを検証する PoC で、
CLAUDE.md には元々「Data Mode のみを使用する」「Framework Mode(SSR・typed routes)は
スコープ外」と明記されていた。Data Mode 実装(`/`, `/tasks`, `/tasks/new`, `/tasks/:id`,
比較用の `/tasks-legacy`)はすでに main にマージ済みで完成している。

その後、将来的な SEO 対策を見据えて Framework Mode(SSR)を採用したいという方針転換が
決まった。SEO 効果を得るには初回 HTML に実際のコンテンツと `<title>`/`<meta>` が
含まれる必要があり、これは SSR でなければ実現できない(Data Mode の SPA 構成では
`curl` で取得した HTML は空の `<div id="root">` のみ)。

CLAUDE.md の開発ワークフロー規約(1 PR = 1 検証観点、小さく分解、実装前に計画提示)に
従い、移行を複数の PR に分割して段階的に進める。

## 確定した設計方針(ユーザー確認済み・変更しないこと)

1. **SSR 適用範囲**: 全ルートで SSR 有効(`react-router.config.ts` に `ssr: true` を
   グローバル設定)。`/tasks-legacy` も対象に含めるが、loader を持たないため
   初回描画は現状同様「空の状態」→ `useEffect` 実行後に描画、という挙動は変わらない。
   個別に `ssr: false` は設定しない。
2. **ディレクトリ構成**: `frontend/src/` → `frontend/app/`(React Router Framework Mode
   の標準)にリネームする。**リネームの差分は専用の PR(PR1a)に分離**し、他の変更
   (Framework Mode 化のロジック変更)と混ぜない。
3. **API ベース URL の切り分け**: サーバー実行時(loader/action が Node プロセス内で
   動く場合)は専用のサーバー用 env var `API_BASE_URL_INTERNAL=http://backend:3000/api/v1`
   から、ブラウザ実行時は既存の `VITE_API_BASE_URL` から読む。`docker-compose.yml` の
   `DB_HOST: db` と同じ考え方(コンテナ間はサービス名で疎通)。
4. **オプション PR**: typegen 導入(PR4)・本番相当 Docker 検証環境の追加(PR5)、
   いずれも今回の移行スコープに含める。

## ブランチ・PR運用について(重要)

このセッション群では GitHub 上の1つの PR(**#20**, ブランチ
`claude/framework-mode-seo-weyvix`)にすべてのコミットを積み重ねる運用になっている
(CLAUDE.md に書かれている「PRごとに `feature/<説明>` ブランチを切る」という規約とは
異なる、このリポジトリ・セッション固有の運用)。

- 新しいチャットセッションで作業する場合も、**同じブランチ
  `claude/framework-mode-seo-weyvix` に commit・push** すること
  (別ブランチを新規に切らない)
- 1 PR 分の作業ごとに、論理的にまとまったコミットとして積む
  (コミットメッセージは日本語で、どの PR 番号の作業かが分かるように書く)
- 各 PR 着手前に、本ファイルの「進捗ステータス」を確認し、まだ完了していない
  ものから着手する
- 1つの PR 分の作業が終わったら、本ファイルの進捗ステータスを更新してからコミットする

## 進捗ステータス

| PR | 内容 | ステータス |
|---|---|---|
| PR0 | 方針ドキュメント更新(CLAUDE.md / frontend-guide) | ✅ 完了(PR #20 にコミット済み) |
| PR1a | `frontend/src/` → `frontend/app/` リネームのみ | 未着手 |
| PR1b | Framework Mode 本体の切り替え(SSR化) | 未着手 |
| PR2 | API ベース URL のサーバー/クライアント分離 | 未着手 |
| PR3 | 各ルートへの `meta` 追加(SEO 本丸) | 未着手 |
| PR4 | typegen 導入 | 未着手 |
| PR5 | 本番相当 Docker 検証環境の追加 | 未着手 |
| PR6 | ドキュメント最終更新 | 未着手 |

## PR 一覧(詳細)

### PR0 — 方針ドキュメントの更新 ✅完了
方針ドキュメントの更新のみ。コードは変更しない。

- `CLAUDE.md`
  - 「やらないこと」から「Framework Mode の導入(SSR・typed routes)」を削除
  - 「Data Mode のみを使用する」の記述を Framework Mode 前提に更新
    (`react-router-dom は使わない` ルールはそのまま維持)
  - 「ディレクトリ構成(想定)」は PR1a・PR1b で実体が固まった後に PR6 で最終更新する旨を明記
- `docs/frontend-guide-for-rails-engineers.md` §10
  - 「Framework Mode は不採用」としている記述を、方針転換した旨に修正
    (詳細な書き直しは PR6 で実施)

**動作確認**: `docker-compose up` が変更前と同様に起動することを確認(ドキュメントのみの
変更でアプリに影響がないことの確認)。

---

### PR1a — `frontend/src/` → `frontend/app/` リネーム
**リネームのみ**を行う PR。Framework Mode 化のロジックは一切含めない
(現状の `createBrowserRouter` ベースの Data Mode のまま、ディレクトリだけ移動)。

- `frontend/src/` 以下を `frontend/app/` にリネーム(`routes/`, `routes-legacy/`, `lib/`,
  `assets/`, `test/`, `router.tsx`, `main.tsx` などすべて)
- 参照パスの追従のみ:
  - `frontend/index.html` の `<script type="module" src="/src/main.tsx">` → `/app/main.tsx`
  - `frontend/tsconfig*.json` の `include`/`paths`
  - `frontend/vite.config.ts` の `test.setupFiles`(`./src/test/setup.ts` → `./app/test/setup.ts`)
  - import 文自体は相対パスなので基本的に変更不要(ディレクトリごと移動するため)

**動作確認**:
- `docker-compose up` で `frontend` コンテナが起動し、`/`, `/tasks`, `/tasks/new`,
  `/tasks/:id`, `/tasks-legacy` が従来通り表示されること
- `docker-compose run --rm frontend npm run test` で既存テストが全て通ること
- `docker-compose run --rm frontend npm run build` が通ること

---

### PR1b — Framework Mode 本体の切り替え
Framework Mode への本体の切り替え。既存ルートの挙動を変えずに SSR 化する、最大の検証点。

- `frontend/package.json` — `@react-router/dev`, `@react-router/node` を追加。
  `dev` → `react-router dev`、`build` → `react-router build`、`start` →
  `react-router-serve ./build/server/index.js`(PR5 で使用)。`test` は `vitest run` のまま
- `frontend/react-router.config.ts`(新規)— `{ ssr: true }`
  (`appDirectory` は PR1a で `app/` にリネーム済みのためデフォルト値のままでよい)
- `frontend/vite.config.ts` — `@vitejs/plugin-react` の `react()` を
  `@react-router/dev/vite` の `reactRouter()` に置き換え
- `frontend/vitest.config.ts`(新規)— Vitest 用の設定を分離
  (`@react-router/dev` の Vite プラグインは Vitest の非 SSR 単体テスト実行と相性が
  良くないため)。既存の `test.environment: 'jsdom'` / `setupFiles` と、テストが
  動くよう素の `react()` プラグインを維持
- `frontend/app/routes.ts`(新規)— ルート定義。`route()` 配列 API で、現状の
  `router.tsx` と同じ一覧(`/`, `/tasks`, `/tasks/new`, `/tasks/:id`, `/tasks-legacy`)を
  そのまま `app/routes/*`, `app/routes-legacy/*` の既存ファイルに紐付ける
  (各ルートファイル自体は無変更)
- `frontend/app/root.tsx`(新規)— `<html>`/`<Outlet>` を持つ最上位レイアウト
  (現状 `index.html` + `main.tsx` が暗黙に担っていた部分)
- `frontend/app/entry.server.tsx`(新規)— `@react-router/node` を使ったサーバー
  レンダリングエントリ
- `frontend/app/entry.client.tsx`(新規)— `hydrateRoot()` によるハイドレーション
  (`main.tsx` の `createRoot().render()` を置き換え)
- 削除: `frontend/app/main.tsx`, `frontend/app/router.tsx`
  (`routes.ts` + `root.tsx` + `entry.*.tsx` に統合されるため)
- `frontend/index.html` — Framework Mode ではシェルが `root.tsx` から生成されるため、
  実装時に完全撤去か最小化かを確認しながら調整
- `frontend/app/routes/*`, `frontend/app/routes-legacy/*`, `frontend/app/lib/api.ts` は
  **このPRでは無変更**(挙動を変えずに土台だけ切り替えるのが目的)

**動作確認**:
- `docker-compose up` で `frontend` が `:5173` で起動し、全ルートが従来と同じ見た目・
  挙動で動くこと(loader によるタスク一覧取得、`useFetcher` によるチェックボックス
  トグル、`/tasks/new` の 422 エラー表示、`/tasks/:id` の削除+リダイレクト)
- `curl -s http://localhost:5173/tasks` のレスポンスに `<ul>` 等の一覧 HTML が
  直接含まれること(SSR が効いている証拠。移行前は空の `<div id="root">` のみ)
- `docker-compose run --rm frontend npm run test` で既存テストが全て通ること

---

### PR2 — API ベース URL のサーバー/クライアント分離
loader/action がサーバー(Node プロセス)側で実行されるようになるため、
`localhost:3000` ではなく Docker 内部ホスト名 `backend:3000` で Rails に到達する必要がある。

- `frontend/app/lib/api.ts` — サーバー実行時は `process.env.API_BASE_URL_INTERNAL`、
  ブラウザ実行時は既存の `import.meta.env.VITE_API_BASE_URL` を使う分岐を追加
  (`typeof document === 'undefined'` 等でサーバー/クライアントを判定)。
  なぜサーバーとブラウザで別のホスト名が必要なのか、日本語コメントで丁寧に説明する
- `.env.example` — `API_BASE_URL_INTERNAL=http://backend:3000/api/v1` を追加
  (`VITE_` prefix を付けないこと — 付けるとクライアントバンドルに漏れてしまう点を
  コメントで明記)
- `docker-compose.yml` — `frontend` サービスは既に `env_file: .env` で環境変数を
  受け取っているため構造変更は不要な想定。念のため確認

**動作確認**:
- `docker-compose up` → `/tasks` が正常に表示されること(loader が `backend:3000` 経由で
  取得できていることの確認)
- `docker-compose exec frontend printenv | grep API_BASE_URL` で両方の変数が
  コンテナ内に存在すること
- `API_BASE_URL_INTERNAL` を意図的に外した場合、loader が分かりやすいエラーになる
  ことを軽く確認

---

### PR3 — 各ルートへの `meta` 追加(SEO 本丸)
SEO 対策の本丸。各ルートに `meta` を追加し、`<title>`/`<meta>` がサーバーレンダリング
済み HTML に含まれるようにする。

- `frontend/app/routes/top-page.tsx`, `task-list.tsx`, `task-new.tsx`, `task-show.tsx`
  に `export const meta: MetaFunction = ...` を追加(`task-show` は loader データを
  使ってタスク名を動的にタイトルへ反映)
- `frontend/app/routes-legacy/task-list-legacy.tsx` は意図的に `meta` を追加しない
  (Declarative Mode 比較用として「SEO 効果が得られない」ことを示す対比のまま残す旨を
  コメントで明記)

**動作確認**:
- `curl -s http://localhost:5173/tasks/1 | grep -o '<title>[^<]*</title>'` で
  実際のタスク名を含んだ `<title>` が JS 実行なしで取得できること
- `/tasks-legacy` では同様の `curl` でタイトルが動的に変わらないことを確認
  (比較のポイント)
- ブラウザの「ページのソースを表示」で目視確認

---

### PR4 — typegen 導入
`react-router typegen` による loader/params の型付け。

- `frontend/package.json` — typegen 用スクリプト追加
- `frontend/.gitignore` — 生成される `.react-router/` を無視
- `frontend/tsconfig.json` — 生成型のパスを include

**動作確認**: `docker-compose run --rm frontend npm run build`(または typegen 用
スクリプト)がエラーなく完了し、任意のルートファイルで `Route.LoaderArgs` 等の
生成された型が使えること

---

### PR5 — 本番相当 Docker 検証環境の追加
`vite dev` の SSR は開発用であり、本番相当の挙動(ビルド後に `react-router-serve` で
配信)とは異なる。SEO 効果をより正確に検証するため、ローカルで本番相当のビルド・
配信を試せる Docker 構成を追加する。**本番デプロイ設定(ECS Fargate 等)ではなく、
あくまでローカル検証用**という位置づけを明確にする。

- `frontend/Dockerfile` — 開発用ステージはそのまま残し、`npm run build` →
  `react-router-serve ./build/server/index.js` を実行する本番相当ステージを追加
  (マルチステージ or `Dockerfile.prod`)
- `docker-compose.yml` — 既存の `docker-compose up` の挙動には影響しない形で、
  opt-in なサービス(例: `frontend-prod`、Compose profile で分離)を追加
- `.env.example` — 本番相当ステージ専用の env var が必要であれば追記

**動作確認**:
- `docker-compose --profile prod up frontend-prod`(または該当コマンド)で起動し、
  `curl` で SSR 済み HTML(`<title>` 含む)が返ること
- 通常の `docker-compose up`(profile 指定なし)の挙動が変わっていないこと

---

### PR6 — ドキュメント最終更新
実装が固まった後の最終ドキュメント更新。

- `docs/frontend-guide-for-rails-engineers.md` §10 を書き直し
  (Next.js 比較の「SSR 不要」という結論を撤回し、実際に採用した構成・理由を記載)。
  loader/action の実行コンテキスト(サーバー/クライアント)の違いと、
  `lib/api.ts` がなぜ 2 つのベース URL を持つ設計になったかを追加説明
- `CLAUDE.md` の「ディレクトリ構成(想定)」を実際のファイル構成
  (`app/routes.ts`, `app/root.tsx`, `app/entry.server.tsx`, `app/entry.client.tsx` の追加、
  `main.tsx`/`router.tsx` の削除)に合わせて更新

**動作確認**: ドキュメントのみの変更のため `docker-compose up` が変更前と同様に
起動することを確認

---

## 実装順序と依存関係

PR0 → PR1a → PR1b → PR2 → PR3 → (PR4, PR5 は PR3 以降ならどちらが先でも可) → PR6

PR0 は他の全 PR の前提(CLAUDE.md の制約を解除しないと以降の PR が規約違反になる)。
PR1a(リネーム)は PR1b(Framework Mode 化)より必ず先に行い、差分を分離する。

## 検証方法まとめ

各 PR は Docker のみで完結する確認手順を持つ(`docker-compose up` / `docker-compose run`
/ `curl` / ブラウザ目視)。ローカルに Ruby・Node がインストールされていない前提でも
再現できる。dockerd が使えない環境で実装した場合は、その旨をコミットメッセージや
このファイルの更新に明記し、レビュー側が実行する前提とする(CLAUDE.md の既存ルール通り)。
