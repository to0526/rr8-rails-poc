// タスク詳細画面(task-show.tsx)のテスト。
//
// loader(詳細取得) と action(削除) の両方を lib/api.ts 経由の呼び出しとして
// モックし、「画面表示 → 削除ボタン送信 → 一覧へredirect」の一連の流れを検証する。
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createRoutesStub } from 'react-router'
import TaskShow, { action, loader } from './task-show'
import { apiDelete, apiGet } from '../lib/api'

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
  apiDelete: vi.fn(),
}))

function renderTaskShow() {
  const Stub = createRoutesStub([
    {
      path: '/tasks/:id',
      Component: TaskShow,
      loader,
      action,
    },
    {
      // action成功時のredirect先。遷移できたことを確認するための目印を描画する。
      path: '/tasks',
      Component: () => <p>タスク一覧画面</p>,
    },
  ])

  render(<Stub initialEntries={['/tasks/1']} />)
}

describe('TaskShow', () => {
  it('loaderが取得したタスクの内容を表示する', async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: { id: 1, title: '牛乳を買う', done: true } })

    renderTaskShow()

    expect(apiGet).toHaveBeenCalledWith('/tasks/1')
    expect(await screen.findByText('牛乳を買う')).toBeInTheDocument()
    expect(screen.getByText('完了')).toBeInTheDocument()
  })

  it('削除ボタンを押すとdestroyを呼び出し一覧画面へ遷移する', async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: { id: 1, title: '牛乳を買う', done: false } })
    vi.mocked(apiDelete).mockResolvedValue({ status: 204 })

    renderTaskShow()
    const user = userEvent.setup()

    await screen.findByText('牛乳を買う')
    await user.click(screen.getByRole('button', { name: '削除する' }))

    expect(apiDelete).toHaveBeenCalledWith('/tasks/1')
    await waitFor(() => expect(screen.getByText('タスク一覧画面')).toBeInTheDocument())
  })
})
