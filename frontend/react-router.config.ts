import type { Config } from '@react-router/dev/config'

// Framework Mode の設定ファイル。ssr: true にすることで、全ルートが
// サーバーサイドレンダリング(SSR)される(個別ルートで ssr: false にする運用はしない、
// と方針を確定済み)。
//
// appDirectory はデフォルトで "app" が使われるため、PR14 で frontend/src/ を
// frontend/app/ にリネーム済みのこのリポジトリでは明示指定が不要。
export default {
  ssr: true,
} satisfies Config
