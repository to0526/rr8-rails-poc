# PoC結果まとめ

このドキュメントは、[docs/implementation-plan.md](./implementation-plan.md) の
PR1〜PR11 で実際に検証した内容をふまえた所感と、実運用への採用可否を判断するための
材料をまとめたものです。コードの追加は行わず、本ドキュメントのみの変更です。

## 検証環境

- Backend: Rails 8系(APIモード、`rails new --api` で新規作成)+ MySQL
- Frontend: Vite + React 19 + `react-router` v8(Data Mode)
- 題材: シンプルなタスク管理(一覧・作成・詳細・更新・削除)

## 検証観点ごとの所感

### 1. loader / action によるRails APIとのデータ取得・更新

- 画面遷移時のデータ取得(`loader`)、フォーム送信時の更新処理(`action`)を
  ルーティング定義(`router.tsx`)側に宣言する形になり、「この画面にはどんな
  データ取得・更新が紐づいているか」が1ファイルを見れば把握できた(`frontend/src/router.tsx`)。
- コンポーネント側は `useLoaderData()` / `useActionData()` で取得済みの値を
  受け取るだけでよく、ローディング状態・エラー状態を自前の `useState` で
  管理する必要がない。PR8で作成した比較用のDeclarative Mode版
  (`frontend/src/routes-legacy/task-list-legacy.tsx`)と比べると、
  同じ一覧表示でも `useEffect` の依存配列管理・アンマウント時のキャンセル処理
  (`cancelled` フラグ)などのボイラープレートが不要になり、コード量・見通しの
  両面で明確に有利だった。
- 一方で、「loaderがいつ再実行されるか」(同じルートへの`action`完了後に自動で
  再実行される、など)はReact Router側の暗黙のルールを理解している前提が必要で、
  フロントエンド初心者がいきなり触るにはコメントなどでの補足が要る。

### 2. Railsバリデーションエラー(422)のactionでの扱い

- `POST /api/v1/tasks` がバリデーション失敗時に `422 Unprocessable Entity` +
  `{ errors: { title: [...] } }` を返す設計にし(`backend/app/controllers/api/v1/tasks_controller.rb`)、
  フロントエンドの `action`(`frontend/src/routes/task-new.tsx`)内でステータスコードを見て
  分岐、422なら例外にせずそのまま `return` することで `useActionData()` から
  フォームにエラーメッセージを表示できた。
- 「成功時は`redirect()`、エラー時はデータをreturn」という書き方は、通常の
  フォーム処理(送信→成功ならページ遷移、失敗ならエラー表示)の流れと自然に
  対応しており理解しやすかった。
- 懸念点は、422以外のエラー(500など)を`action`内でどこまで拾うかの設計判断が
  必要なこと。今回は「更新系(action)は最低限のステータス分岐のみ、想定外の
  エラーはthrowしてReact Routerのデフォルトのエラー画面に任せる」という
  割り切りにしたが、実運用ではエラーバウンダリのカスタマイズ方針を別途決める
  必要がある。

### 3. useFetcher()によるフォーム送信・楽観的UI更新

- 一覧画面のチェックボックス(完了/未完了の切り替え)を `useFetcher()` で実装
  (`frontend/src/routes/task-list.tsx`)。`<Form>` によるページ遷移を伴う送信とは
  別に、「画面はそのまま・裏側だけ更新する」操作を自然に書けた。
- `fetcher.formData`(送信中のFormData)を見て楽観的な表示値を計算する実装
  (`optimisticDone`)は、成功時はそのまま表示が確定し、失敗時は`loader`の
  再取得結果に戻ることで自動的にロールバックされる、という挙動が期待通り
  動作した。ロールバック用の特別なエラーハンドリングコードを書かずに済んだのは
  Data Modeの利点として大きい。
- ただし「なぜロールバックされるのか」(action失敗時もloaderが再実行され、
  実際のサーバー側の値に表示が同期し直されるだけ)という仕組みの理解には
  一定の学習コストがある。

### 4. rack-corsを挟んだ場合のCORS挙動

- `backend/config/initializers/cors.rb` で `.env` の `FRONTEND_ORIGIN` から
  許可オリジンを読み込む形にし、検証用フロントエンド(`http://localhost:5173`)
  のみを許可する設定で問題なく動作した。
