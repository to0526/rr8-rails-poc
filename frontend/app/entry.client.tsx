import { startTransition, StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { HydratedRouter } from 'react-router/dom'

// ブラウザ側のエントリポイント(= ハイドレーション用のエントリ)。
// Data Mode時代の main.tsx(createRoot().render())を置き換えるファイルで、
// Framework Mode ではファイル名が entry.client.tsx に固定されている。
//
// サーバー側(entry.server.tsx)が送ってきた「すでにコンテンツが入った HTML」に対して、
// createRoot() で作り直すのではなく hydrateRoot() を使う。これにより、
// 一度サーバーで描画された DOM をそのまま再利用しつつ、React のイベントハンドラ
// (onClick 等)や状態管理を「後付け」できる(= ハイドレーション)。
// createRoot() を使ってしまうと、せっかくサーバーで作った HTML を一度破棄して
// 作り直すことになり、SSR の意味がなくなってしまう。
//
// <HydratedRouter /> は、root.tsx の Layout の中で描画される <Outlet /> に対応する、
// Framework Mode 用のルーター本体。Data Mode時代の
// <RouterProvider router={router} /> のように router.tsx から作った router を
// 渡す必要はなく、routes.ts の内容を自動的に読み込んでくれる。
//
// startTransition() で包むのは、ハイドレーション処理を「緊急度の低い更新」として
// React に伝えるため(React公式のFramework Modeテンプレートに準拠)。
startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
  )
})
