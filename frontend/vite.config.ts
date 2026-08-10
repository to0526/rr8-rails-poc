import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Viteの設定ファイル。react() プラグインで JSX/TSX や Fast Refresh(コード保存時の
// 即時反映)を有効にしている。開発サーバーを http://localhost:5173 以外に変えたい
// 場合や、Dockerコンテナ外からアクセスしたい場合はここに server オプションを追加する。
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
