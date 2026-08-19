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
import TaskList, { taskListAction, taskListLoader } from './routes/task-list'
import TaskNew, { taskNewAction } from './routes/task-new'
import TaskShow, { taskShowAction, taskShowLoader } from './routes/task-show'
import TaskListLegacy from './routes-legacy/task-list-legacy'

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
    // action は useFetcher().submit() からの送信(チェックボックスによる
    // 完了状態の切り替え)を受け取るために紐付けている。<Form> によるページ遷移とは
    // 異なり、送信後もこの画面から離れない。
    path: '/tasks',
    Component: TaskList,
    loader: taskListLoader,
    action: taskListAction,
  },
  {
    // "/tasks/new" にアクセスした時にタスク作成画面を表示する。
    // action を紐付けておくことで、この画面の <Form method="post"> が
    // 送信されたときに taskNewAction が呼ばれる。
    path: '/tasks/new',
    Component: TaskNew,
    action: taskNewAction,
  },
  {
    // "/tasks/:id" にアクセスした時にタスク詳細画面を表示する。":id" の部分は
    // 可変パラメータで、実際のURL(例: /tasks/3)に応じた値が params.id として
    // loader・action に渡される。
    // action は詳細画面内の削除フォーム(<Form method="post">によるページ遷移を
    // 伴う送信)を受け取るために紐付けている。
    path: '/tasks/:id',
    Component: TaskShow,
    loader: taskShowLoader,
    action: taskShowAction,
  },
  {
    // "/tasks-legacy" にアクセスした時に、Declarative Mode版のタスク一覧を表示する。
    // loader を紐付けず、コンポーネント内の useEffect で自分でデータ取得する
    // (Data Mode版の /tasks との比較用)。
    path: '/tasks-legacy',
    Component: TaskListLegacy,
  },
])
