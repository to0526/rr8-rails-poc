// タスク詳細画面。
//
// このルート(/tasks/:id)は loader と action の両方を持つ。
// - loader: 画面表示前に Rails API の show エンドポイントからタスク1件を取得する
// - action: 削除ボタンの <Form method="post"> が送信されたときに呼ばれ、
//   Rails API の destroy エンドポイントを叩いたあと一覧画面へ redirect する
//
// URLの動的部分(:id)は params から受け取れる。loader・action どちらも
// Route.LoaderArgs / Route.ActionArgs 経由で params にアクセスする。
//
// Route.LoaderArgs / Route.ActionArgs / Route.MetaArgs は、`react-router typegen`
// (`npm run dev`/`build` 実行時に自動実行される)が routes.ts の定義から
// ルートごとに生成する型(`./+types/task-show` から import する)。汎用の
// LoaderFunctionArgs / ActionFunctionArgs と違い、このルートのパス("tasks/:id")から
// params.id が「存在するかもしれない string」ではなく「必ず存在する string」として
// 型推論される、という違いがある(パスに応じて自動生成されるため)。
import { Form, Link, redirect, useLoaderData } from 'react-router'
import { apiDelete, apiGet } from '../lib/api'
import styles from './task-show.module.css'
import type { Route } from './+types/task-show'

// task-list.tsx と同じく public/task-icon.svg を絶対パスで直接参照する例。
const taskIconUrl = '/task-icon.svg'

type Task = {
  id: number
  title: string
  done: boolean
}

type TaskResponse = {
  data: Task
}

// loader: このルートに遷移する際に、画面の描画より先に呼ばれる関数。
// params.id には URL の :id 部分(例: /tasks/3 なら "3")が入る。
// 対象が存在しない場合、apiGet は 404 を ApiError として投げる。ここでは
// catch せずそのまま投げているので、React Router のデフォルトのエラー画面が
// 表示される(このPRではエラー画面のカスタマイズまではスコープ外)。
//
// Framework Mode では、routes.ts で紐付けたファイルの中から「loader」/「action」
// という名前のexportを自動的に探して、このルートのloader/actionとして使う
// (Data Mode時代のようにrouter.tsx側で明示的に渡す必要はない)。そのため、
// これらの名前は自由に変更できない規約になっている。
export async function loader({ params }: Route.LoaderArgs): Promise<Task> {
  const response = await apiGet<TaskResponse>(`/tasks/${params.id}`)
  return response.data
}

// meta: このルート("/tasks/:id")の <title> を決める関数。
// 第1型引数に typeof loader を渡すことで、引数の loaderData が
// loader の戻り値(Task)の型として推論される。
// loaderData には loader が取得したタスクがそのまま渡ってくるため、
// 「タスク名を含んだ <title>」をサーバー側で組み立てられる
// (これが今回の SEO 対応の本丸: 一覧ページからは分からない個別ページの
// 内容が、JS実行前の生HTMLの <title> の時点で検索エンジンに伝わる)。
// loader が例外を投げた場合(存在しないIDなど)は loaderData が undefined に
// なるため、その場合用のフォールバックの文言を用意している。
export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData ? `${loaderData.title} | rr8-rails-poc` : 'タスク詳細 | rr8-rails-poc' },
]

// action: この画面の削除フォームが送信されたときに呼ばれる関数。
// 削除に成功したら redirect() で一覧画面(/tasks)に遷移する。
export async function action({ params }: Route.ActionArgs) {
  await apiDelete(`/tasks/${params.id}`)
  return redirect('/tasks')
}

function TaskShow() {
  // loader が返した値(タスク1件)をそのまま受け取る。
  const task = useLoaderData<typeof loader>()

  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>
        <img src={taskIconUrl} alt="" className={styles.icon} />
        タスク詳細
      </h1>
      <p>
        <Link to="/tasks">一覧に戻る</Link>
      </p>
      <dl className={styles.detail}>
        <dt>タイトル</dt>
        <dd>{task.title}</dd>
        <dt>状態</dt>
        <dd>{task.done ? '完了' : '未完了'}</dd>
      </dl>
      {/* 削除ボタン: 送信すると action が呼ばれ、成功後は一覧画面へ遷移する */}
      <Form method="post">
        <button type="submit" className={styles.deleteButton}>削除する</button>
      </Form>
    </main>
  )
}

export default TaskShow
