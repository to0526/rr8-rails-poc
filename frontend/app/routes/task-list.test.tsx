// タスク一覧画面(task-list.tsx)のテスト。
//
// - loaderが返したタスクが一覧表示されること
// - チェックボックス操作(useFetcher経由のaction呼び出し)で完了状態が更新され、
//   action完了後にloaderが再実行されて最新の状態に切り替わること
// をそれぞれ検証する。
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createRoutesStub } from 'react-router'
import TaskList, { action, loader } from './task-list'
import { apiGet, apiPatch } from '../lib/api'

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
}))

function renderTaskList() {
  const Stub = createRoutesStub([
    {
      path: '/tasks',
      Component: TaskList,
      loader,
      action,
    },
  ])

  render(<Stub initialEntries={['/tasks']} />)
}

describe('TaskList', () => {
  it('loaderが取得したタスクの一覧を表示する', async () => {
    vi.mocked(apiGet).mockResolvedValue({
      data: [
        { id: 1, title: '牛乳を買う', done: false },
        { id: 2, title: '部屋を片付ける', done: true },
      ],
    })

    renderTaskList()

    expect(await screen.findByText('牛乳を買う')).toBeInTheDocument()
    expect(screen.getByText('部屋を片付ける')).toBeInTheDocument()
  })

  it('タスクがない場合は「タスクがありません。」と表示する', async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: [] })

    renderTaskList()

    expect(await screen.findByText('タスクがありません。')).toBeInTheDocument()
  })

  it('チェックボックスをクリックすると完了状態の更新を送信し、再取得後の状態が反映される', async () => {
    vi.mocked(apiGet)
      .mockResolvedValueOnce({ data: [{ id: 1, title: '牛乳を買う', done: false }] })
      .mockResolvedValue({ data: [{ id: 1, title: '牛乳を買う', done: true }] })
    vi.mocked(apiPatch).mockResolvedValue({ status: 200, data: { data: { id: 1, title: '牛乳を買う', done: true } } })

    renderTaskList()
    const user = userEvent.setup()

    const checkbox = await screen.findByRole('checkbox')
    expect(checkbox).not.toBeChecked()

    await user.click(checkbox)

    expect(apiPatch).toHaveBeenCalledWith('/tasks/1', { task: { done: true } })
    // actionの完了後にloaderが再実行され、その結果(done: true)がチェック状態に反映される
    await waitFor(() => expect(checkbox).toBeChecked())
  })
})
