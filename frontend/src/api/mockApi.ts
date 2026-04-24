import type { Edge, Node } from 'reactflow'
import type { WorkflowData } from '../workflow/graphState'
import { getNodeLabel } from '../workflow/graphState'
import { getOrderedWorkflowNodes } from '../workflow/graphUtils'

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

  const orderedNodes = getOrderedWorkflowNodes(workflow)

  const steps = orderedNodes.map((node, index) => ({
    stepId: node.id,
    status: 'success',
    message: `Step ${index + 1}: ${getNodeLabel(node.data)}`,
  }))

  const endNodeWithSummary = orderedNodes.find(
    (node) => node.data.nodeType === 'end' && node.data.summaryFlag,
  )

  if (endNodeWithSummary) {
    steps.push({
      stepId: `${endNodeWithSummary.id}_summary`,
      status: 'success',
      message: `Summary: ${endNodeWithSummary.data.endMessage ?? 'End'}`,
    })
  }

  return { steps }
}
