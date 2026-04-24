import { describe, expect, it } from 'vitest'
import type { Edge } from 'reactflow'
import { simulateWorkflow } from '../api/mockApi'
import { addWorkflowNode, getDefaultNodeData } from './graphState'
import { validateWorkflow } from './validation'

describe('workflow integration flow', () => {
  it('validates a complete workflow and then returns simulation logs', async () => {
    const nodes = [
      addWorkflowNode('node_1', { x: 0, y: 0 }, getDefaultNodeData('start')),
      addWorkflowNode('node_2', { x: 120, y: 0 }, getDefaultNodeData('task')),
      addWorkflowNode('node_3', { x: 240, y: 0 }, getDefaultNodeData('approval')),
      addWorkflowNode('node_4', { x: 360, y: 0 }, getDefaultNodeData('automated')),
      addWorkflowNode('node_5', { x: 480, y: 0 }, getDefaultNodeData('end')),
    ]
    const edges: Edge[] = [
      { id: 'e1', source: 'node_1', target: 'node_2' },
      { id: 'e2', source: 'node_2', target: 'node_3' },
      { id: 'e3', source: 'node_3', target: 'node_4' },
      { id: 'e4', source: 'node_4', target: 'node_5' },
    ]

    const errors = validateWorkflow(nodes, edges)
    expect(errors).toEqual([])

    const result = await simulateWorkflow({ nodes, edges })

    expect(result.steps).toHaveLength(5)
    expect(result.steps[0].message).toBe('Step 1: start')
    expect(result.steps[4].message).toBe('Step 5: end')
  })

  it('stops at validation for an invalid workflow', async () => {
    const nodes = [
      addWorkflowNode('node_1', { x: 0, y: 0 }, getDefaultNodeData('task')),
      addWorkflowNode('node_2', { x: 120, y: 0 }, getDefaultNodeData('end')),
    ]
    const edges: Edge[] = []

    const errors = validateWorkflow(nodes, edges)

    expect(errors).toContain('Workflow must have exactly one Start node.')
    expect(errors.length).toBeGreaterThan(0)
  })
})
