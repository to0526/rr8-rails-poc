/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Viteの設定ファイル。react() プラグインで JSX/TSX や Fast Refresh(コード保存時の
// 即時反映)を有効にしている。開発サーバーを http://localhost:5173 以外に変えたい
// 場合や、Dockerコンテナ外からアクセスしたい場合はここに server オプションを追加する。
// https://vite.dev/config/
//
// test: Vitest(このPoCで使うテストランナー)の設定。Viteの設定ファイルと共有できる
// ため、ここに追記している(`npm run test` で実行される)。
// - environment: 'jsdom' … コンポーネントをブラウザなしでレンダリングするための
//   擬似DOM環境
// - setupFiles: 各テストファイルの実行前に読み込むファイル(jest-domのマッチャー登録用)
// describe/it/expect などは各テストファイルで "vitest" から明示的にimportして使う
// (globals: true にすればimportを省略できるが、このPoCでは他のコードと同じく
// 「どこから来た関数か」を追いやすくするためimportを省略しない方針にしている)
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./app/test/setup.ts'],
  },
})
