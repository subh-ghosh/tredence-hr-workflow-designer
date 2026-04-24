import { describe, expect, it } from 'vitest'
import { getAutomations, simulateWorkflow } from './mockApi'
import { addWorkflowNode, getDefaultNodeData } from '../workflow/graphState'

describe('mock API', () => {
  it('returns automation actions', async () => {
    const actions = await getAutomations()

    expect(actions).toHaveLength(2)
    expect(actions[0].id).toBe('send_email')
    expect(actions[0].params).toEqual(['to', 'subject'])
  })

  it('returns automation fetch error when requested', async () => {
    await expect(getAutomations({ shouldFail: true })).rejects.toThrow(
      'Unable to load automations',
    )
  })

  it('returns step logs for simulation', async () => {
    const workflow = {
      nodes: [
        addWorkflowNode('node_1', { x: 0, y: 0 }, getDefaultNodeData('start')),
        addWorkflowNode('node_2', { x: 100, y: 0 }, getDefaultNodeData('task')),
      ],
      edges: [{ id: 'e1', source: 'node_1', target: 'node_2' }],
    }

    const result = await simulateWorkflow(workflow)

    expect(result.steps).toHaveLength(2)
    expect(result.steps[0].message).toBe('Step 1: start')
    expect(result.steps[1].message).toBe('Step 2: task')
  })

  it('returns simulation error when requested', async () => {
    await expect(
      simulateWorkflow({ nodes: [], edges: [] }, { shouldFail: true }),
    ).rejects.toThrow('Simulation failed')
  })
})
