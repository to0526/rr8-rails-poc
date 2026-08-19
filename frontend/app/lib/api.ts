// Rails API を呼び出すための共通ラッパー。
//
// 各コンポーネントで直接 fetch() を書かず、必ずこのファイルの関数を経由する
// ことにしている(ベースURLの管理やエラーハンドリングを1箇所にまとめるため)。

// バックエンドAPIのベースURL。
//
// Framework Mode(SSR)では、loader/action は「ブラウザ」と「サーバー(Node プロセス)」の
// 2箇所で実行されうる(初回アクセス時やブラウザで直接URLを叩いた場合はサーバー側、
// リンククリック等の画面遷移時はブラウザ側)。この2つは Rails API への到達方法が異なる:
//
// - ブラウザ実行時: ブラウザ自身から見えるURLが必要。docker-compose.ymlでホストに
//   ポート公開している http://localhost:3000 を使う(.env の VITE_API_BASE_URL)
// - サーバー実行時: frontendコンテナ内のNodeプロセスから見たURLが必要。
//   "localhost" はコンテナ自身を指してしまい backend コンテナには届かないため、
//   docker-compose.yml の DB_HOST: db と同じ考え方で、コンテナ間はサービス名
//   "backend" で疎通する(.env の API_BASE_URL_INTERNAL)
//
// "document" はブラウザにだけ存在するグローバルオブジェクトなので、
// typeof document === 'undefined' でどちら側の実行中かを判定できる。
//
// モジュール読み込み時ではなく、各 apiGet 等の呼び出し時に毎回このURLを解決する。
// このファイルは loader/action だけでなく /tasks-legacy(素の useEffect+fetch)からも
// import されるが、後者は実際にはAPIを呼ばない限りサーバー側で評価されることがある
// (SSR時にコンポーネントとして読み込まれるが、fetch自体はブラウザでのuseEffectでのみ
// 発生する)。ここで即座にURLを解決してしまうと、API_BASE_URL_INTERNAL未設定時に
// 本来APIを呼ばないルートのSSRまで巻き込んで失敗させてしまうため、呼び出し時まで
// 遅延させている。
function resolveApiBaseUrl(): string {
  const isServer = typeof document === 'undefined'

  if (isServer) {
    // クライアント側の VITE_API_BASE_URL と違い、サーバー側には「とりあえず動く」
    // デフォルト値を用意できない(localhostだと自分自身を指してしまい間違った
    // 挙動になるため)。設定漏れに気づけるよう、silent fallbackにせずここで
    // 明示的にエラーを投げる。
    const baseUrl = process.env.API_BASE_URL_INTERNAL
    if (!baseUrl) {
      throw new Error(
        'API_BASE_URL_INTERNAL が設定されていません。.env に ' +
          'API_BASE_URL_INTERNAL=http://backend:3000/api/v1 を設定してください。',
      )
    }
    return baseUrl
  }

  // ブラウザ実行時は .env の VITE_API_BASE_URL で上書き可能(ポートを変えた場合などに使う)。
  // VITE_ prefixが付いた環境変数だけがクライアントのJSバンドルに埋め込まれる仕組み
  // (Viteの仕様)なので、こちらはビルド時に決まる import.meta.env から読む。
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1'
}

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
  const response = await fetch(`${resolveApiBaseUrl()}${path}`)

  if (!response.ok) {
    // バリデーションエラー(422)は action 側で個別に扱う想定のため、
    // ここでは「一覧取得が失敗した」という汎用的なエラーとして投げる。
    throw new ApiError(response.status, `API request failed: GET ${path} (${response.status})`)
  }

  return response.json() as Promise<T>
}

// POSTリクエスト用の共通関数(action から呼び出す想定)。
//
// GET と違い、POST はバリデーションエラー(422)が「失敗」ではなく「フォームに
// 表示すべき結果」として返ってくる。そのため 422 のときは例外を投げず、
// レスポンスの status と body をそのまま呼び出し元(action)に返す。
// action 側は status を見て、201 なら成功処理、422 なら useActionData() 用に
// body(errors)をそのまま return する、という使い分けができる。
// それ以外のエラー(500など)は「想定外の失敗」として例外を投げる。
export async function apiPost<T>(path: string, body: unknown): Promise<{ status: number; data: T }> {
  const response = await fetch(`${resolveApiBaseUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = (await response.json()) as T

  if (!response.ok && response.status !== 422) {
    throw new ApiError(response.status, `API request failed: POST ${path} (${response.status})`)
  }

  return { status: response.status, data }
}

// PATCHリクエスト用の共通関数(一覧画面の useFetcher から呼び出す想定)。
//
// apiPost と同様、422(バリデーションエラー)は例外にせずそのまま返す。
// バックエンドが落ちている場合などは fetch() 自体が例外を投げるので、
// その例外は呼び出し元(action)でキャッチしてもらう想定(このファイルでは
// もみ消さない)。
export async function apiPatch<T>(path: string, body: unknown): Promise<{ status: number; data: T }> {
  const response = await fetch(`${resolveApiBaseUrl()}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = (await response.json()) as T

  if (!response.ok && response.status !== 422) {
    throw new ApiError(response.status, `API request failed: PATCH ${path} (${response.status})`)
  }

  return { status: response.status, data }
}

// DELETEリクエスト用の共通関数(詳細画面の action から呼び出す想定)。
//
// Rails 側は削除成功時に 204 No Content(ボディなし)を返す。ボディが無い
// レスポンスに対して response.json() を呼ぶとパースエラーになるため、
// apiGet / apiPost / apiPatch とは違い、ここではボディを読まずステータスだけ返す。
export async function apiDelete(path: string): Promise<{ status: number }> {
  const response = await fetch(`${resolveApiBaseUrl()}${path}`, { method: 'DELETE' })

  if (!response.ok) {
    throw new ApiError(response.status, `API request failed: DELETE ${path} (${response.status})`)
  }

  return { status: response.status }
}
