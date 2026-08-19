// タスク一覧画面(Declarative Mode版・比較用)。
//
// Data Mode版(app/routes/task-list.tsx)が loader を使ってルーティング定義側で
// データ取得を宣言していたのに対し、こちらは React でよく見る素朴な書き方、
// 「コンポーネントがマウントされたら useEffect の中で fetch する」というやり方で
// 同じ一覧を表示する。比較のため、チェックボックスによる完了切り替え
// (useFetcher相当の部分)は含めず、あくまで一覧表示のみを対象にする。
//
// loader版との違い:
// - データ取得のタイミングを「このコンポーネントが画面に表示された後」に
//   自分で起こす必要がある(useEffect の依存配列を書く必要がある)。
//   loader版は「このルートに遷移する」時点でReact Routerが自動的に呼んでくれる。
// - 取得中かどうか(loading)・取得に失敗したかどうか(error)を、
//   自分で useState を使って管理しなければならない。
//   loader版はReact Router側がこの状態を面倒みてくれるため、画面側は
//   「取得済みのデータをどう表示するか」だけに専念できていた。
// - そのため、同じ内容の画面でも記述量が増える。
import { Link } from 'react-router'
import { useEffect, useState } from 'react'
import { apiGet, ApiError } from '../lib/api'

type Task = {
  id: number
  title: string
  done: boolean
}

type TasksResponse = {
  data: Task[]
}

function TaskListLegacy() {
  // loader版では useLoaderData() から受け取るだけで済んでいたデータを、
  // ここでは useState で自前に持つ必要がある。
  const [tasks, setTasks] = useState<Task[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  // useEffect: このコンポーネントが画面に表示された後(マウント後)に実行される。
  // 依存配列を空配列 [] にすることで「最初の1回だけ実行する」という指定になる。
  // これを書き忘れたり依存配列を誤ると、意図しないタイミングで再実行されてしまう
  // といった事故が起きやすいのが、loader版と比べたときの注意点。
  useEffect(() => {
    let cancelled = false

    apiGet<TasksResponse>('/tasks')
      .then((response) => {
        if (!cancelled) {
          setTasks(response.data)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'タスク一覧の取得に失敗しました。')
        }
      })

    // クリーンアップ関数: コンポーネントが画面から消えた後にfetchの結果が
    // 反映されてしまう(すでにアンマウントされたコンポーネントの状態を更新しようと
    // する)事故を防ぐためのフラグ。loader版ではReact Routerがこの面倒もみてくれる。
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main>
      <h1>タスク一覧(Declarative Mode版)</h1>
      <p>
        <Link to="/tasks">Data Mode版(loader使用)を見る</Link>
      </p>
      {error ? (
        <p>{error}</p>
      ) : tasks === null ? (
        <p>読み込み中...</p>
      ) : tasks.length === 0 ? (
        <p>タスクがありません。</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li key={task.id}>
              {task.title}
              {task.done ? '(完了)' : ''}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export default TaskListLegacy