- preflight(OPTIONS)を含め、ブラウザの開発者ツール上でも想定通りのCORS
  ヘッダが返っていることを確認できた。設定自体は`rack-cors`のドキュメント通りで、
  つまずきポイントは特になし。実運用でも許可オリジンを環境変数で切り替える
  方針はそのまま踏襲できそう。

### 5. show/destroyを含むCRUD一式

- 一覧(index)・詳細(show)・作成(create)・更新(update)・削除(destroy)の
  一通りを実装し、詳細画面が存在しないIDの場合は404、削除成功時は204を返す形に
  した(`backend/app/controllers/api/v1/tasks_controller.rb`)。
- フロントエンド側は `loader` / `action` をルートごとに素直に対応させるだけで
  一覧⇄詳細⇄削除後の一覧遷移までを実装でき、`useNavigate`などで手動の画面遷移を
  組み立てる必要がなかった(`frontend/src/routes/task-show.tsx`の`redirect()`)。
- CRUD全体を通して、Rails側・フロントエンド側それぞれの実装パターンが早い段階で
  確立し、以降のエンドポイント追加が見積もりやすくなった。

### 6. CSS・画像の扱い

- CSS ModulesをRoute単位で導入(`task-list.module.css`など)し、クラス名の
  衝突を気にせずスタイルを書けた。Viteでの追加設定はほぼ不要だった。
- 画像は「`src/assets/`に置いてimportする方式」と「`public/`配下を絶対パスで
  直接参照する方式」の両方を検証(`frontend/src/routes/task-list.tsx`の
  `taskIconUrl`コメント参照)。前者はビルド時にハッシュ付きファイル名になり
  キャッシュ更新の面で有利、後者はファイル名変更時にビルドエラーにならず
  気付きにくい、というトレードオフを実際に確認できた。実運用では基本的に
  `src/assets/` + import方式を標準にするのがよさそうという所感。

### 7. テスト導入(RSpec / Vitest)

- Backend: RSpecのリクエストスペックで、show/destroyを含む主要エンドポイントの
  正常系・異常系(404、422)を検証(`backend/spec/requests/api/v1/tasks_spec.rb`)。
  Railsのテストとしては標準的な書き方で迷いなく導入できた。
- Frontend: Vitest + Testing Libraryで、`loader`/`action`を持つ主要ルートの
  コンポーネントテストを追加。`loader`/`action`はプレーンな非同期関数として
  export しているため、React Routerのルーティング機構を経由せずに単体テスト
  しやすい点は、Data Modeの設計上の利点として感じられた。
- 実行コマンドはそれぞれ `docker compose exec backend bundle exec rspec` /
  `docker compose exec frontend npm test` で、CI導入時もこのままの形で
  組み込めそうという所感。

## 総合所感・採用可否の判断材料

- **良かった点**
  - `loader`/`action`によって「データ取得・更新のタイミングと処理」が
    ルーティング定義に集約され、Declarative Mode(`useEffect`+fetch)と比べて
    ボイラープレート(ローディング/エラー状態管理、キャンセル処理など)が
    大幅に減った。
  - 422エラーハンドリングや`useFetcher()`による楽観的UI更新など、フォーム操作に
    まつわる典型的な要件が、React Router側の標準的な仕組みに素直に乗せる形で
    実装できた。
  - CORS・CSS Modules・画像・テストといった周辺要素も含め、Rails APIモード+
    Vite構成との組み合わせで大きな相性問題は見つからなかった。
- **懸念点・今後の検討課題**
  - `loader`の再実行タイミングなど、React Router側の暗黙の挙動を理解している
    前提のコードになりやすく、チームに展開する場合は一定のオンボーディング
    (ドキュメント・コメント)が必要。
  - 本PoCでは認証なし・SSRなしのスコープで検証したため、認証状態を絡めた
    `loader`/`action`の設計や、SEO/SSRが必要になった場合のFramework Modeへの
    移行コストは別途見積もりが必要。
  - エラーバウンダリの設計(422以外の想定外エラーの扱い)は今回最低限の
    実装にとどめており、実運用では画面ごとの方針を決める必要がある。
- **総合的な採用可否**
  - 今回検証した範囲(CRUD・バリデーションエラー処理・部分更新・CORS・
    CSS/画像・テスト)においては、React Router v8(Data Mode)+ Rails APIの
    組み合わせに大きな障壁は見られなかった。認証・SSRなど今回スコープ外とした
    要件の検証を追加で行った上で、実運用への採用を前向きに検討できる、
    というのが現時点の結論。
