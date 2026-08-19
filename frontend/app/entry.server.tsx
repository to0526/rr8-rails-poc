import { PassThrough } from 'node:stream'

import type { EntryContext, RouterContextProvider } from 'react-router'
import { createReadableStreamFromReadable } from '@react-router/node'
import { ServerRouter } from 'react-router'
import { isbot } from 'isbot'
import type { RenderToPipeableStreamOptions } from 'react-dom/server'
import { renderToPipeableStream } from 'react-dom/server'

// サーバー側(Node プロセス)のエントリポイント。
// Framework Mode ではリクエストが来るたびに react-router-serve(本番相当。PR19で使用)や
// `vite dev` の内部サーバーがこの handleRequest を呼び出し、その戻り値の Response が
// そのままブラウザへのレスポンスになる。
//
// Data Mode時代は index.html という「静的な完成品」をそのまま返していたが、
// Framework Mode では毎回このファイルが実行され、ServerRouter が現在の URL
// (request.url)に対応するルートを実際にレンダリングして HTML 文字列を生成する。
// これが SSR の実体で、curl で叩いても中身入りの HTML が返ってくる理由。
export const streamTimeout = 5_000

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  // このPoCでは context() 機構(loader/action 間でリクエスト単位の値を共有する仕組み)を
  // 使っていないため未使用。tsconfig の noUnusedParameters に引っかからないよう
  // アンダースコア始まりの名前にしている(シグネチャ自体は React Router が要求する形)
  _loadContext: RouterContextProvider,
) {
  // HEAD リクエストはボディ不要なので、レンダリングをせずに空レスポンスを返す
  // https://httpwg.org/specs/rfc9110.html#HEAD
  if (request.method.toUpperCase() === 'HEAD') {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders,
    })
  }

  return new Promise((resolve, reject) => {
    let shellRendered = false
    const userAgent = request.headers.get('user-agent')

    // 検索エンジンのクローラー(bot)からのリクエストの場合は、ページ全体の
    // レンダリングが完了する(onAllReady)まで待ってからレスポンスを返す。
    // 通常のブラウザからのアクセスでは、最低限の見た目(シェル)が組み上がった
    // 時点(onShellReady)ですぐにレスポンスを返し始め、残りは後からストリーミングで
    // 送る(体感速度を優先)。SEO対策が目的の1つであるこのPoCでは、bot向けの
    // 分岐が特に重要になる。
    const readyOption: keyof RenderToPipeableStreamOptions =
      (userAgent && isbot(userAgent)) || routerContext.isSpaMode ? 'onAllReady' : 'onShellReady'

    // レンダリングが streamTimeout を超えて終わらない場合に強制的に打ち切るための
    // タイマー(サーバーがリクエストを溜め込み続けるのを防ぐ)
    let timeoutId: ReturnType<typeof setTimeout> | undefined = setTimeout(
      () => abort(),
      streamTimeout + 1000,
    )

    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        [readyOption]() {
          shellRendered = true
          const body = new PassThrough({
            final(callback) {
              clearTimeout(timeoutId)
              timeoutId = undefined
              callback()
            },
          })
          const stream = createReadableStreamFromReadable(body)

          responseHeaders.set('Content-Type', 'text/html')

          pipe(body)

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          )
        },
        onShellError(error: unknown) {
          reject(error)
        },
        onError(error: unknown) {
          responseStatusCode = 500
          // シェル(初回描画分)がすでにクライアントへ送られた後のエラーはここで
          // ログを出す(送信前のエラーは onShellError 側で reject されるため、
          // 二重にログが出ないようにしている)
          if (shellRendered) {
            console.error(error)
          }
        },
      },
    )
  })
}
