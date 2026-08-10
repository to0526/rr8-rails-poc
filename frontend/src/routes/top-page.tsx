// トップページ用のコンポーネント。
//
// React Router v8 の Data Mode では、画面ごとのコンポーネントを
// src/routes/ 以下にまとめ、router.tsx でパスと紐付ける、という構成にしている。
//
// このPR (フロントエンドの雛形作成) の時点では、まだ Rails API との連携
// (loader / action) を実装していない。まずは画面が問題なく表示されることだけを
// 確認するための、最小限の内容にしている。
// API からデータを取得する処理は、後続のPRで loader を使って実装する予定。
function TopPage() {
  return (
    <main>
      <h1>rr8-rails-poc</h1>
      <p>React Router v8 (Data Mode) + Rails API の検証用フロントエンドです。</p>
    </main>
  )
}

export default TopPage
