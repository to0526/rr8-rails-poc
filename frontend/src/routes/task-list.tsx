// タスク一覧画面。
//
// React Router v8 の Data Mode では、画面表示前にデータを取得する処理を
// コンポーネントの外に切り出した「loader」関数として書く。router.tsx で
// このルートに loader を紐付けておくと、React Router が
// 「URLが /tasks に変わった → 画面を描画する前に loader を呼ぶ → 取得結果を
// 画面に渡す」という流れを自動的に行ってくれる。
//
// 素の useEffect + fetch(routes-legacy/ に別途用意する比較用の書き方)との違いは、
// - データ取得が「画面の一部」ではなく「そのルートに遷移するときにやること」として
//   ルーティング定義側に宣言される
// - 画面側は useLoaderData() で取得済みのデータを受け取るだけでよく、
//   ローディング状態やuseEffectの依存配列を自分で管理しなくてよい
// という点。
import { Link, useLoaderData } from 'react-router'
import { apiGet } from '../lib/api'

type Task = {
  id: number
  title: string
  done: boolean
}

type TasksResponse = {
  data: Task[]
}

// loader: このルート(/tasks)に遷移する際に、画面の描画より先に呼ばれる関数。
// 戻り値(ここでは Task の配列)が useLoaderData() の戻り値になる。
export async function taskListLoader(): Promise<Task[]> {
  const response = await apiGet<TasksResponse>('/tasks')
  return response.data
}

function TaskList() {
  // loader が返した値をそのまま受け取る。ここでは fetch もローディング状態の
  // 管理も不要で、「取得済みのデータをどう表示するか」だけに専念できる。
  // 型引数には loader 関数自体(typeof taskListLoader)を渡すことで、
  // loader の戻り値の型がそのまま useLoaderData() の戻り値の型として推論される。
  const tasks = useLoaderData<typeof taskListLoader>()

  return (
    <main>
      <h1>タスク一覧</h1>
      <p>
        <Link to="/tasks/new">タスクを作成する</Link>
      </p>
      {tasks.length === 0 ? (
        <p>タスクがありません。</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li key={task.id}>
              {task.done ? '✅' : '⬜️'} {task.title}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export default TaskList
