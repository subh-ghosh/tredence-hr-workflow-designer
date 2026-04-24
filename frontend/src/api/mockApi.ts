import type { Edge, Node } from 'reactflow'
import type { WorkflowData } from '../workflow/graphState'
import { getNodeLabel } from '../workflow/graphState'

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

  return { steps }
}

function getOrderedWorkflowNodes(workflow: WorkflowGraph): Node<WorkflowData>[] {
  const nodesById = new Map(workflow.nodes.map((node) => [node.id, node]))
  const nextBySource = new Map(workflow.edges.map((edge) => [edge.source, edge.target]))
  const startNode = workflow.nodes.find((node) => node.data.nodeType === 'start')

  if (!startNode) {
    return workflow.nodes
  }

  const ordered: Node<WorkflowData>[] = []
  const seen = new Set<string>()
  let current: Node<WorkflowData> | undefined = startNode

  while (current && !seen.has(current.id)) {
    ordered.push(current)
    seen.add(current.id)
    const nextId = nextBySource.get(current.id)
    current = nextId ? nodesById.get(nextId) : undefined
  }

  for (const node of workflow.nodes) {
    if (!seen.has(node.id)) {
      ordered.push(node)
    }
  }

  return ordered
}
