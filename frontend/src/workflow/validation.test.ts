import { describe, expect, it } from 'vitest'
import type { Edge } from 'reactflow'
import { addWorkflowNode, getDefaultNodeData } from './graphState'
import { hasCycle, validateWorkflow } from './validation'

describe('workflow validation', () => {
  it('returns start-node error when start is missing', () => {
    const nodes = [addWorkflowNode('node_1', { x: 0, y: 0 }, getDefaultNodeData('task'))]
    const errors = validateWorkflow(nodes, [])

    expect(errors).toContain('Workflow must have exactly one Start node.')
  })

  it('returns missing connection errors', () => {
    const nodes = [
      addWorkflowNode('node_1', { x: 0, y: 0 }, getDefaultNodeData('start')),
      addWorkflowNode('node_2', { x: 100, y: 0 }, getDefaultNodeData('task')),
      addWorkflowNode('node_3', { x: 200, y: 0 }, getDefaultNodeData('end')),
    ]
    const edges: Edge[] = [{ id: 'e1', source: 'node_1', target: 'node_2' }]

    const errors = validateWorkflow(nodes, edges)

    expect(errors).toContain('node_2 is missing an outgoing connection.')
    expect(errors).toContain('node_3 is missing an incoming connection.')
  })

  it('detects cycles', () => {
    const nodes = [
      addWorkflowNode('node_1', { x: 0, y: 0 }, getDefaultNodeData('start')),
      addWorkflowNode('node_2', { x: 100, y: 0 }, getDefaultNodeData('task')),
    ]
    const edges: Edge[] = [
      { id: 'e1', source: 'node_1', target: 'node_2' },
      { id: 'e2', source: 'node_2', target: 'node_1' },
    ]

    expect(hasCycle(nodes, edges)).toBe(true)
    expect(validateWorkflow(nodes, edges)).toContain('Workflow cannot contain cycles.')
  })

  it('passes a valid simple workflow', () => {
    const nodes = [
      addWorkflowNode('node_1', { x: 0, y: 0 }, getDefaultNodeData('start')),
      addWorkflowNode('node_2', { x: 100, y: 0 }, getDefaultNodeData('task')),
      addWorkflowNode('node_3', { x: 200, y: 0 }, getDefaultNodeData('end')),
    ]
    const edges: Edge[] = [
      { id: 'e1', source: 'node_1', target: 'node_2' },
      { id: 'e2', source: 'node_2', target: 'node_3' },
    ]

    expect(validateWorkflow(nodes, edges)).toEqual([])
  })
})
