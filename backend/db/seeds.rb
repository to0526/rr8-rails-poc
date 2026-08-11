# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

# 一覧画面(loader)の動作確認用シードデータ
[
  { title: "React Router v8のloaderを試す", done: true },
  { title: "Rails APIとCORSの設定を確認する", done: true },
  { title: "useFetcher()の楽観的UI更新を試す", done: false },
].each do |attributes|
  Task.find_or_create_by!(title: attributes[:title]) do |task|
    task.done = attributes[:done]
  end
end
