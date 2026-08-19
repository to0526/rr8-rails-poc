// タスク作成画面。
//
// React Router v8 の Data Mode では、フォーム送信の処理を「action」という
// コンポーネント外の関数として書く。<Form method="post"> で送信すると、
// React Router が自動的にこのルートの action を呼び出し、
// 戻り値が useActionData() で画面から参照できるようになる。
//
// 素の useEffect + fetch(routes-legacy/ の比較用実装)との違いは、
// - フォーム送信 → ページ遷移(この画面から離れる)という一連の流れを
//   ブラウザの標準的なフォーム送信の作法(<form> の submit)に近い形で書ける
// - 送信中の状態管理や、成功時のリダイレクトを自分で useState / useNavigate
//   で組み立てなくてよい
// という点。
import { Form, redirect, useActionData, type ActionFunctionArgs } from 'react-router'
import { apiPost } from '../lib/api'
import styles from './task-new.module.css'

type Task = {
  id: number
  title: string
  done: boolean
}

// Rails 側が 422 のときに返す形式: { errors: { title: ["can't be blank"] } }
type TaskErrors = Record<string, string[]>

// action: <Form> が送信されたときに呼ばれる関数。FormData から入力値を取り出し、
// Rails API に POST する。
// - 成功(201)の場合: redirect() で一覧画面に遷移する
// - バリデーションエラー(422)の場合: エラー内容をそのまま return する
//   (この戻り値が TaskNew コンポーネント内の useActionData() で受け取れる)
export async function taskNewAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const title = formData.get('title')

  const { status, data } = await apiPost<{ data: Task } | { errors: TaskErrors }>('/tasks', {
    task: { title },
  })

  if (status === 422) {
    return data as { errors: TaskErrors }
  }

  return redirect('/tasks')
}

function TaskNew() {
  // action の戻り値(バリデーションエラー時のみ値が入る)を受け取る。
  // 成功時は redirect() するため、この画面自体が表示されなくなり
  // actionData は使われない。
  const actionData = useActionData<typeof taskNewAction>()
  const titleErrors = actionData?.errors?.title

  return (
    <main className={styles.main}>
      <h1>タスク作成</h1>
      <Form method="post">
        <div className={styles.field}>
          <label htmlFor="title">タイトル</label>
          <input id="title" name="title" type="text" className={styles.input} />
        </div>
        {titleErrors && (
          <ul className={styles.errors}>
            {titleErrors.map((message) => (
              <li key={message}>タイトル{message}</li>
            ))}
          </ul>
        )}
        <button type="submit" className={styles.button}>作成する</button>
      </Form>
    </main>
  )
}

export default TaskNew
