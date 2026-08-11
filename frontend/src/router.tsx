// React Router v8 の Data Mode では、「どのURLパスの時に、どの画面(コンポーネント)を
// 表示するか」という対応表(ルーティング定義)を、このファイルに集約する。
//
// これは Declarative Mode(<Routes><Route ... /></Routes> のようにJSXで書くやり方)とは
// 異なる書き方で、ルーティング定義を素のオブジェクト(配列)として渡す点が特徴。
// こう書くことで、各ルートに後から loader(データ取得用の関数)や
// action(フォーム送信を処理する関数)を追加していきやすくなる。
//
// 参考: react-router-dom は React Router v8 で廃止されたパッケージなので使わない。
// 必ず "react-router" から import すること。
import { createBrowserRouter } from 'react-router'
import TopPage from './routes/top-page'
import TaskList, { taskListLoader } from './routes/task-list'

export const router = createBrowserRouter([
  {
    // "/" にアクセスした時にトップページを表示する
    path: '/',
    Component: TopPage,
  },
  {
    // "/tasks" にアクセスした時にタスク一覧画面を表示する。
    // loader を紐付けておくことで、画面を描画する前に taskListLoader が呼ばれ、
    // その戻り値が TaskList 内で useLoaderData() から参照できるようになる。
    path: '/tasks',
    Component: TaskList,
    loader: taskListLoader,
  },
])
