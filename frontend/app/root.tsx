import type { ReactNode } from 'react'
import { Links, Meta, Outlet, Scripts, ScrollRestoration, type MetaFunction } from 'react-router'
import './index.css'

// meta: このルート(root、つまり全ページの最上位)の <title>/<meta> を決める関数。
//
// 各ルートファイル(top-page.tsx など)が個別に meta() を export している場合、
// React Router はそのルートの meta() の戻り値をそのまま使い、ここ(root)の
// 戻り値には「差し替え」られる(足し算にはならないので <title> が2つ出力される
// 心配はない)。逆に、ルート側が meta() を export していない場合
// (routes-legacy/task-list-legacy.tsx が該当。あえて対比用に export していない)は、
// この root の meta() がそのまま使われ、この汎用的なタイトルが表示され続ける
// = SSR してもタイトルがページ内容に応じて変化しない、という Declarative Mode の
// 弱点をそのまま見せる形になる。
export const meta: MetaFunction = () => [{ title: 'rr8-rails-poc' }]

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
        {/* Meta / Links は、各ルートファイルの meta() / links() エクスポートの
            内容をこの位置に描画するための React Router 提供コンポーネント。
            <title> もこの中で出力される(上部の root の meta() 参照。
            各ルートファイルの meta() 説明も参照)。 */}
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
