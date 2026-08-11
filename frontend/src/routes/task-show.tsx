// タスク詳細画面。
//
// このルート(/tasks/:id)は loader と action の両方を持つ。
// - loader: 画面表示前に Rails API の show エンドポイントからタスク1件を取得する
// - action: 削除ボタンの <Form method="post"> が送信されたときに呼ばれ、
//   Rails API の destroy エンドポイントを叩いたあと一覧画面へ redirect する
//
// URLの動的部分(:id)は params から受け取れる。loader・action どちらも
// LoaderFunctionArgs / ActionFunctionArgs 経由で params にアクセスする。
import {
  Form,
  Link,
  redirect,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from 'react-router'
import { apiDelete, apiGet } from '../lib/api'

type Task = {
  id: number
  title: string
  done: boolean
}

type TaskResponse = {
  data: Task
}

// taskShowLoader: このルートに遷移する際に、画面の描画より先に呼ばれる関数。
// params.id には URL の :id 部分(例: /tasks/3 なら "3")が入る。
// 対象が存在しない場合、apiGet は 404 を ApiError として投げる。ここでは
// catch せずそのまま投げているので、React Router のデフォルトのエラー画面が
// 表示される(このPRではエラー画面のカスタマイズまではスコープ外)。
export async function taskShowLoader({ params }: LoaderFunctionArgs): Promise<Task> {
  const response = await apiGet<TaskResponse>(`/tasks/${params.id}`)
  return response.data
}

// taskShowAction: この画面の削除フォームが送信されたときに呼ばれる関数。
// 削除に成功したら redirect() で一覧画面(/tasks)に遷移する。
export async function taskShowAction({ params }: ActionFunctionArgs) {
  await apiDelete(`/tasks/${params.id}`)
  return redirect('/tasks')
}

function TaskShow() {
  // loader が返した値(タスク1件)をそのまま受け取る。
  const task = useLoaderData<typeof taskShowLoader>()

  return (
    <main>
      <h1>タスク詳細</h1>
      <p>
        <Link to="/tasks">一覧に戻る</Link>
      </p>
      <dl>
        <dt>タイトル</dt>
        <dd>{task.title}</dd>
        <dt>状態</dt>
        <dd>{task.done ? '完了' : '未完了'}</dd>
      </dl>
      {/* 削除ボタン: 送信すると taskShowAction が呼ばれ、成功後は一覧画面へ遷移する */}
      <Form method="post">
        <button type="submit">削除する</button>
      </Form>
    </main>
  )
}

export default TaskShow
