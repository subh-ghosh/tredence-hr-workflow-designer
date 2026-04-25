import { describe, expect, it } from 'vitest'
import { addWorkflowNode, getDefaultNodeData } from './graphState'
import {
  autoLayoutWorkflow,
  getHighestNodeCounter,
  getOrderedWorkflowNodes,
  normalizeWorkflowGraph,
  parseWorkflowJson,
  serializeWorkflow,
} from './graphUtils'

describe('graph utils', () => {
  it('serializes and parses workflow json', () => {
    const graph = {
      nodes: [addWorkflowNode('node_1', { x: 0, y: 0 }, getDefaultNodeData('start'))],
      edges: [],
    }

    const text = serializeWorkflow(graph)
    const parsed = parseWorkflowJson(text)

    expect(parsed.nodes).toHaveLength(1)
    expect(parsed.edges).toHaveLength(0)
    expect(parsed.nodes[0].id).toBe('node_1')
  })

  it('throws for invalid workflow json shape', () => {
    expect(() => parseWorkflowJson('{"nodes":{}}')).toThrow(
      'JSON must contain nodes and edges arrays.',
    )
  })

  it('applies simple auto layout positions', () => {
    const graph = {
      nodes: [
        addWorkflowNode('node_2', { x: 0, y: 0 }, getDefaultNodeData('task')),
        addWorkflowNode('node_1', { x: 0, y: 0 }, getDefaultNodeData('start')),
        addWorkflowNode('node_3', { x: 0, y: 0 }, getDefaultNodeData('end')),
      ],
      edges: [
        { id: 'e1', source: 'node_1', target: 'node_2' },
        { id: 'e2', source: 'node_2', target: 'node_3' },
      ],
    }

    const layouted = autoLayoutWorkflow(graph)

    const positions = Object.fromEntries(
      layouted.nodes.map((node) => [node.id, node.position]),
    )

    expect(positions.node_1).toEqual({ x: 350, y: 80 })
    expect(positions.node_2).toEqual({ x: 350, y: 260 })
    expect(positions.node_3).toEqual({ x: 350, y: 440 })
  })

  it('normalizes imported workflow nodes', () => {
    const graph = normalizeWorkflowGraph({
      nodes: [
        {
          id: 'node_7',
          type: 'default',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'task',
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'node_7', target: 'missing' },
      ],
    })

    expect(graph.nodes[0].data.title).toBe('Task')
    expect(graph.nodes[0].data.label).toBe('Task')
    expect(graph.edges).toEqual([])
  })

  it('finds the highest numbered node id', () => {
    const nodes = [
      addWorkflowNode('node_2', { x: 0, y: 0 }, getDefaultNodeData('task')),
      addWorkflowNode('node_15', { x: 0, y: 0 }, getDefaultNodeData('start')),
      addWorkflowNode('custom', { x: 0, y: 0 }, getDefaultNodeData('end')),
    ]

    expect(getHighestNodeCounter(nodes)).toBe(15)
  })

  it('orders nodes by workflow path from start', () => {
    const graph = {
      nodes: [
        addWorkflowNode('node_2', { x: 0, y: 0 }, getDefaultNodeData('task')),
        addWorkflowNode('node_1', { x: 0, y: 0 }, getDefaultNodeData('start')),
        addWorkflowNode('node_3', { x: 0, y: 0 }, getDefaultNodeData('end')),
      ],
      edges: [
        { id: 'e1', source: 'node_1', target: 'node_2' },
        { id: 'e2', source: 'node_2', target: 'node_3' },
      ],
    }

    const ordered = getOrderedWorkflowNodes(graph)

    expect(ordered.map((node) => node.id)).toEqual(['node_1', 'node_2', 'node_3'])
  })
})
