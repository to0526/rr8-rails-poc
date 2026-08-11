class ApplicationController < ActionController::API
  # 存在しないIDを指定した場合、Railsのデフォルトだと ActiveRecord::RecordNotFound が
  # そのまま500系のHTMLエラーページとして返ってしまう。APIモードなのでJSONで404を返す。
  rescue_from ActiveRecord::RecordNotFound do
    render json: { errors: { base: ["not found"] } }, status: :not_found
  end
end
