import type { Edge, Node, XYPosition } from 'reactflow'
import {
  getDefaultNodeData,
  getNodeLabel,
  type WorkflowData,
  type WorkflowNodeType,
} from './graphState'

export type WorkflowGraph = {
  nodes: Node<WorkflowData>[]
  edges: Edge[]
}

export type WorkflowTemplate = {
  id: string
  label: string
  nodeType: WorkflowNodeType
  data: WorkflowData
}

export function serializeWorkflow(graph: WorkflowGraph): string {
  return JSON.stringify(graph, null, 2)
}

export function parseWorkflowJson(value: string): WorkflowGraph {
  const parsed = JSON.parse(value) as WorkflowGraph

  if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
    throw new Error('JSON must contain nodes and edges arrays.')
  }

  return parsed
}

export function createTemplateNode(
  id: string,
  position: XYPosition,
  template: WorkflowTemplate,
): Node<WorkflowData> {
  return normalizeWorkflowNode({
    id,
    type: 'workflow',
    position,
    data: template.data,
  })
}

export function autoLayoutWorkflow(graph: WorkflowGraph): WorkflowGraph {
  const orderedNodes = getOrderedWorkflowNodes(graph)
  const positions = new Map<string, XYPosition>()

  orderedNodes.forEach((node, index) => {
    positions.set(node.id, {
      x: 120 + (index % 2) * 240,
      y: 80 + Math.floor(index / 2) * 140,
    })
  })

  return {
    ...graph,
    nodes: graph.nodes.map((node) => ({
      ...node,
      position: positions.get(node.id) ?? node.position,
    })),
  }
}

export function normalizeWorkflowNode(node: Node<WorkflowData>): Node<WorkflowData> {
  const normalizedData = normalizeWorkflowData(node.data)

  return {
    ...node,
    type: 'workflow',
    position: node.position ?? { x: 0, y: 0 },
    data: {
      ...normalizedData,
      label: getNodeLabel(normalizedData),
    },
  }
}

export function normalizeWorkflowGraph(graph: WorkflowGraph): WorkflowGraph {
  const normalizedNodes = graph.nodes.map(normalizeWorkflowNode)
  const nodeIds = new Set(normalizedNodes.map((node) => node.id))

  return {
    nodes: normalizedNodes,
    edges: graph.edges.filter(
      (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
    ),
  }
}

export function getHighestNodeCounter(nodes: Node<WorkflowData>[]): number {
  return nodes.reduce((highest, node) => {
    const match = /^node_(\d+)$/.exec(node.id)
    const value = match ? Number(match[1]) : 0
    return Math.max(highest, value)
  }, 0)
}

export function getOrderedWorkflowNodes(graph: WorkflowGraph): Node<WorkflowData>[] {
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]))
  const nextBySource = new Map(graph.edges.map((edge) => [edge.source, edge.target]))
  const startNode = graph.nodes.find((node) => node.data.nodeType === 'start')

  if (!startNode) {
    return graph.nodes
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

  for (const node of graph.nodes) {
    if (!seen.has(node.id)) {
      ordered.push(node)
    }
  }

  return ordered
}

function normalizeWorkflowData(data: WorkflowData): WorkflowData {
  const nodeType = isWorkflowNodeType(data?.nodeType)
    ? data.nodeType
    : 'task'
  const defaults = getDefaultNodeData(nodeType)

  return {
    ...defaults,
    ...data,
    nodeType,
  }
}

function isWorkflowNodeType(value: string | undefined): value is WorkflowNodeType {
  return value === 'start'
    || value === 'task'
    || value === 'approval'
    || value === 'automated'
    || value === 'end'
}
