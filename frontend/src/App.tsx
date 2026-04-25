import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlowProvider,
  getNodesBounds,
  getViewportForBounds,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeProps,
  type ReactFlowInstance,
  type Viewport,
} from 'reactflow'
import 'reactflow/dist/style.css'
import './App.css'
import {
  addWorkflowNode,
  createNodeId,
  deleteSelectedElements,
  getDefaultNodeData,
  getNodeLabel,
  updateWorkflowNode,
  validateTaskTitle,
  type WorkflowData,
  type WorkflowNodeType,
} from './workflow/graphState'
import {
  getAutomations,
  simulateWorkflow,
  type AutomationAction,
  type StepLog,
} from './api/mockApi'
import {
  autoLayoutWorkflow,
  createTemplateNode,
  getHighestNodeCounter,
  normalizeWorkflowGraph,
  parseWorkflowJson,
  serializeWorkflow,
} from './workflow/graphUtils'
import {
  appendNodeVersion,
  createHistory,
  type NodeVersions,
  pushHistory,
  redoHistory,
  undoHistory,
  type GraphSnapshot,
  type VersionEntry,
} from './workflow/history'
import { WORKFLOW_TEMPLATES } from './workflow/templates'
import { validateWorkflow, validateWorkflowDetailed } from './workflow/validation'

const NODE_TYPES: WorkflowNodeType[] = [
  'start',
  'task',
  'approval',
  'automated',
  'end',
]

function getNodeTone(nodeType: WorkflowNodeType): {
  label: string
  helper: string
  className: string
} {
  if (nodeType === 'start') {
    return {
      label: 'Start',
      helper: 'Entry point',
      className: 'workflow-card-start',
    }
  }

  if (nodeType === 'task') {
    return {
      label: 'Task',
      helper: 'Human action',
      className: 'workflow-card-task',
    }
  }

  if (nodeType === 'approval') {
    return {
      label: 'Approval',
      helper: 'Decision point',
      className: 'workflow-card-approval',
    }
  }

  if (nodeType === 'automated') {
    return {
      label: 'Automation',
      helper: 'System action',
      className: 'workflow-card-automated',
    }
  }

  return {
    label: 'End',
    helper: 'Final outcome',
    className: 'workflow-card-end',
  }
}

function getMutedNodeToneClass(nodeType: WorkflowNodeType): string {
  if (nodeType === 'start') return 'workflow-card-start-muted'
  if (nodeType === 'task') return 'workflow-card-task-muted'
  if (nodeType === 'approval') return 'workflow-card-approval-muted'
  if (nodeType === 'automated') return 'workflow-card-automated-muted'
  return 'workflow-card-end-muted'
}

