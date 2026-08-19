import { reactRouter } from '@react-router/dev/vite'
import { defineConfig } from 'vite'

// Viteの設定ファイル。Framework Mode(SSR)に切り替えたため、JSX/TSXの変換や
// Fast Refresh(コード保存時の即時反映)を担う @vitejs/plugin-react の react() ではなく、
// @react-router/dev が提供する reactRouter() プラグインを使う。
// reactRouter() は react() の機能に加えて、react-router.config.ts(ssr: true)を読み込み、
// app/routes.ts のルート定義からサーバー/クライアント双方のビルド成果物を生成する処理を
// 引き受けている。
//
// 開発サーバーを http://localhost:5173 以外に変えたい場合や、Dockerコンテナ外から
// アクセスしたい場合はここに server オプションを追加する。
// https://vite.dev/config/
//
// 注意: このファイルには Vitest 用の test 設定を置かない。reactRouter() プラグインは
// SSR前提の変換を行うため、Vitestの非SSRなユニットテスト実行と相性が悪い。
// テスト用の設定は vitest.config.ts に分離している(`npm run test` はそちらを読む)。
export default defineConfig({
  plugins: [reactRouter()],
})
