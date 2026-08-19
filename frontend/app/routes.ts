// Framework Mode におけるルート定義ファイル。
//
// Data Mode 時代は router.tsx で createBrowserRouter([...]) にオブジェクト配列を
// 渡す形でルーティングを定義していたが、Framework Mode ではこの routes.ts に
// index() / route() というヘルパー関数を使ってルート一覧を書く(ファイルベース
// ルーティングは使わず、明示的に列挙する方針は変わらない)。
//
// 各ルートのコンポーネント自体(loader / action を含む)は app/routes/*,
// app/routes-legacy/* に置いてあり、このファイルは「URLパス」と
// 「どのファイルを描画するか」を紐付けるだけ。loader / action は
// 紐付けたファイルが export している "loader" / "action" という名前の関数が
// そのまま使われる規約になっているため、router.tsx 時代のように import して
// loader: taskListLoader のように明示的に渡す必要はない
// (この規約に合わせて、各ルートファイルの loader/action の export名も
// このPRで "loader" / "action" に統一した)。
import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  // "/" にアクセスした時にトップページを表示する
  index('routes/top-page.tsx'),
  // "/tasks" にアクセスした時にタスク一覧画面を表示する。
  // task-list.tsx が export している loader / action が
  // このパスの loader / action として自動的に使われる
  // (Framework Modeの規約により、これらの名前は "loader" / "action" 固定)。
  route('tasks', 'routes/task-list.tsx'),
  // "/tasks/new" にアクセスした時にタスク作成画面を表示する。
  route('tasks/new', 'routes/task-new.tsx'),
  // "/tasks/:id" にアクセスした時にタスク詳細画面を表示する。":id" 部分は
  // 可変パラメータ(params.id として loader/action に渡る)。
  route('tasks/:id', 'routes/task-show.tsx'),
  // "/tasks-legacy" にアクセスした時に、Declarative Mode版のタスク一覧を表示する。
  // このファイルは loader を export していないため、Data Mode時代と同様
  // useEffect でのデータ取得のままになる(比較用)。
  route('tasks-legacy', 'routes-legacy/task-list-legacy.tsx'),
] satisfies RouteConfig