function WorkflowCardNode({ data, selected }: NodeProps<WorkflowData>) {
  const tone = getNodeTone(data.nodeType)

  return (
    <div className={`workflow-card ${tone.className} ${selected ? 'is-selected' : ''}`}>
      <Handle type="target" position={Position.Top} className="workflow-handle" />
      <div className="workflow-card-kicker">{tone.label}</div>
      {data.hasError && (
        <div className="workflow-card-warning" title={data.errorMessages?.join('\n') || `${data.errorCount} issue(s) detected`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{data.errorCount}</span>
        </div>
      )}
      <div className="workflow-card-title">{getNodeLabel(data)}</div>
      <div className="workflow-card-helper">{tone.helper}</div>
      <Handle type="source" position={Position.Bottom} className="workflow-handle" />
    </div>
  )
}

function createVersionEntry(data: WorkflowData, summary: string): VersionEntry {
  return {
    createdAt: Date.now(),
    timestamp: new Date().toLocaleString(),
    summary,
    label: getNodeLabel(data),
  }
}

function buildNodeStyles(
  nodes: Node<WorkflowData>[],
  nodeErrors: Record<string, string[]>,
  selectedNodeId: string | null,
  selectedEdgeId: string | null,
): Node<WorkflowData>[] {
  const hasSelection = Boolean(selectedNodeId || selectedEdgeId)

  return nodes.map((node) => {
    const hasError = Boolean(nodeErrors[node.id]?.length)
    const isSelected = selectedNodeId === node.id
    const classNames = []

    if (hasError) {
      classNames.push('workflow-node-has-error')
    }

    if (hasSelection && !isSelected) {
      classNames.push('workflow-node-is-muted')
      classNames.push(getMutedNodeToneClass(node.data.nodeType))
    }

    return {
      ...node,
      className: classNames.join(' ') || undefined,
      style: undefined,
      data: {
        ...node.data,
        hasError,
        errorCount: nodeErrors[node.id]?.length || 0,
        errorMessages: nodeErrors[node.id] || [],
      },
    }
  })
}

function buildEdgeStyles(
  edges: Edge[],
  selectedNodeId: string | null,
  selectedEdgeId: string | null,
  isDarkMode: boolean
): Edge[] {
  const hasSelection = Boolean(selectedNodeId || selectedEdgeId)

  return edges.map((edge) => {
    const isSelectedEdge = selectedEdgeId === edge.id
    const isConnectedToSelectedNode = selectedNodeId
      ? edge.source === selectedNodeId || edge.target === selectedNodeId
      : false
    const isHighlighted = isSelectedEdge || isConnectedToSelectedNode

    const baseColor = isDarkMode ? '#60a5fa' : '#235b9c';
    const highlightColor = isDarkMode ? '#93c5fd' : '#74a3ff';
    const mutedColor = isDarkMode ? '#475569' : '#334155';

    if (!hasSelection) {
      return {
        ...edge,
        animated: true,
        style: {
          ...edge.style,
          stroke: baseColor,
          strokeWidth: 2.2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 18,
          height: 18,
          color: baseColor,
        },
      }
    }

    return {
      ...edge,
      animated: isHighlighted,
      style: {
        ...edge.style,
        stroke: isHighlighted ? highlightColor : mutedColor,
        strokeWidth: isHighlighted ? 3.5 : 2.2,
        opacity: isHighlighted ? 1 : 0.58,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 18,
        height: 18,
        color: isHighlighted ? highlightColor : mutedColor,
      },
    }
  })
}

function pruneNodeVersions(
  versions: NodeVersions,
  nodes: Node<WorkflowData>[],
): NodeVersions {
  const nodeIds = new Set(nodes.map((node) => node.id))

  return Object.fromEntries(
    Object.entries(versions).filter(([nodeId]) => nodeIds.has(nodeId)),
  )
}

function getSupportedNodeChanges(changes: NodeChange[]): NodeChange[] {
  return changes.filter(
    (change) => !['add', 'replace', 'reset'].includes(String(change.type)),
  )
}

function getSupportedEdgeChanges(changes: EdgeChange[]): EdgeChange[] {
  return changes.filter(
    (change) => !['add', 'replace', 'reset'].includes(String(change.type)),
  )
}

type WorkspaceTabState = {
  id: string
  name: string
  snapshot: GraphSnapshot
  history: ReturnType<typeof createHistory>
  viewport: Viewport
  nodeCounter: number
}

function createWorkspaceTab(index: number): WorkspaceTabState {
  return {
    id: `ws-${index + 1}`,
    name: `Workspace ${index + 1}`,
    snapshot: { nodes: [], edges: [], nodeVersions: {} },
    history: createHistory(),
    viewport: { x: 0, y: 0, zoom: 1 },
    nodeCounter: 0,
  }
}

function CanvasWorkspace({ isDarkMode }: { isDarkMode: boolean }) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const nodeCounter = useRef(0)
  const latestGraphRef = useRef<GraphSnapshot>({ nodes: [], edges: [], nodeVersions: {} })
  const activeEditNodeIdRef = useRef<string | null>(null)
  const historyRef = useRef(createHistory())
  const viewportRef = useRef<Viewport>({ x: 0, y: 0, zoom: 1 })
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)

  const [nodes, setNodes] = useState<Node<WorkflowData>[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [history, setHistory] = useState(createHistory)
  const [nodeVersions, setNodeVersions] = useState<NodeVersions>({})
  const [graphRenderKey, setGraphRenderKey] = useState(0)
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 })
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [automations, setAutomations] = useState<AutomationAction[]>([])
  const [automationsLoading, setAutomationsLoading] = useState(true)
  const [automationsError, setAutomationsError] = useState('')
  const [simulationErrors, setSimulationErrors] = useState<string[]>([])
  const [simulationLogs, setSimulationLogs] = useState<StepLog[]>([])
  const [simulationLoading, setSimulationLoading] = useState(false)
  const [importExportText, setImportExportText] = useState('')
  const [importError, setImportError] = useState('')
  const [workspaceTabs, setWorkspaceTabs] = useState<WorkspaceTabState[]>([
    createWorkspaceTab(0),
    createWorkspaceTab(1),
    createWorkspaceTab(2),
  ])
  const [activeWorkspaceId, setActiveWorkspaceId] = useState('ws-1')
  const nodeTypes = useMemo(() => ({ workflow: WorkflowCardNode }), [])

  // Mobile state
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768)
  const [activeTab, setActiveTab] = useState<'steps' | 'canvas'>('canvas')
  const [mobileEditOpen, setMobileEditOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  )

  const validationMessage = useMemo(() => {
    if (!selectedNode) return null
    return validateTaskTitle(selectedNode.data)
  }, [selectedNode])

  const validationPreview = useMemo(
    () => validateWorkflowDetailed(nodes, edges),
    [nodes, edges],
  )

  const displayNodes = useMemo(
    () => buildNodeStyles(nodes, validationPreview.nodeErrors, selectedNodeId, selectedEdgeId),
    [nodes, selectedEdgeId, selectedNodeId, validationPreview.nodeErrors],
  )

  const displayEdges = useMemo(
    () => buildEdgeStyles(edges, selectedNodeId, selectedEdgeId, isDarkMode),
    [edges, selectedEdgeId, selectedNodeId, isDarkMode], // added isDarkMode
  )

  const selectedAutomation = useMemo(() => {
    if (!selectedNode || selectedNode.data.nodeType !== 'automated') return null
    return automations.find((item) => item.id === selectedNode.data.actionId) ?? null
  }, [automations, selectedNode])

  const selectedNodeHistory = selectedNodeId ? nodeVersions[selectedNodeId] ?? [] : []

  useEffect(() => {
    latestGraphRef.current = { nodes, edges, nodeVersions }
  }, [edges, nodeVersions, nodes])

  useEffect(() => {
    historyRef.current = history
  }, [history])

  useEffect(() => {
    viewportRef.current = viewport
  }, [viewport])

  useEffect(() => {
    async function loadAutomations() {
      try {
        const result = await getAutomations()
        setAutomations(result)
        setAutomationsError('')
      } catch {
        setAutomationsError('Could not load automation actions.')
      } finally {
        setAutomationsLoading(false)
      }
    }

    loadAutomations()
  }, [])

  const clearSelection = useCallback(() => {
    activeEditNodeIdRef.current = null
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
    setMobileEditOpen(false)
  }, [])

  const persistActiveWorkspace = useCallback(
    (tabs: WorkspaceTabState[]): WorkspaceTabState[] =>
      tabs.map((tab) => {
        if (tab.id !== activeWorkspaceId) return tab

        return {
          ...tab,
          snapshot: latestGraphRef.current,
          history: historyRef.current,
          viewport: viewportRef.current,
          nodeCounter: nodeCounter.current,
        }
      }),
    [activeWorkspaceId],
  )

  const loadWorkspaceTab = useCallback(
    (tab: WorkspaceTabState) => {
      setHistory(tab.history)
      setViewport(tab.viewport)
      nodeCounter.current = tab.nodeCounter
      activeEditNodeIdRef.current = null
      latestGraphRef.current = tab.snapshot
      setNodes(tab.snapshot.nodes)
      setEdges(tab.snapshot.edges)
      setNodeVersions(tab.snapshot.nodeVersions)
      setGraphRenderKey((current) => current + 1)
      setImportError('')
      setSimulationErrors([])
      setSimulationLogs([])
      clearSelection()
    },
    [clearSelection],
  )

  const switchWorkspaceTab = useCallback(
    (workspaceId: string) => {
      if (workspaceId === activeWorkspaceId) return

      const updatedTabs = persistActiveWorkspace(workspaceTabs)
      const target = updatedTabs.find((tab) => tab.id === workspaceId)
      if (!target) return

      setWorkspaceTabs(updatedTabs)
      setActiveWorkspaceId(workspaceId)
      loadWorkspaceTab(target)
    },
    [activeWorkspaceId, loadWorkspaceTab, persistActiveWorkspace, workspaceTabs],
  )

  const addWorkspaceTab = useCallback(() => {
    const updatedTabs = persistActiveWorkspace(workspaceTabs)
    const nextIndex = updatedTabs.length + 1
    const newTab: WorkspaceTabState = {
      id: `ws-${Date.now()}`,
      name: `Workspace ${nextIndex}`,
      snapshot: { nodes: [], edges: [], nodeVersions: {} },
      history: createHistory(),
      viewport: { x: 0, y: 0, zoom: 1 },
      nodeCounter: 0,
    }

    setWorkspaceTabs(updatedTabs.concat(newTab))
    setActiveWorkspaceId(newTab.id)
    loadWorkspaceTab(newTab)
  }, [loadWorkspaceTab, persistActiveWorkspace, workspaceTabs])

  const closeWorkspaceTab = useCallback(
    (workspaceId: string) => {
      if (workspaceTabs.length <= 1) return

      const updatedTabs = persistActiveWorkspace(workspaceTabs)
      const removeIndex = updatedTabs.findIndex((tab) => tab.id === workspaceId)
      if (removeIndex < 0) return

      const remainingTabs = updatedTabs.filter((tab) => tab.id !== workspaceId)

      if (workspaceId !== activeWorkspaceId) {
        setWorkspaceTabs(remainingTabs)
        return
      }

      const fallbackIndex = removeIndex > 0 ? removeIndex - 1 : 0
      const fallback = remainingTabs[fallbackIndex]
      if (!fallback) return

      setWorkspaceTabs(remainingTabs)
      setActiveWorkspaceId(fallback.id)
      loadWorkspaceTab(fallback)
    },
    [activeWorkspaceId, loadWorkspaceTab, persistActiveWorkspace, workspaceTabs],
  )

  const syncSelection = useCallback(
    (nextNodes: Node<WorkflowData>[], nextEdges: Edge[]) => {
      const hasSelectedNode = selectedNodeId
        ? nextNodes.some((node) => node.id === selectedNodeId)
        : false
      const hasSelectedEdge = selectedEdgeId
        ? nextEdges.some((edge) => edge.id === selectedEdgeId)
        : false

      if (hasSelectedNode) {
        setSelectedNodeId(selectedNodeId)
        setSelectedEdgeId(null)
        return
      }

      if (hasSelectedEdge) {
        setSelectedEdgeId(selectedEdgeId)
        setSelectedNodeId(null)
        return
      }

      clearSelection()
    },
    [clearSelection, selectedEdgeId, selectedNodeId],
  )

  const applySnapshot = useCallback(
    (snapshot: GraphSnapshot) => {
      activeEditNodeIdRef.current = null
      latestGraphRef.current = snapshot
      setNodes(snapshot.nodes)
      setEdges(snapshot.edges)
      setNodeVersions(snapshot.nodeVersions)
      setGraphRenderKey((current) => current + 1)
      syncSelection(snapshot.nodes, snapshot.edges)
    },
    [syncSelection],
  )

  const commitGraph = useCallback(
    (
      nextNodes: Node<WorkflowData>[],
      nextEdges: Edge[],
      nextNodeVersions: NodeVersions = latestGraphRef.current.nodeVersions,
    ) => {
      activeEditNodeIdRef.current = null
      const stateBeforeChange = latestGraphRef.current;
      setHistory((current) => pushHistory(current, stateBeforeChange))
      const snapshot = {
        nodes: nextNodes,
        edges: nextEdges,
        nodeVersions: pruneNodeVersions(nextNodeVersions, nextNodes),
      }
      latestGraphRef.current = snapshot
      setNodes(nextNodes)
      setEdges(nextEdges)
      setNodeVersions(snapshot.nodeVersions)
      setGraphRenderKey((current) => current + 1)
      syncSelection(nextNodes, nextEdges)
    },
    [syncSelection],
  )

  const commitNodeEdit = useCallback(
    (
      nodeId: string,
      nextNodes: Node<WorkflowData>[],
      nextEdges: Edge[],
      nextNodeVersions: NodeVersions = latestGraphRef.current.nodeVersions,
    ) => {
      if (activeEditNodeIdRef.current !== nodeId) {
        const stateBeforeChange = latestGraphRef.current;
        setHistory((current) => pushHistory(current, stateBeforeChange))
        activeEditNodeIdRef.current = nodeId
      }
      const snapshot = {
        nodes: nextNodes,
        edges: nextEdges,
        nodeVersions: pruneNodeVersions(nextNodeVersions, nextNodes),
      }
      latestGraphRef.current = snapshot
      setNodes(nextNodes)
      setEdges(nextEdges)
      setNodeVersions(snapshot.nodeVersions)
    },
    [],
  )

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const supportedChanges = getSupportedNodeChanges(changes)
      if (supportedChanges.length === 0) return

      const hasRemove = supportedChanges.some((change) => change.type === 'remove')
      if (!hasRemove) {
        setNodes((current) => applyNodeChanges(supportedChanges, current))
        return
      }

      const current = latestGraphRef.current
      const nextNodes = applyNodeChanges(supportedChanges, current.nodes)
      const remainingIds = new Set(nextNodes.map((node) => node.id))
      const nextEdges = current.edges.filter(
        (edge) => remainingIds.has(edge.source) && remainingIds.has(edge.target),
      )
      setNodeVersions((currentVersions) =>
        Object.fromEntries(
          Object.entries(currentVersions).filter(([nodeId]) => remainingIds.has(nodeId)),
        ),
      )

      commitGraph(nextNodes, nextEdges)
    },
    [commitGraph],
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const supportedChanges = getSupportedEdgeChanges(changes)
      if (supportedChanges.length === 0) return

      const hasRemove = supportedChanges.some((change) => change.type === 'remove')
      if (!hasRemove) {
        setEdges((current) => applyEdgeChanges(supportedChanges, current))
        return
      }

      const current = latestGraphRef.current
      commitGraph(current.nodes, applyEdgeChanges(supportedChanges, current.edges))
    },
    [commitGraph],
  )

  const onConnect = useCallback(
    (params: Connection) => {
      const current = latestGraphRef.current
      commitGraph(current.nodes, addEdge(params, current.edges))
    },
    [commitGraph],
  )

  const onDragStart = useCallback((event: React.DragEvent<HTMLButtonElement>, nodeType: WorkflowNodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }, [])

  const onTemplateDragStart = useCallback(
    (event: React.DragEvent<HTMLButtonElement>, templateId: string) => {
      event.dataTransfer.setData('application/reactflow-template', templateId)
      event.dataTransfer.effectAllowed = 'move'
    },
    [],
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow') as WorkflowNodeType
      const templateId = event.dataTransfer.getData('application/reactflow-template')
      if ((!type && !templateId) || !reactFlowInstance || !reactFlowWrapper.current) return

      const bounds = reactFlowWrapper.current.getBoundingClientRect()
      const position = reactFlowInstance.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      })

      const nextId = createNodeId(++nodeCounter.current)
      const current = latestGraphRef.current
      if (templateId) {
        const template = WORKFLOW_TEMPLATES.find((item) => item.id === templateId)
        if (!template) return
        const nextNode = createTemplateNode(nextId, position, template)
        const nextNodeVersions = {
          ...current.nodeVersions,
          [nextId]: [createVersionEntry(nextNode.data, `Created from template: ${template.label}`)],
        }
        commitGraph(current.nodes.concat(nextNode), current.edges, nextNodeVersions)
        return
      }

      const nextNode = addWorkflowNode(nextId, position, getDefaultNodeData(type))
      const nextNodeVersions = {
        ...current.nodeVersions,
        [nextId]: [createVersionEntry(nextNode.data, 'Created step')],
      }
      commitGraph(current.nodes.concat(nextNode), current.edges, nextNodeVersions)
    },
    [commitGraph, reactFlowInstance],
  )

  const deleteSelection = useCallback(() => {
    const current = latestGraphRef.current
    const updated = deleteSelectedElements(
      current.nodes,
      current.edges,
      selectedNodeId,
      selectedEdgeId,
    )
    const remainingIds = new Set(updated.nodes.map((node) => node.id))
    setNodeVersions((currentVersions) =>
      Object.fromEntries(
        Object.entries(currentVersions).filter(([nodeId]) => remainingIds.has(nodeId)),
      ),
    )
    commitGraph(updated.nodes, updated.edges)
  }, [commitGraph, selectedEdgeId, selectedNodeId])

  const undo = useCallback(() => {
    const result = undoHistory(history, latestGraphRef.current)
    if (!result) return

    setHistory(result.history)
    applySnapshot(result.snapshot)
  }, [applySnapshot, history])

  const redo = useCallback(() => {
    const result = redoHistory(history, latestGraphRef.current)
    if (!result) return

    setHistory(result.history)
    applySnapshot(result.snapshot)
  }, [applySnapshot, history])

  const panelTitle = useMemo(() => {
    if (selectedNode) return `Selected step: ${getNodeLabel(selectedNode.data)}`
    if (selectedEdgeId) return `Selected edge: ${selectedEdgeId}`
    return 'No selection'
  }, [selectedEdgeId, selectedNode])

  const updateSelectedNode = useCallback(
    (updater: (data: WorkflowData) => WorkflowData) => {
      if (!selectedNodeId) return
      const current = latestGraphRef.current
      commitNodeEdit(
        selectedNodeId,
        updateWorkflowNode(current.nodes, selectedNodeId, updater),
        current.edges,
      )
    },
    [commitNodeEdit, selectedNodeId],
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName
      if (
        activeTag === 'INPUT' ||
        activeTag === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const cmdKey = isMac ? e.metaKey : e.ctrlKey

      if (cmdKey && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
      } else if (cmdKey && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId || selectedEdgeId) {
          e.preventDefault()
          deleteSelection()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, deleteSelection, selectedNodeId, selectedEdgeId])

  const getMiniMapColor = useCallback((node: Node<WorkflowData>) => {
    switch (node.data.nodeType) {
      case 'start': return '#10b981'
      case 'task': return '#3b82f6'
      case 'approval': return '#f59e0b'
      case 'automated': return '#8b5cf6'
      case 'end': return '#ef4444'
      default: return '#94a3b8'
    }
  }, [])

  const patchSelectedNode = useCallback(
    (patch: Partial<WorkflowData>) => {
      updateSelectedNode((data) => ({ ...data, ...patch }))
    },
    [updateSelectedNode],
  )

  const updateKeyValueField = useCallback(
    (
      fieldName: 'metadata' | 'customFields',
      index: number,
      key: 'key' | 'value',
      value: string,
    ) => {
      updateSelectedNode((data) => {
        const currentFields = [...(data[fieldName] ?? [])]
        const currentItem = currentFields[index] ?? { key: '', value: '' }
        currentFields[index] = { ...currentItem, [key]: value }
        return { ...data, [fieldName]: currentFields }
      })
    },
    [updateSelectedNode],
  )

  const addKeyValueField = useCallback(
    (fieldName: 'metadata' | 'customFields') => {
      updateSelectedNode((data) => ({
        ...data,
        [fieldName]: [...(data[fieldName] ?? []), { key: '', value: '' }],
      }))
    },
    [updateSelectedNode],
  )

  const saveSelectedNodeVersion = useCallback(() => {
    if (!selectedNodeId || !selectedNode) return

    setNodeVersions((currentVersions) =>
      appendNodeVersion(
        currentVersions,
        selectedNodeId,
        createVersionEntry(selectedNode.data, 'Saved version'),
      ),
    )
  }, [selectedNode, selectedNodeId])

  const runSimulation = useCallback(async () => {
    const errors = validateWorkflow(nodes, edges)
    setSimulationErrors(errors)
    setSimulationLogs([])

    if (errors.length > 0) {
      return
    }

    setSimulationLoading(true)

    try {
      const result = await simulateWorkflow({ nodes, edges })
      setSimulationLogs(result.steps)
    } catch {
      setSimulationErrors(['Simulation failed.'])
    } finally {
      setSimulationLoading(false)
    }
  }, [edges, nodes])

  const exportWorkflowJson = useCallback(() => {
    setImportExportText(serializeWorkflow({ nodes, edges }))
    setImportError('')
  }, [edges, nodes])

  const importWorkflowJson = useCallback(() => {
    try {
      const parsed = normalizeWorkflowGraph(parseWorkflowJson(importExportText))
      nodeCounter.current = getHighestNodeCounter(parsed.nodes)
      const importedNodeVersions = Object.fromEntries(
        parsed.nodes.map((node) => [node.id, [createVersionEntry(node.data, 'Imported step')]]),
      )
      commitGraph(parsed.nodes, parsed.edges, importedNodeVersions)
      setImportError('')
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : 'Could not import workflow JSON.',
      )
    }
  }, [commitGraph, importExportText])

  const applyAutoLayout = useCallback(() => {
    const layouted = autoLayoutWorkflow({ nodes, edges })
    commitGraph(layouted.nodes, layouted.edges)
  }, [commitGraph, edges, nodes])

  const loadSampleWorkflow = useCallback(() => {
    // Row 1 (L→R): Start → Task → Tech Eval → Final HR
    // Row 2 (L→R): Gen AI → Send Offer → End (positioned under row 1, rightmost first)
    const r1y = 60
    const r2y = 280
    const sampleNodes: Node<WorkflowData>[] = [
      { id: 's1', type: 'workflow', position: { x: 40, y: r1y }, data: { nodeType: 'start', startTitle: 'Tredence Onboarding: Subarta Ghosh' } },
      { id: 's2', type: 'workflow', position: { x: 260, y: r1y }, data: { nodeType: 'task', title: 'Submit GitHub & UI Projects', description: 'Share all project repos and prototypes', assignee: 'Subarta Ghosh', dueDate: 'Day 1' } },
      { id: 's3', type: 'workflow', position: { x: 480, y: r1y }, data: { nodeType: 'approval', title: 'Technical Evaluation', approverRole: 'Tech Lead', dueDate: 'Day 2' } },
      { id: 's4', type: 'workflow', position: { x: 700, y: r1y }, data: { nodeType: 'approval', title: 'Final HR Sign-Off', approverRole: 'HR Manager', dueDate: 'Day 3' } },
      { id: 's5', type: 'workflow', position: { x: 700, y: r2y }, data: { nodeType: 'automated', title: 'Generate AI Intern Offer', description: 'AI-generated personalised offer package' } },
      { id: 's6', type: 'workflow', position: { x: 480, y: r2y }, data: { nodeType: 'automated', title: 'Send Offer Email', description: 'Auto-send official offer letter to candidate' } },
      { id: 's7', type: 'workflow', position: { x: 260, y: r2y }, data: { nodeType: 'end', endMessage: 'Subarta Onboarded Successfully', summaryFlag: true } },
    ]
    const sampleEdges: Edge[] = [
      { id: 'e1', source: 's1', target: 's2', type: 'smoothstep', animated: true },
      { id: 'e2', source: 's2', target: 's3', type: 'smoothstep', animated: true },
      { id: 'e3', source: 's3', target: 's4', type: 'smoothstep', animated: true },
      { id: 'e4', source: 's4', target: 's5', type: 'smoothstep', animated: true }, // straight down ↓
      { id: 'e5', source: 's5', target: 's6', type: 'smoothstep', animated: true }, // ←
      { id: 'e6', source: 's6', target: 's7', type: 'smoothstep', animated: true }, // ←
    ]
    const versions: NodeVersions = {}
    sampleNodes.forEach((n) => {
      versions[n.id] = [createVersionEntry(n.data, 'Loaded from sample')]
    })
    commitGraph(sampleNodes, sampleEdges, versions)
    if (isMobile) setActiveTab('canvas')
  }, [commitGraph, isMobile])

  const downloadGraphImage = useCallback(() => {
    if (nodes.length === 0) return

    // 1. Calculate the bounding box of all nodes
    const nodesBounds = getNodesBounds(nodes)
    const padding = 200 // Increased padding for edges that curve outward
    const captureWidth = nodesBounds.width + padding
    const captureHeight = nodesBounds.height + padding

    // 2. Get the specific transform required to fit the nodes into this dimension
    const transform = getViewportForBounds(
      nodesBounds,
      captureWidth,
      captureHeight,
      0.5,
      2
    )

    // 3. Select the scalable viewport layer
    const viewportEl = document.querySelector('.react-flow__viewport') as HTMLElement
    if (!viewportEl) return

    toPng(viewportEl, {
      backgroundColor: isDarkMode ? '#0b0f19' : '#f8fafc',
      width: captureWidth,
      height: captureHeight,
      pixelRatio: isMobile ? 1 : 2,
      style: {
        width: `${captureWidth}px`,
        height: `${captureHeight}px`,
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
      },
    }).then((dataUrl) => {
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = 'tredence-workflow.png'
      link.click()
    }).catch((err) => {
      console.error('Download failed', err)
    })
  }, [isDarkMode, nodes, isMobile])

  // Mobile: add a node at center of canvas
  const addNodeAtCenter = useCallback(
    (type: WorkflowNodeType) => {
      const nextId = createNodeId(++nodeCounter.current)
      const current = latestGraphRef.current
      const position = { x: 140 + Math.random() * 80, y: 120 + Math.random() * 80 }
      const nextNode = addWorkflowNode(nextId, position, getDefaultNodeData(type))
      const nextNodeVersions = {
        ...current.nodeVersions,
        [nextId]: [createVersionEntry(nextNode.data, 'Created step')],
      }
      commitGraph(current.nodes.concat(nextNode), current.edges, nextNodeVersions)
      if (isMobile) setActiveTab('canvas')
    },
    [commitGraph, isMobile],
  )

  const addTemplateAtCenter = useCallback(
    (templateId: string) => {
      const template = WORKFLOW_TEMPLATES.find((item) => item.id === templateId)
      if (!template) return
      const nextId = createNodeId(++nodeCounter.current)
      const current = latestGraphRef.current
      const position = { x: 140 + Math.random() * 80, y: 120 + Math.random() * 80 }
      const nextNode = createTemplateNode(nextId, position, template)
      const nextNodeVersions = {
        ...current.nodeVersions,
        [nextId]: [createVersionEntry(nextNode.data, `Created from template: ${template.label}`)],
      }
      commitGraph(current.nodes.concat(nextNode), current.edges, nextNodeVersions)
      if (isMobile) setActiveTab('canvas')
    },
    [commitGraph, isMobile],
  )

  return (
    <div className={`panels${isMobile ? ` mobile-panels mobile-tab-${activeTab}` : ''}`}>
      <aside className="panel" data-testid="panel-sidebar" aria-label="Node palette">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">1. Pick A Step</span>
            <h2>Workflow building blocks</h2>
          </div>
          <span className="panel-badge">Drag & drop</span>
        </div>
        <p className="panel-hint">
          Start with a <strong>Start</strong> step, add the work in the middle, and finish
          with an <strong>End</strong> step.
        </p>
        <ul className="node-list">
          {NODE_TYPES.map((nodeType) => (
            <li key={nodeType}>
              <div className="node-chip-row">
                <button type="button" className="node-chip" data-node-type={nodeType} draggable onDragStart={(event) => onDragStart(event, nodeType)}>
                  <span className="node-chip-title">{nodeType}</span>
                  <span className="node-chip-copy">
                    {nodeType === 'start' && 'Where the workflow begins'}
                    {nodeType === 'task' && 'A human task someone completes'}
                    {nodeType === 'approval' && 'A decision or sign-off step'}
                    {nodeType === 'automated' && 'A system action triggered automatically'}
                    {nodeType === 'end' && 'How the workflow finishes'}
                  </span>
                </button>
                {isMobile && (
                  <button
                    type="button"
                    className="tap-add-btn"
                    onClick={() => addNodeAtCenter(nodeType)}
                    aria-label={`Add ${nodeType} step`}
                  >
                    +
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
        <h3 className="section-title">Quick-start templates</h3>
        <p className="panel-hint">
          Use these if you want a pre-filled example instead of starting from a blank step.
        </p>
        <ul className="node-list">
          {WORKFLOW_TEMPLATES.map((template) => (
            <li key={template.id}>
              <div className="node-chip-row">
                <button
                  type="button"
                  className="node-chip node-chip--template"
                  data-node-type="template"
                  draggable
                  onDragStart={(event) => onTemplateDragStart(event, template.id)}
                >
                  <span className="node-chip-title">{template.label}</span>
                  <span className="node-chip-copy">Ready-made content you can edit later</span>
                </button>
                {isMobile && (
                  <button
                    type="button"
                    className="tap-add-btn"
                    onClick={() => addTemplateAtCenter(template.id)}
                    aria-label={`Use template ${template.label}`}
                  >
                    +
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </aside>

      <main className="panel panel-canvas" data-testid="panel-canvas" aria-label="Workflow canvas area">
        <div className="canvas-header">
          <div>
            <span className="eyebrow">2. Arrange The Flow</span>
            <h2>Workflow canvas</h2>
          </div>
        </div>
        <div className="workspace-tabs" data-testid="workspace-tabs" role="tablist" aria-label="Workflow workspaces">
          {workspaceTabs.map((tab) => {
            const isActive = tab.id === activeWorkspaceId
            return (
              <div key={tab.id} className={`workspace-tab-item${isActive ? ' is-active' : ''}`}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`workspace-tab-btn${isActive ? ' is-active' : ''}`}
                  onClick={() => switchWorkspaceTab(tab.id)}
                >
                  {tab.name}
                </button>
                {workspaceTabs.length > 1 && (
                  <button
                    type="button"
                    className="workspace-tab-close"
                    onClick={(event) => {
                      event.stopPropagation()
                      closeWorkspaceTab(tab.id)
                    }}
                    aria-label={`Close ${tab.name}`}
                  >
                    ×
                  </button>
                )}
              </div>
            )
          })}
          <button
            type="button"
            className="workspace-tab-add"
            onClick={addWorkspaceTab}
          >
            + New tab
          </button>
        </div>
        <div className="canvas-intro">
          <div className="canvas-tip drag-hint">
            <strong>How to use it:</strong> drag steps from the left, connect them in order,
            then click any step to configure it.
          </div>
          {isMobile && (
            <div className="canvas-tip">
              <strong>How to use it:</strong> go to <strong>Steps</strong> tab and tap <strong>+</strong> to add steps, then connect and tap to configure.
            </div>
          )}
          <div className="canvas-tip subtle">
            Tip: Use <strong>Auto-layout</strong> after adding a few steps to clean up the
            diagram.
          </div>
        </div>
        <div className="canvas-toolbar">
          <div className="toolbar-actions">
            <button type="button" onClick={undo} disabled={history.past.length === 0}>Undo</button>
            <button type="button" onClick={redo} disabled={history.future.length === 0}>Redo</button>
            <button type="button" onClick={applyAutoLayout} disabled={nodes.length === 0}>Auto-layout</button>
            <button type="button" onClick={deleteSelection} disabled={!selectedNodeId && !selectedEdgeId}>Delete</button>
            <button type="button" className="sample-btn" onClick={loadSampleWorkflow}>✦ Sample</button>
            <button type="button" className="download-btn" onClick={downloadGraphImage} disabled={nodes.length === 0}
              title="Download graph as PNG">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download
            </button>
          </div>
        </div>

        <div
          ref={reactFlowWrapper}
          className={`canvas-surface ${selectedNodeId || selectedEdgeId ? 'has-selection' : ''}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <ReactFlow
            className={selectedNodeId || selectedEdgeId ? 'workflow-has-selection' : undefined}
            key={graphRenderKey}
            disableKeyboardA11y={true}
            nodes={displayNodes}
            edges={displayEdges}
            nodeTypes={nodeTypes}
            defaultViewport={viewport}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onMoveEnd={(_, nextViewport) => {
              setViewport(nextViewport)
            }}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 18,
                height: 18,
                color: '#235b9c',
              },
              style: {
                stroke: '#235b9c',
                strokeWidth: 2.2,
              },
            }}
            onNodeClick={(_, node) => {
              setSelectedNodeId(node.id)
              setSelectedEdgeId(null)
              if (isMobile) setMobileEditOpen(false) // show Edit button, not modal immediately
            }}
            onEdgeClick={(_, edge) => {
              setSelectedEdgeId(edge.id)
              setSelectedNodeId(null)
            }}
            onPaneClick={() => {
              clearSelection()
            }}
          >
            <MiniMap
              pannable
              zoomable
              nodeStrokeColor="#14365f"
              nodeColor={getMiniMapColor}
              maskColor="rgba(15, 23, 42, 0.08)"
            />
            <Controls />
            <Background color="#c2d3e8" gap={28} size={1.35} />
          </ReactFlow>
        </div>

        {/* Mobile floating Edit button when node selected */}
        {isMobile && selectedNodeId && !mobileEditOpen && (
          <div className="mobile-node-actions">
            <button
              type="button"
              className="mobile-edit-btn"
              onClick={() => setMobileEditOpen(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit step
            </button>
            <button
              type="button"
              className="mobile-deselect-btn"
              onClick={() => { clearSelection(); setMobileEditOpen(false) }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Mobile sandbox & import-export moved here from right panel */}
        {isMobile && (
          <div className="mobile-canvas-bottom">
            <div className="sandbox-panel">
              <div className="sandbox-header">
                <div>
                  <h3>Test the workflow</h3>
                  <p className="panel-hint">Run a quick check to validate the flow and preview the execution log.</p>
                </div>
                <button type="button" onClick={runSimulation} disabled={simulationLoading}>
                  {simulationLoading ? 'Running...' : 'Run test'}
                </button>
              </div>
              {simulationErrors.length > 0 && (
                <ul className="error-list" data-testid="simulation-errors">
                  {simulationErrors.map((error) => <li key={error}>{error}</li>)}
                </ul>
              )}
              {simulationLogs.length > 0 && (
                <ol className="log-list" data-testid="simulation-logs">
                  {simulationLogs.map((log) => (
                    <li key={log.stepId}><strong>{log.status}</strong>: {log.message}</li>
                  ))}
                </ol>
              )}
            </div>
            <div className="import-export-panel">
              <h3>Import or export workflow JSON</h3>
              <p className="panel-hint">Export your current workflow for backup or reuse, or paste valid workflow JSON to import it.</p>
              <div className="toolbar-actions">
                <button type="button" className="secondary-button" onClick={exportWorkflowJson} disabled={nodes.length === 0}>Export JSON</button>
                <button type="button" className="secondary-button" onClick={importWorkflowJson} disabled={!importExportText.trim()}>Import JSON</button>
              </div>
              <textarea
                value={importExportText}
                onChange={(event) => setImportExportText(event.target.value)}
                className="json-box"
                placeholder="Your workflow JSON will appear here. You can also paste JSON here and import it."
              />
              {importError && <p className="validation-error">{importError}</p>}
            </div>
          </div>
        )}
      </main>

      {/* Mobile node edit modal */}
      {isMobile && mobileEditOpen && selectedNode && (
        <div className="mobile-modal-overlay" onClick={() => setMobileEditOpen(false)}>
          <div className="mobile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3>Edit: {getNodeLabel(selectedNode.data)}</h3>
              <button type="button" className="mobile-modal-close" onClick={() => setMobileEditOpen(false)}>✕</button>
            </div>
            <div className="mobile-modal-body">
              {selectedNode.data.nodeType === 'start' && (
                <div className="form-grid">
                  <label>Name
                    <input value={selectedNode.data.startTitle ?? ''} onChange={(e) => patchSelectedNode({ startTitle: e.target.value })} />
                  </label>
                </div>
              )}
              {selectedNode.data.nodeType === 'task' && (
                <div className="form-grid">
                  <label>Name<input value={selectedNode.data.title ?? ''} onChange={(e) => patchSelectedNode({ title: e.target.value })} /></label>
                  <label>Notes<input value={selectedNode.data.description ?? ''} onChange={(e) => patchSelectedNode({ description: e.target.value })} /></label>
                  <label>Owner<input value={selectedNode.data.assignee ?? ''} onChange={(e) => patchSelectedNode({ assignee: e.target.value })} /></label>
                  <label>Due date<input value={selectedNode.data.dueDate ?? ''} onChange={(e) => patchSelectedNode({ dueDate: e.target.value })} /></label>
                </div>
              )}
              {selectedNode.data.nodeType === 'approval' && (
                <div className="form-grid">
                  <label>Name<input value={selectedNode.data.title ?? ''} onChange={(e) => patchSelectedNode({ title: e.target.value })} /></label>
                  <label>Approver role<input value={selectedNode.data.approverRole ?? ''} onChange={(e) => patchSelectedNode({ approverRole: e.target.value })} /></label>
                  <label>Due
                    <input value={selectedNode.data.dueDate ?? ''} onChange={(e) => patchSelectedNode({ dueDate: e.target.value })} />
                  </label>
                </div>
              )}
              {selectedNode.data.nodeType === 'automated' && (
                <div className="form-grid">
                  <label>Name<input value={selectedNode.data.title ?? ''} onChange={(e) => patchSelectedNode({ title: e.target.value })} /></label>
                  <label>Notes<input value={selectedNode.data.description ?? ''} onChange={(e) => patchSelectedNode({ description: e.target.value })} /></label>
                </div>
              )}
              {selectedNode.data.nodeType === 'end' && (
                <div className="form-grid">
                  <label>End message<input value={selectedNode.data.endMessage ?? ''} onChange={(e) => patchSelectedNode({ endMessage: e.target.value })} /></label>
                </div>
              )}
              {validationMessage && <p className="validation-error">{validationMessage}</p>}
              {validationPreview.nodeErrors[selectedNode.id]?.length ? (
                <ul className="error-list compact-list">
                  {validationPreview.nodeErrors[selectedNode.id].map((err) => <li key={err}>{err}</li>)}
                </ul>
              ) : null}

              {/* Live label */}
              <div className="info-card" style={{ marginTop: 16 }}>
                <strong>Live label</strong>
                <p className="panel-hint">This is the name people will see on the workflow map.</p>
                <p className="info-emphasis">{getNodeLabel(selectedNode.data)}</p>
              </div>

              {/* Version history */}
              <div className="history-panel">
                <div className="sandbox-header">
                  <h3>Version history</h3>
                  <button type="button" onClick={saveSelectedNodeVersion}>Save version</button>
                </div>
                <ul className="history-list">
                  {selectedNodeHistory.slice().reverse().map((entry) => (
                    <li key={`${entry.timestamp}-${entry.summary}`}>
                      <strong>{entry.summary}</strong>
                      <span>{entry.label}</span>
                      <small>{entry.timestamp}</small>
                    </li>
                  ))}
                </ul>
              </div>

              <button type="button" className="secondary-button" style={{ marginTop: 16, width: '100%' }} onClick={() => setMobileEditOpen(false)}>Done</button>
            </div>
          </div>
        </div>
      )}

      <aside className="panel" data-testid="panel-details" aria-label="Node details panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">3. Configure And Test</span>
            <h2>Step details</h2>
          </div>
          {selectedNode ? <span className="panel-badge">Editing</span> : null}
        </div>
        <p className="panel-status">{panelTitle}</p>

        {!selectedNode && (
          <div className="empty-state-card">
            <strong>No step selected yet</strong>
            <p className="panel-hint">
              Click any step on the canvas to edit its fields, review errors, and test the
              full flow.
            </p>
          </div>
        )}

        {selectedNode && selectedNode.data.nodeType === 'start' && (
          <div className="form-grid" data-testid="form-start">
            <label>
              Name
              <input
                value={selectedNode.data.startTitle ?? ''}
                onChange={(event) => {
                  patchSelectedNode({ startTitle: event.target.value })
                }}
              />
            </label>
            {(selectedNode.data.metadata ?? []).map((field, index) => (
              <div key={`metadata-${index}`} className="pair-row">
                <label>
                  Extra field name
                  <input
                    value={field.key}
                    onChange={(event) => {
                      updateKeyValueField('metadata', index, 'key', event.target.value)
                    }}
                  />
                </label>
                <label>
                  Extra field value
                  <input
                    value={field.value}
                    onChange={(event) => {
                      updateKeyValueField('metadata', index, 'value', event.target.value)
                    }}
                  />
                </label>
              </div>
            ))}
            <button
              type="button"
              className="secondary-button"
              onClick={() => addKeyValueField('metadata')}
            >
              Add extra field
            </button>
          </div>
        )}

        {selectedNode && selectedNode.data.nodeType === 'task' && (
          <div className="form-grid" data-testid="form-task">
            <label>
              Name
              <input
                value={selectedNode.data.title ?? ''}
                onChange={(event) => {
                  patchSelectedNode({ title: event.target.value })
                }}
              />
            </label>
            <label>
              Notes
              <input
                value={selectedNode.data.description ?? ''}
                onChange={(event) => {
                  patchSelectedNode({ description: event.target.value })
                }}
              />
            </label>
            <label>
              Owner
              <input
                value={selectedNode.data.assignee ?? ''}
                onChange={(event) => {
                  patchSelectedNode({ assignee: event.target.value })
                }}
              />
            </label>
            <label>
              Due date
              <input
                value={selectedNode.data.dueDate ?? ''}
                onChange={(event) => {
                  patchSelectedNode({ dueDate: event.target.value })
                }}
              />
            </label>
            {(selectedNode.data.customFields ?? []).map((field, index) => (
              <div key={`custom-${index}`} className="pair-row">
                <label>
                  Extra field name
                  <input
                    value={field.key}
                    onChange={(event) => {
                      updateKeyValueField('customFields', index, 'key', event.target.value)
                    }}
                  />
                </label>
                <label>
                  Extra field value
                  <input
                    value={field.value}
                    onChange={(event) => {
                      updateKeyValueField('customFields', index, 'value', event.target.value)
                    }}
                  />
                </label>
              </div>
            ))}
            <button
              type="button"
              className="secondary-button"
              onClick={() => addKeyValueField('customFields')}
            >
              Add extra field
            </button>
          </div>
        )}

        {selectedNode && selectedNode.data.nodeType === 'approval' && (
          <div className="form-grid" data-testid="form-approval">
            <label>
              Name
              <input
                value={selectedNode.data.title ?? ''}
                onChange={(event) => {
                  patchSelectedNode({ title: event.target.value })
                }}
              />
            </label>
            <label>
              Approver
              <input
                value={selectedNode.data.approverRole ?? ''}
                onChange={(event) => {
                  patchSelectedNode({ approverRole: event.target.value })
                }}
              />
            </label>
            <label>
              Auto-approve limit
              <input
                type="number"
                value={selectedNode.data.autoApproveThreshold ?? 0}
                onChange={(event) => {
                  patchSelectedNode({ autoApproveThreshold: Number(event.target.value || 0) })
                }}
              />
            </label>
          </div>
        )}

        {selectedNode && selectedNode.data.nodeType === 'automated' && (
          <div className="form-grid" data-testid="form-automated">
            <label>
              Name
              <input
                value={selectedNode.data.title ?? ''}
                onChange={(event) => {
                  patchSelectedNode({ title: event.target.value })
                }}
              />
            </label>
            <label>
              Action
              <select
                value={selectedNode.data.actionId ?? ''}
                onChange={(event) => {
                  const actionId = event.target.value
                  const action = automations.find((item) => item.id === actionId)
                  const actionParams = Object.fromEntries(
                    (action?.params ?? []).map((param) => [param, '']),
                  )

                  patchSelectedNode({ actionId, actionParams })
                }}
              >
                <option value="">Choose action</option>
                {automations.map((action) => (
                  <option key={action.id} value={action.id}>
                    {action.label}
                  </option>
                ))}
              </select>
            </label>
            {automationsLoading && <p className="panel-hint">Loading actions...</p>}
            {!automationsLoading && automationsError && (
              <p className="validation-error">Could not load actions.</p>
            )}
            {selectedAutomation?.params.map((param) => (
              <label key={param}>
                {param}
                <input
                  value={selectedNode.data.actionParams?.[param] ?? ''}
                  onChange={(event) => {
                    patchSelectedNode({
                      actionParams: {
                        ...(selectedNode.data.actionParams ?? {}),
                        [param]: event.target.value,
                      },
                    })
                  }}
                />
              </label>
            ))}
          </div>
        )}

        {selectedNode && selectedNode.data.nodeType === 'end' && (
          <div className="form-grid" data-testid="form-end">
            <label>
              End message
              <input
                value={selectedNode.data.endMessage ?? ''}
                onChange={(event) => {
                  patchSelectedNode({ endMessage: event.target.value })
                }}
              />
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={selectedNode.data.summaryFlag ?? false}
                onChange={(event) => {
                  patchSelectedNode({ summaryFlag: event.target.checked })
                }}
              />
              Show summary
            </label>
            {selectedNode.data.summaryFlag && (
              <p className="panel-hint">
                The test run will add a final summary line using this end message.
              </p>
            )}
          </div>
        )}

        {selectedNode && validationMessage && (
          <p className="validation-error" data-testid="task-title-error">
            {validationMessage}
          </p>
        )}

        {selectedNode && (
          <div className="info-card">
            <strong>Live label</strong>
            <p className="panel-hint">This is the name people will see on the workflow map.</p>
            <p className="info-emphasis">{getNodeLabel(selectedNode.data)}</p>
          </div>
        )}

        {selectedNode && validationPreview.nodeErrors[selectedNode.id]?.length ? (
          <ul className="error-list compact-list">
            {validationPreview.nodeErrors[selectedNode.id].map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : null}

        {selectedNode && (
          <div className="history-panel">
            <div className="sandbox-header">
              <h3>Version history</h3>
              <button type="button" onClick={saveSelectedNodeVersion}>
                Save version
              </button>
            </div>
            <ul className="history-list">
              {selectedNodeHistory.slice().reverse().map((entry) => (
                <li key={`${entry.timestamp}-${entry.summary}`}>
                  <strong>{entry.summary}</strong>
                  <span>{entry.label}</span>
                  <small>{entry.timestamp}</small>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* On desktop only — sandbox and import/export stay in the right panel */}
        {!isMobile && (
          <div className="sandbox-panel">
            <div className="sandbox-header">
              <div>
                <h3>Test the workflow</h3>
                <p className="panel-hint">Run a quick check to validate the flow and preview the execution log.</p>
              </div>
              <button type="button" onClick={runSimulation} disabled={simulationLoading}>
                {simulationLoading ? 'Running...' : 'Run test'}
              </button>
            </div>
            {simulationErrors.length > 0 && (
              <ul className="error-list" data-testid="simulation-errors">
                {simulationErrors.map((error) => <li key={error}>{error}</li>)}
              </ul>
            )}
            {simulationLogs.length > 0 && (
              <ol className="log-list" data-testid="simulation-logs">
                {simulationLogs.map((log) => (
                  <li key={log.stepId}><strong>{log.status}</strong>: {log.message}</li>
                ))}
              </ol>
            )}
            <div className="import-export-panel">
              <h3>Import or export workflow JSON</h3>
              <p className="panel-hint">
                Export your current workflow for backup or reuse, or paste valid workflow JSON to import it.
              </p>
              <div className="toolbar-actions">
                <button type="button" className="secondary-button" onClick={exportWorkflowJson} disabled={nodes.length === 0}>Export JSON</button>
                <button type="button" className="secondary-button" onClick={importWorkflowJson} disabled={!importExportText.trim()}>Import JSON</button>
              </div>
              <textarea
                value={importExportText}
                onChange={(event) => setImportExportText(event.target.value)}
                className="json-box"
                placeholder="Your workflow JSON will appear here. You can also paste JSON here and import it."
              />
              {importError && <p className="validation-error">{importError}</p>}
            </div>
          </div>
        )}
      </aside>

      {/* Mobile bottom tab bar — 2 tabs only */}
      {isMobile && (
        <nav className="mobile-tab-bar" aria-label="Mobile navigation">
          <button
            type="button"
            className={`mobile-tab-btn${activeTab === 'steps' ? ' mobile-tab-active' : ''}`}
            onClick={() => setActiveTab('steps')}
          >
            <svg className="mobile-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <path d="M9 9h6M9 12h6M9 15h4" />
            </svg>
            <span className="mobile-tab-label">Steps</span>
          </button>
          <button
            type="button"
            className={`mobile-tab-btn${activeTab === 'canvas' ? ' mobile-tab-active' : ''}`}
            onClick={() => setActiveTab('canvas')}
          >
            <svg className="mobile-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="5" cy="12" r="2" />
              <circle cx="19" cy="5" r="2" />
              <circle cx="19" cy="19" r="2" />
              <path d="M7 12h5m2-5-5 4m5 2-5 4" />
            </svg>
            <span className="mobile-tab-label">Canvas</span>
          </button>
        </nav>
      )}
    </div>
  )
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark')
    } else {
      document.body.classList.remove('dark')
    }
  }, [isDarkMode])

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="hero-copy">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="hero-kicker">Visual workflow builder</span>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              style={{ padding: '6px 12px', fontSize: '0.8rem', marginTop: '-4px' }}
            >
              {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>
          <h1>Tredence Analytics<br /><span style={{ fontSize: '0.75em', opacity: 0.85 }}>HR Workflow Designer</span></h1>
          <p>
            Create, explain, and test people-process workflows with a guided visual editor.
            This interface is designed to be easy for first-time users, not just for the case study.
          </p>
          <div className="hero-steps" aria-label="How to use the app">
            <span>1. Add steps</span>
            <span>2. Connect the flow</span>
            <span>3. Fill details</span>
            <span>4. Run a test</span>
          </div>
        </div>
        <div className="hero-card">
          <div className="hero-card-label">What you can do here</div>
          <ul className="hero-checklist">
            <li>Build onboarding, approvals, and automated HR flows</li>
            <li>Catch missing steps and broken connections early</li>
            <li>Reuse templates, export JSON, and review saved versions</li>
          </ul>
        </div>
      </header>
      <ReactFlowProvider>
        <CanvasWorkspace isDarkMode={isDarkMode} />
      </ReactFlowProvider>
    </div>
  )
}

export default App
