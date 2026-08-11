// Rails API を呼び出すための共通ラッパー。
//
// 各コンポーネントで直接 fetch() を書かず、必ずこのファイルの関数を経由する
// ことにしている(ベースURLの管理やエラーハンドリングを1箇所にまとめるため)。

// バックエンドAPIのベースURL。docker-compose経由で起動している場合、ブラウザから見た
// バックエンドは http://localhost:3000 になるため、それをデフォルト値にしている。
// .env の VITE_API_BASE_URL で上書き可能(ポートを変えた場合などに使う)。
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1'

// Rails側で {"data": [...]} や {"errors": {...}} のようなエラーではない
// レスポンスが返ってきた場合(500エラーなど)に投げる例外。
export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// GETリクエスト用の共通関数。
//
// React Router の loader は「そのルートの画面を表示する前に呼ばれ、戻り値が
// useLoaderData() で画面から参照できるようになる」関数。loader の中からこの
// apiGet() を呼び出すことで、画面表示前にAPIからデータを取得できる。
export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`)

  if (!response.ok) {
    // バリデーションエラー(422)は action 側で個別に扱う想定のため、
    // ここでは「一覧取得が失敗した」という汎用的なエラーとして投げる。
    throw new ApiError(response.status, `API request failed: GET ${path} (${response.status})`)
  }

  return response.json() as Promise<T>
}
