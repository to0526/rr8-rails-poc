/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vitest(このPoCで使うテストランナー)専用の設定ファイル。
//
// vite.config.ts の reactRouter() プラグインは SSR ビルド前提の変換を行うため、
// Vitest 上での非SSRなユニットテスト実行とは相性が良くない。そのため
// vite.config.ts とは別に、素の @vitejs/plugin-react(react())を使うこちらの設定を
// 用意している。Vitest は vitest.config.ts が存在する場合、vite.config.ts より
// こちらを優先して読み込む(`npm run test` = `vitest run` はこの設定で動く)。
//
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
