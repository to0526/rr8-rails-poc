// トップページ用のコンポーネント。
//
// React Router v8 の Data Mode では、画面ごとのコンポーネントを
// src/routes/ 以下にまとめ、router.tsx でパスと紐付ける、という構成にしている。
//
// このページ自体はまだ Rails API との連携(loader / action)を持たない、
// 単なる入り口のページ。API からデータを取得する画面は /tasks(タスク一覧)に
// 分けて実装している。
//
// /tasks-legacy は、同じ一覧を素の useEffect + fetch(Declarative Mode)で
// 実装した比較用の画面。Data Mode(loader)版とのコード量・書き方の違いを
// 見比べるために用意している。
import { Link } from 'react-router'

function TopPage() {
  return (
    <main>
      <h1>rr8-rails-poc</h1>
      <p>React Router v8 (Data Mode) + Rails API の検証用フロントエンドです。</p>
      <p>
        <Link to="/tasks">タスク一覧(loaderでRails APIから取得)を見る</Link>
      </p>
      <p>
        <Link to="/tasks-legacy">タスク一覧(比較用: useEffect + fetch版)を見る</Link>
      </p>
    </main>
  )
}

export default TopPage
