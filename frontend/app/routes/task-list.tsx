// タスク一覧画面。
//
// React Router v8 では、画面表示前にデータを取得する処理を
// コンポーネントの外に切り出した「loader」関数として書く。このファイルが
// export する loader を routes.ts でこのルートに紐付けておくと、React Router が
// 「URLが /tasks に変わった → 画面を描画する前に loader を呼ぶ → 取得結果を
// 画面に渡す」という流れを自動的に行ってくれる。
//
// 素の useEffect + fetch(routes-legacy/ に別途用意する比較用の書き方)との違いは、
// - データ取得が「画面の一部」ではなく「そのルートに遷移するときにやること」として
//   ルーティング定義側に宣言される
// - 画面側は useLoaderData() で取得済みのデータを受け取るだけでよく、
//   ローディング状態やuseEffectの依存配列を自分で管理しなくてよい
// という点。
// このPRでは画像・CSSの扱い方も検証している。
// - アイコン(taskIconUrl): public/task-icon.svg を "/task-icon.svg" という
//   絶対パスで直接参照している。app/assets の画像と違い import は不要で、
//   Viteはこのファイルをビルド時に一切加工せず、そのまま dist/ 直下にコピーする
//   (ファイル名にハッシュも付かない)。そのぶん、ファイル名を変更しても
//   ビルドエラーにならず気付きにくい、キャッシュが効きすぎて更新が反映されにくい、
//   といったトレードオフがある。
// - styles: task-list.module.css を import した CSS Modules。
import { Link, useFetcher, useLoaderData, type ActionFunctionArgs } from 'react-router'
import { apiGet, apiPatch } from '../lib/api'
import styles from './task-list.module.css'

const taskIconUrl = '/task-icon.svg'

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
//
// Framework Mode では、routes.ts で紐付けたファイルの中から「loader」という名前の
// exportを自動的に探してこのルートのloaderとして使う(Data Mode時代のように
// router.tsx側でloader: taskListLoaderのように明示的に渡す必要はない)。
// そのため、この名前(loader)は自由に変更できない規約になっている。
export async function loader(): Promise<Task[]> {
  const response = await apiGet<TasksResponse>('/tasks')
  return response.data
}

// action: このルート(/tasks)に対して useFetcher().submit() が呼ばれたときに
// 実行される関数。<Form> によるページ遷移を伴う送信とは違い、fetcher による送信は
// 「今表示している画面はそのままで、裏側でデータだけ更新する」ためのもの
// (このPRでは、一覧の中の1タスクの完了/未完了だけをその場で切り替える用途)。
// loaderと同様、「action」という名前のexportがこのルートのactionとして
// 自動的に使われる(Framework Modeの規約)。
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const taskId = formData.get('taskId')
  const done = formData.get('done') === 'true'

  try {
    await apiPatch(`/tasks/${taskId}`, { task: { done } })
    return { ok: true }
  } catch {
    // バックエンドが落ちている場合など、更新自体が失敗したケース。
    // ここで例外を投げ直すとエラーバウンダリに飛んで画面全体が壊れてしまうため、
    // 「失敗した」という結果を返すだけにとどめる。
    // action が完了すると React Router は自動的に loader を再実行して
    // 一覧を再取得するので、実際には更新されていない(=元のままの)done値が
    // 返ってきて、後述の楽観的UIの表示も自然に元へ戻る(ロールバック)。
    return { ok: false }
  }
}

// TaskRow: 1タスク分の行。チェックボックスの操作を useFetcher() で行う。
//
// useFetcher() は <Form> と違い、ページ遷移を伴わずにローダー/アクションを
// 呼び出すためのフック。ここでは「チェックボックスをクリックしたら、画面はそのままで
// 裏側のRails APIだけ叩いて完了状態を更新する」という用途で使っている。
function TaskRow({ task }: { task: Task }) {
  const fetcher = useFetcher<typeof action>()

  // fetcher.formData は「今まさに送信中のFormData」。送信中でなければ undefined。
  // これが存在する間は、サーバーからの返事を待たずに「送信しようとしている値」を
  // そのまま表示に使う(=楽観的UI)。送信が完了すると formData は消え、
  // taskListLoader が再取得した本当の task.done に表示が切り替わる。
  // 成功していればそのまま同じ見た目になり、失敗していれば元の見た目に戻る、
  // という形でロールバックが自動的に実現される。
  const optimisticDone = fetcher.formData ? fetcher.formData.get('done') === 'true' : task.done

  const handleToggle = () => {
    fetcher.submit(
      { taskId: String(task.id), done: String(!optimisticDone) },
      { method: 'post', action: '/tasks' },
    )
  }

  return (
    <li className={styles.row}>
      <img src={taskIconUrl} alt="" className={styles.icon} />
      <label className={styles.label}>
        <input type="checkbox" checked={optimisticDone} disabled={fetcher.state !== 'idle'} onChange={handleToggle} />
        {' '}
        {task.title}
      </label>
      <Link to={`/tasks/${task.id}`}>詳細</Link>
    </li>
  )
}

function TaskList() {
  // loader が返した値をそのまま受け取る。ここでは fetch もローディング状態の
  // 管理も不要で、「取得済みのデータをどう表示するか」だけに専念できる。
  // 型引数には loader 関数自体(typeof loader)を渡すことで、
  // loader の戻り値の型がそのまま useLoaderData() の戻り値の型として推論される。
  const tasks = useLoaderData<typeof loader>()

  return (
    <main className={styles.main}>
      <h1>タスク一覧</h1>
      <p>
        <Link to="/tasks/new">タスクを作成する</Link>
      </p>
      {tasks.length === 0 ? (
        <p>タスクがありません。</p>
      ) : (
        <ul className={styles.list}>
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </ul>
      )}
    </main>
  )
}

export default TaskList
