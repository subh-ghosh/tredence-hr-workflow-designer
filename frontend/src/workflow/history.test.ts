import { describe, expect, it } from 'vitest'
import { addWorkflowNode, getDefaultNodeData } from './graphState'
import {
  appendNodeVersion,
  createHistory,
  pushHistory,
  redoHistory,
  undoHistory,
  type GraphSnapshot,
} from './history'

function createSnapshot(ids: string[]): GraphSnapshot {
  return {
    nodes: ids.map((id, index) =>
      addWorkflowNode(id, { x: index * 100, y: 0 }, getDefaultNodeData('task'))),
    edges: [],
    nodeVersions: Object.fromEntries(
      ids.map((id) => [
        id,
        [{ createdAt: 0, timestamp: 'now', summary: 'Created', label: id }],
      ]),
    ),
  }
}

describe('history helpers', () => {
  it('stores a past snapshot and clears future on new change', () => {
    const history = createHistory()
    const current = createSnapshot(['node_1'])
    const next = pushHistory(history, current)

    expect(next.past).toHaveLength(1)
    expect(next.future).toHaveLength(0)
    expect(next.past[0].nodes[0].id).toBe('node_1')
  })

  it('undoes to the previous snapshot and saves current to future', () => {
    const start = createSnapshot(['node_1'])
    const current = createSnapshot(['node_1', 'node_2'])
    const history = pushHistory(createHistory(), start)

    const result = undoHistory(history, current)

    expect(result).not.toBeNull()
    expect(result?.snapshot.nodes).toHaveLength(1)
    expect(result?.snapshot.nodeVersions.node_1).toHaveLength(1)
    expect(result?.history.future).toHaveLength(1)
    expect(result?.history.future[0].nodes).toHaveLength(2)
  })

  it('redoes to the saved future snapshot', () => {
    const start = createSnapshot(['node_1'])
    const current = createSnapshot(['node_1', 'node_2'])
    const history = pushHistory(createHistory(), start)
    const undone = undoHistory(history, current)

    if (!undone) {
      throw new Error('Expected undo result')
    }

    const redone = redoHistory(undone.history, start)

    expect(redone).not.toBeNull()
    expect(redone?.snapshot.nodes).toHaveLength(2)
    expect(redone?.history.past).toHaveLength(1)
  })

  it('merges repeated quick version updates with the same summary', () => {
    const first = { createdAt: 1000, timestamp: 't1', summary: 'Renamed Task step', label: 'Task' }
    const second = { createdAt: 1500, timestamp: 't2', summary: 'Renamed Task step', label: 'Task A' }

    const versions = appendNodeVersion(
      appendNodeVersion({}, 'node_1', first),
      'node_1',
      second,
    )

    expect(versions.node_1).toHaveLength(1)
    expect(versions.node_1[0].timestamp).toBe('t2')
    expect(versions.node_1[0].label).toBe('Task A')
  })
})
