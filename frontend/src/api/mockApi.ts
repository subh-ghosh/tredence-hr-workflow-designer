import type { Edge, Node } from 'reactflow'
import type { WorkflowData } from '../workflow/graphState'

export type AutomationAction = {
  id: string
  label: string
  params: string[]
}

export type StepLog = {
  stepId: string
  status: string
  message: string
}

export type SimulationResult = {
  steps: StepLog[]
}

export type WorkflowGraph = {
  nodes: Node<WorkflowData>[]
  edges: Edge[]
}

const AUTOMATIONS: AutomationAction[] = [
  { id: 'send_email', label: 'Send Email', params: ['to', 'subject'] },
  { id: 'generate_doc', label: 'Generate Document', params: ['template', 'recipient'] },
]

type MockApiOptions = {
  shouldFail?: boolean
}

export async function getAutomations(options?: MockApiOptions): Promise<AutomationAction[]> {
  if (options?.shouldFail) {
    throw new Error('Unable to load automations')
  }

  return AUTOMATIONS
}

export async function simulateWorkflow(
  workflow: WorkflowGraph,
  options?: MockApiOptions,
): Promise<SimulationResult> {
  if (options?.shouldFail) {
    throw new Error('Simulation failed')
  }

  const steps = workflow.nodes.map((node, index) => ({
    stepId: node.id,
    status: 'success',
    message: `Step ${index + 1}: ${node.data.nodeType}`,
  }))

  return { steps }
}
