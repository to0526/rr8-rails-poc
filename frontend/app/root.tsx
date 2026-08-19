import type { ReactNode } from 'react'
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'
import './index.css'

// Framework Mode における最上位のレイアウト。
//
// Data Mode 時代は index.html(静的なHTMLファイル)が <html>/<head>/<body> の骨組みを
// 持ち、main.tsx が <div id="root"> に対して React をマウントしていた。
// Framework Mode ではこの root.tsx がその役割を兼ねる。
// - サーバー側では、この Layout が描画した <html>...</html> がそのままレスポンスの
//   HTML になる(= SSR。curl 等で取得してもコンテンツ入りのHTMLが返る)
// - ブラウザ側では、同じコンポーネントツリーに対して entry.client.tsx が
//   hydrateRoot() でイベントハンドラ等を「後付け」する(= ハイドレーション)
//
// "Layout" という名前で export すると、React Router が自動的に「ページ全体を
// 囲む共通レイアウト」として認識して使ってくれる(規約)。エラー画面(存在しない
// パスへのアクセス等)を描画する際もこの Layout の中に描画されるため、
// <html> の外側にコンテンツが出てしまう心配がない。
export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {/* 各ルートが meta() を export していない場合に使われるデフォルトの
            <title>(PR17でルートごとに動的な <title> を追加する予定)。 */}
        <title>rr8-rails-poc</title>
        {/* Meta / Links は、各ルートファイルの meta() / links() エクスポートの
            内容をこの位置に描画するための React Router 提供コンポーネント
            (現時点ではどのルートも meta()/links() を定義していないため
            何も出力されない)。 */}
        <Meta />
        <Links />
      </head>
      <body>
        {/* children には、下の Root コンポーネントが描画した内容
            (= 現在のURLに対応するルートを含む <Outlet />)が渡ってくる。 */}
        {children}
        <ScrollRestoration />
        {/* Scripts が、ハイドレーション用の <script type="module"> タグを出力する。
            Data Mode時代に index.html へ直接書いていた
            <script type="module" src="/app/main.tsx"> の代わり。 */}
        <Scripts />
      </body>
    </html>
  )
}

// 実際に各ページのコンポーネントを描画する部分。
// <Outlet /> の位置に、routes.ts で現在のURLにマッチしたルートのコンポーネントが
// 描画される。Data Mode時代の <RouterProvider router={router} /> に相当する。
export default function Root() {
  return <Outlet />
}
