import type { Edge, Node } from 'reactflow'
import { getNodeLabel, type WorkflowData } from './graphState'

export type ValidationResult = {
  errors: string[]
  nodeErrors: Record<string, string[]>
}

export function validateWorkflow(
  nodes: Node<WorkflowData>[],
  edges: Edge[],
): string[] {
  return validateWorkflowDetailed(nodes, edges).errors
}

export function validateWorkflowDetailed(
  nodes: Node<WorkflowData>[],
  edges: Edge[],
): ValidationResult {
  const errors: string[] = []
  const nodeErrors: Record<string, string[]> = {}

  function addNodeError(nodeId: string, message: string) {
    nodeErrors[nodeId] = [...(nodeErrors[nodeId] ?? []), message]
  }

  if (nodes.length === 0) {
    errors.push('Add at least one node.')
    return { errors, nodeErrors }
  }

  const startNodes = nodes.filter((node) => node.data.nodeType === 'start')
  if (startNodes.length !== 1) {
    errors.push('Workflow must have exactly one Start node.')
  }

  const edgeCountByNode = new Map<string, { incoming: number; outgoing: number }>()
  for (const node of nodes) {
    edgeCountByNode.set(node.id, { incoming: 0, outgoing: 0 })
  }

  for (const edge of edges) {
    const source = edgeCountByNode.get(edge.source)
    const target = edgeCountByNode.get(edge.target)
    if (source) source.outgoing += 1
    if (target) target.incoming += 1
  }

  for (const node of nodes) {
    const counts = edgeCountByNode.get(node.id)
    if (!counts) continue

    if (node.data.nodeType === 'start' && counts.incoming > 0) {
      const message = 'Start node must be first.'
      errors.push(message)
      addNodeError(node.id, message)
    }

    if (node.data.nodeType !== 'end' && counts.outgoing === 0) {
      const message = `${getNodeLabel(node.data)} is missing a next step.`
      errors.push(message)
      addNodeError(node.id, message)
    }

    if (node.data.nodeType !== 'end' && counts.outgoing > 1) {
      const message = `${getNodeLabel(node.data)} can only connect to one next step.`
      errors.push(message)
      addNodeError(node.id, message)
    }

    if (node.data.nodeType !== 'start' && counts.incoming === 0) {
      const message = `${getNodeLabel(node.data)} is not connected from a previous step.`
      errors.push(message)
      addNodeError(node.id, message)
    }
  }

  if (hasCycle(nodes, edges)) {
    const message = 'Workflow cannot contain cycles.'
    errors.push(message)
    for (const node of nodes) {
      addNodeError(node.id, message)
    }
  }

  return { errors, nodeErrors }
}

export function hasCycle(
  nodes: Node<WorkflowData>[],
  edges: Edge[],
): boolean {
  const adjacency = new Map<string, string[]>()
  const visited = new Set<string>()
  const active = new Set<string>()

  for (const node of nodes) {
    adjacency.set(node.id, [])
  }

  for (const edge of edges) {
    adjacency.set(edge.source, [...(adjacency.get(edge.source) ?? []), edge.target])
  }

  function visit(nodeId: string): boolean {
    if (active.has(nodeId)) return true
    if (visited.has(nodeId)) return false

    visited.add(nodeId)
    active.add(nodeId)

    for (const next of adjacency.get(nodeId) ?? []) {
      if (visit(next)) return true
    }

    active.delete(nodeId)
    return false
  }

  for (const node of nodes) {
    if (visit(node.id)) {
      return true
    }
  }

  return false
}
