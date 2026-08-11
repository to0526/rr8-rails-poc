module Api
  module V1
    class TasksController < ApplicationController
      def index
        tasks = Task.order(:id)

        render json: { data: tasks.map { |task| task_json(task) } }
      end

      private

      def task_json(task)
        {
          id: task.id,
          title: task.title,
          done: task.done,
        }
      end
    end
  end
end
