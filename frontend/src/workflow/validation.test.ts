import { describe, expect, it } from 'vitest'
import type { Edge } from 'reactflow'
import { addWorkflowNode, getDefaultNodeData } from './graphState'
import { hasCycle, validateWorkflow, validateWorkflowDetailed } from './validation'

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

    expect(errors).toContain('Task is missing a next step.')
    expect(errors).toContain('End is not connected from a previous step.')
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

  it('returns node-level validation errors for broken nodes', () => {
    const nodes = [
      addWorkflowNode('node_1', { x: 0, y: 0 }, getDefaultNodeData('start')),
      addWorkflowNode('node_2', { x: 100, y: 0 }, getDefaultNodeData('task')),
    ]

    const result = validateWorkflowDetailed(nodes, [])

    expect(result.nodeErrors.node_1).toContain('Start is missing a next step.')
    expect(result.nodeErrors.node_2).toContain('Task is missing a next step.')
    expect(result.nodeErrors.node_2).toContain('Task is not connected from a previous step.')
  })

  it('blocks branching workflows with multiple next steps', () => {
    const nodes = [
      addWorkflowNode('node_1', { x: 0, y: 0 }, getDefaultNodeData('start')),
      addWorkflowNode('node_2', { x: 100, y: 0 }, getDefaultNodeData('task')),
      addWorkflowNode('node_3', { x: 200, y: 0 }, getDefaultNodeData('approval')),
      addWorkflowNode('node_4', { x: 300, y: 0 }, getDefaultNodeData('end')),
    ]
    const edges: Edge[] = [
      { id: 'e1', source: 'node_1', target: 'node_2' },
      { id: 'e2', source: 'node_2', target: 'node_3' },
      { id: 'e3', source: 'node_2', target: 'node_4' },
    ]

    const result = validateWorkflowDetailed(nodes, edges)

    expect(result.errors).toContain('Task can only connect to one next step.')
    expect(result.nodeErrors.node_2).toContain('Task can only connect to one next step.')
  })
})
