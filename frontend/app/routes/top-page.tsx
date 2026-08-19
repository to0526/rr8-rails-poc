// トップページ用のコンポーネント。
//
// React Router v8 の Data Mode では、画面ごとのコンポーネントを
// app/routes/ 以下にまとめ、router.tsx でパスと紐付ける、という構成にしている。
//
// このページ自体はまだ Rails API との連携(loader / action)を持たない、
// 単なる入り口のページ。API からデータを取得する画面は /tasks(タスク一覧)に
// 分けて実装している。
//
// /tasks-legacy は、同じ一覧を素の useEffect + fetch(Declarative Mode)で
// 実装した比較用の画面。Data Mode(loader)版とのコード量・書き方の違いを
// 見比べるために用意している。
//
// このPRでは画像・CSSの扱い方も検証している。
// - logo: app/assets/react-router-logo.svg を import して使っている。
//   import した変数(logo)には、Viteが解決した画像のURLが文字列として入る。
//   実際に `docker build`(vite build)相当のビルドをして確認したところ、
//   この画像のように小さいファイル(既定では4KB未満)は個別のファイルとして
//   出力されず、JSバンドルの中に base64 の data URL として埋め込まれる
//   (=別ファイルとしてのリクエストが発生しない)挙動になった。もっと大きい画像を
//   import した場合は、ハッシュ付きファイル名(例: xxx-abc123.svg)の別ファイルとして
//   dist/assets/ 配下に出力される。いずれにせよファイル名や埋め込み方が変わっても
//   参照側(import側)のコードは変更不要で追従できる。
// - styles: top-page.module.css を import した CSS Modules。
import { Link } from 'react-router'
import logo from '../assets/react-router-logo.svg'
import styles from './top-page.module.css'

function TopPage() {
  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <img src={logo} alt="" className={styles.logo} />
        <h1 className={styles.title}>rr8-rails-poc</h1>
      </div>
      <p>React Router v8 (Data Mode) + Rails API の検証用フロントエンドです。</p>
      <div className={styles.links}>
        <Link to="/tasks">タスク一覧(loaderでRails APIから取得)を見る</Link>
        <Link to="/tasks-legacy">タスク一覧(比較用: useEffect + fetch版)を見る</Link>
      </div>
    </main>
  )
}

export default TopPage
