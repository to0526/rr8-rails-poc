module Api
  module V1
    class TasksController < ApplicationController
      def index
        tasks = Task.order(:id)

        render json: { data: tasks.map { |task| task_json(task) } }
      end

      def show
        task = Task.find(params[:id])

        render json: { data: task_json(task) }
      end

      def create
        task = Task.new(task_params)

        if task.save
          render json: { data: task_json(task) }, status: :created
        else
          render json: { errors: task.errors.to_hash(true) }, status: :unprocessable_entity
        end
      end

      def update
        task = Task.find(params[:id])

        if task.update(task_params)
          render json: { data: task_json(task) }
        else
          render json: { errors: task.errors.to_hash(true) }, status: :unprocessable_entity
        end
      end

      def destroy
        task = Task.find(params[:id])
        task.destroy!

        head :no_content
      end

      private

      def task_params
        params.require(:task).permit(:title, :done)
      end

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
