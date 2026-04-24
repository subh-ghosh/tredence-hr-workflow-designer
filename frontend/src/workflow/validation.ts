import type { Edge, Node } from 'reactflow'
import type { WorkflowData } from './graphState'

export function validateWorkflow(
  nodes: Node<WorkflowData>[],
  edges: Edge[],
): string[] {
  const errors: string[] = []

  if (nodes.length === 0) {
    errors.push('Add at least one node.')
    return errors
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
      errors.push('Start node must be first.')
    }

    if (node.data.nodeType !== 'end' && counts.outgoing === 0) {
      errors.push(`${node.id} is missing an outgoing connection.`)
    }

    if (node.data.nodeType !== 'start' && counts.incoming === 0) {
      errors.push(`${node.id} is missing an incoming connection.`)
    }
  }

  if (hasCycle(nodes, edges)) {
    errors.push('Workflow cannot contain cycles.')
  }

  return errors
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
