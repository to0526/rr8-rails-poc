# 実装計画(PRロードマップ)

`CLAUDE.md` の方針(1 PR = 1 検証観点、実装前に計画を提示してから着手する)に沿って、
PoC全体を以下のPR単位に分解する。各PRは着手前にファイル一覧を再提示し、確認を得てから実装する。

## PR1: Backend scaffold(Rails API単体起動)
- `backend/` に `rails new --api` で新規Railsアプリを作成
- 最小Gemfile(rack-corsは次PRで追加)
- DB設定を MySQL に変更(`config/database.yml`)
- `backend/Dockerfile` を作成し、単体で `rails s` が起動することを確認
- 動作確認: `docker build` → コンテナ起動 → `curl http://localhost:3000/up` でヘルスチェック応答を確認

## PR2: Frontend scaffold(Vite + React + react-router v8単体起動)
- `frontend/` に Vite + React 19 + TypeScript のプロジェクトを新規作成
- `react-router`(v8系、`react-router-dom` は使わない)を依存に追加
- `frontend/Dockerfile` を作成し、単体で Vite dev server が起動することを確認
- `src/router.tsx` に `createBrowserRouter` の最小骨格(トップページのみ)を用意
- 動作確認: `docker build` → コンテナ起動 → `http://localhost:5173` でトップページ表示を確認

## PR3: docker-compose統合 + 環境変数化
- リポジトリ直下に `docker-compose.yml`(`frontend` / `backend` / `db` の3サービス)
- `.env` / `.env.example`(CORS許可オリジン等を環境変数化)
- 動作確認: `docker-compose up` のみで frontend/backend/db が同時起動することを確認

## PR4: Rails側 CORS設定
- `backend/Gemfile` に `rack-cors` を追加
- `backend/config/initializers/cors.rb` で検証用オリジン(`.env` 経由)のみ許可
- 動作確認: `curl -H "Origin: http://localhost:5173" -I http://localhost:3000/...` でCORSヘッダを確認。ブラウザのpreflightもDevToolsで確認

## PR5: 一覧取得(loader)
- Backend: `app/controllers/api/v1/` に一覧取得用コントローラ+モデル+マイグレーション追加(`{ data: [...] }` 形式)、`config/routes.rb` にルーティング追加
- Frontend: `src/lib/api.ts` に共通fetchラッパーを作成、`src/routes/` に一覧画面(loaderでAPI取得)を追加し `router.tsx` に登録
- 動作確認: `docker-compose up` 後、ブラウザで一覧画面がAPIのデータを表示することを確認。`curl` でも同等データを確認

## PR6: 作成/更新(action + 422エラーハンドリング)
- Backend: 作成/更新用エンドポイント追加、バリデーション失敗時422 + `{ errors: {...} }` を返す
- Frontend: フォーム画面の `action` を実装し、422時に `useActionData()` でエラーメッセージをフォームに表示
- 動作確認: 正常系(登録成功→一覧反映)と異常系(バリデーションエラー表示)を両方ブラウザで確認

## PR7: useFetcher()による楽観的UI更新の検証
- 一覧画面内の部分操作(ステータス更新や削除など、ページ遷移を伴わない操作)を `useFetcher()` で実装
- 楽観的UI更新(送信中の即時反映)を試す
- 動作確認: ページ全体のリロードなしで即時反映されること、失敗時のロールバック挙動をブラウザで確認

## PR8: 比較用 Declarative Mode 画面
- `frontend/src/routes-legacy/` に `useEffect` + `fetch` の従来型で同等の一覧画面を1つ実装(Data Modeとの比較用)
- 動作確認: 同じデータが表示されること、Data Mode版とのコード量・体験の違いを比較できる状態にする

## PR9: PoC結果まとめ
- README等に、検証した4つのポイント(loader/action連携、422エラー処理、useFetcher楽観的UI、CORS挙動)の所感・採用可否の判断材料をまとめる
- コードは追加せず、ドキュメントのみの変更

## 進め方の注意
- 各PRは着手前に「作成/変更するファイルと概要」を箇条書きで再提示し、ユーザーの確認を得てから実装する
- ブランチ名は `feature/<短い説明>`(例: `feature/rails-cors-setup`)、コミットメッセージは日本語
- 認証、Framework Mode、本番デプロイ設定、既存本番Railsアプリへの変更は一切行わない(スコープ外)
- 設計判断で迷った場合は実装前に確認を取る
