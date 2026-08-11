require "rails_helper"

RSpec.describe "Api::V1::Tasks", type: :request do
  # db:seedで投入される確認用データ(db:prepareがテストDB作成時に流し込む)が
  # 残っていると一覧のテストが不安定になるため、各テストの前にクリアしておく
  before { Task.delete_all }

  describe "GET /api/v1/tasks" do
    it "登録済みタスクの一覧をid順に返す" do
      task_b = Task.create!(title: "task b")
      task_a = Task.create!(title: "task a")

      get "/api/v1/tasks"

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body["data"].map { |task| task["id"] }).to eq([ task_b.id, task_a.id ])
    end
  end

  describe "GET /api/v1/tasks/:id" do
    it "対象のタスクが存在する場合は200とタスクの内容を返す" do
      task = Task.create!(title: "task a", done: true)

      get "/api/v1/tasks/#{task.id}"

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body["data"]).to eq(
        "id" => task.id,
        "title" => "task a",
        "done" => true,
      )
    end

    it "対象のタスクが存在しない場合は404とエラーを返す" do
      get "/api/v1/tasks/0"

      expect(response).to have_http_status(:not_found)
      expect(response.parsed_body).to have_key("errors")
    end
  end

  describe "POST /api/v1/tasks" do
    it "titleがあれば201でタスクを作成する" do
      expect do
        post "/api/v1/tasks", params: { task: { title: "new task" } }
      end.to change(Task, :count).by(1)

      expect(response).to have_http_status(:created)
      body = response.parsed_body
      expect(body["data"]).to include("title" => "new task", "done" => false)
    end

    it "titleが空の場合は422とエラーを返す" do
      expect do
        post "/api/v1/tasks", params: { task: { title: "" } }
      end.not_to change(Task, :count)

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["errors"]).to have_key("title")
    end
  end

  describe "PATCH /api/v1/tasks/:id" do
    it "doneを更新できる" do
      task = Task.create!(title: "task a", done: false)

      patch "/api/v1/tasks/#{task.id}", params: { task: { done: true } }

      expect(response).to have_http_status(:ok)
      expect(task.reload.done).to eq(true)
    end

    it "titleを空にしようとすると422とエラーを返す" do
      task = Task.create!(title: "task a")

      patch "/api/v1/tasks/#{task.id}", params: { task: { title: "" } }

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["errors"]).to have_key("title")
      expect(task.reload.title).to eq("task a")
    end
  end

  describe "DELETE /api/v1/tasks/:id" do
    it "対象のタスクを削除して204を返す" do
      task = Task.create!(title: "task a")

      expect do
        delete "/api/v1/tasks/#{task.id}"
      end.to change(Task, :count).by(-1)

      expect(response).to have_http_status(:no_content)
      expect(Task.exists?(task.id)).to eq(false)
    end
  end
end
