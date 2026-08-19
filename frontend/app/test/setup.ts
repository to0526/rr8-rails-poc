// Vitestの各テストファイル実行前に読み込まれるセットアップファイル(vite.config.tsのtest.setupFilesで指定)。
// jest-domのカスタムマッチャー(toBeInTheDocument()など)をexpectに追加する。
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Testing Libraryはテストごとに描画したDOMを自動で片付けてくれるが、それはJestの
// グローバルなafterEachフックを利用した仕組みになっている。このプロジェクトでは
// globals: trueを使わずvitestの関数を明示的にimportする方針にしているため、
// 同じことをここで明示的に行う(このsetupFilesが全テストの前に読み込まれる)。
afterEach(() => {
  cleanup()
})
