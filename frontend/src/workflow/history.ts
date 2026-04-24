import type { Edge, Node } from 'reactflow'
import type { WorkflowData } from './graphState'

export type VersionEntry = {
  createdAt: number
  timestamp: string
  summary: string
  label: string
}

export type NodeVersions = Record<string, VersionEntry[]>

export type GraphSnapshot = {
  nodes: Node<WorkflowData>[]
  edges: Edge[]
  nodeVersions: NodeVersions
}

export type GraphHistory = {
  past: GraphSnapshot[]
  future: GraphSnapshot[]
}

const MAX_HISTORY = 20

function cloneSnapshot(snapshot: GraphSnapshot): GraphSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as GraphSnapshot
}

export function createHistory(): GraphHistory {
  return {
    past: [],
    future: [],
  }
}

export function pushHistory(
  history: GraphHistory,
  current: GraphSnapshot,
): GraphHistory {
  return {
    past: [...history.past.slice(-(MAX_HISTORY - 1)), cloneSnapshot(current)],
    future: [],
  }
}

export function undoHistory(
  history: GraphHistory,
  current: GraphSnapshot,
): { history: GraphHistory; snapshot: GraphSnapshot } | null {
  if (history.past.length === 0) return null

  const snapshot = history.past[history.past.length - 1]

  return {
    history: {
      past: history.past.slice(0, -1),
      future: [cloneSnapshot(current), ...history.future.slice(0, MAX_HISTORY - 1)],
    },
    snapshot: cloneSnapshot(snapshot),
  }
}

export function redoHistory(
  history: GraphHistory,
  current: GraphSnapshot,
): { history: GraphHistory; snapshot: GraphSnapshot } | null {
  if (history.future.length === 0) return null

  const snapshot = history.future[0]

  return {
    history: {
      past: [...history.past.slice(-(MAX_HISTORY - 1)), cloneSnapshot(current)],
      future: history.future.slice(1),
    },
    snapshot: cloneSnapshot(snapshot),
  }
}

export function appendNodeVersion(
  versions: NodeVersions,
  nodeId: string,
  entry: VersionEntry,
): NodeVersions {
  const current = versions[nodeId] ?? []
  const lastEntry = current[current.length - 1]

  const shouldMerge =
    Boolean(lastEntry)
    && lastEntry.summary === entry.summary
    && entry.createdAt - lastEntry.createdAt < 2000

  const nextEntries = shouldMerge
    ? [...current.slice(0, -1), entry]
    : [...current, entry]

  return {
    ...versions,
    [nodeId]: nextEntries.slice(-8),
  }
}
