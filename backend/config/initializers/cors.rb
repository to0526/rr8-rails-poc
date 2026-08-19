# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin Ajax requests.

# Read more: https://github.com/cyu/rack-cors

# 許可オリジンは .env の FRONTEND_ORIGIN から読み込む(検証用フロントエンドのみ許可)。
# 未設定時は開発時のデフォルトとして Vite dev server のURLにフォールバックする。
# カンマ区切りで複数指定できる(PR19: 本番相当検証用の frontend-prod サービスが
# 別ポートで動くため、開発用フロントエンドと合わせて2つのオリジンを許可する必要がある)。
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins ENV.fetch("FRONTEND_ORIGIN", "http://localhost:5173").split(",").map(&:strip)

    resource "*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head]
  end
end
