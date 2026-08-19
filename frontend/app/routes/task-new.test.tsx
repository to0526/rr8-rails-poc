// タスク作成画面(task-new.tsx)のテスト。
//
// action は Rails API を fetch() で呼び出すので、テストではその呼び出し先である
// lib/api.ts の apiPost をモックに差し替え、「Rails からこう返ってきたら
// action・画面はこう振る舞う」ことだけを検証する(実際にRails APIを起動しない)。
//
// 画面の描画には createRoutesStub (react-router) を使う。これは
// createBrowserRouter の代わりにルート定義をそのままテスト用ルーターへ渡せる
// ユーティリティで、loader/action を含めて実際の画面と同じ流れ
// (フォーム送信 → action実行 → 画面更新/redirect)を再現できる。
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createRoutesStub } from 'react-router'
import TaskNew, { action } from './task-new'
import { apiPost } from '../lib/api'

vi.mock('../lib/api', () => ({
  apiPost: vi.fn(),
}))

function renderTaskNew() {
  const Stub = createRoutesStub([
    {
      path: '/tasks/new',
      Component: TaskNew,
      action,
    },
    {
      // action成功時のredirect先。遷移できたことを確認するための目印を描画する。
      path: '/tasks',
      Component: () => <p>タスク一覧画面</p>,
    },
  ])

  render(<Stub initialEntries={['/tasks/new']} />)
}

describe('TaskNew', () => {
  it('タイトルを入力して送信すると作成成功時は一覧画面へ遷移する', async () => {
    vi.mocked(apiPost).mockResolvedValue({
      status: 201,
      data: { data: { id: 1, title: '新しいタスク', done: false } },
    })

    renderTaskNew()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('タイトル'), '新しいタスク')
    await user.click(screen.getByRole('button', { name: '作成する' }))

    expect(apiPost).toHaveBeenCalledWith('/tasks', { task: { title: '新しいタスク' } })
    await waitFor(() => expect(screen.getByText('タスク一覧画面')).toBeInTheDocument())
  })

  it('バリデーションエラー(422)の場合はエラーメッセージを表示する', async () => {
    vi.mocked(apiPost).mockResolvedValue({
      status: 422,
      data: { errors: { title: ["can't be blank"] } },
    })

    renderTaskNew()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: '作成する' }))

    expect(await screen.findByText("タイトルcan't be blank")).toBeInTheDocument()
    // 遷移せず作成画面のまま
    expect(screen.getByRole('button', { name: '作成する' })).toBeInTheDocument()
  })
})
