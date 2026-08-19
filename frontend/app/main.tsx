import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import './index.css'
import { router } from './router.tsx'

// RouterProvider に router.tsx で定義したルーティング情報を渡すと、
// 現在のURLに応じて対応するコンポーネントが自動的に描画される。
// Declarative Mode でよく見る <BrowserRouter> や <Routes> は使わない。
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
