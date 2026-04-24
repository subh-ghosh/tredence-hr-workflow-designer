import { useCallback, useMemo, useRef, useState } from 'react'
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type ReactFlowInstance,
} from 'reactflow'
import 'reactflow/dist/style.css'
import './App.css'
import {
  addWorkflowNode,
  createNodeId,
  deleteSelectedElements,
  getDefaultNodeData,
  type WorkflowData,
  type WorkflowNodeType,
} from './workflow/graphState'

const NODE_TYPES: WorkflowNodeType[] = [
  'start',
  'task',
  'approval',
  'automated',
  'end',
]

function CanvasWorkspace() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const nodeCounter = useRef(0)
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)

  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowData>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds))
    },
    [setEdges],
  )

  const onDragStart = useCallback((event: React.DragEvent<HTMLButtonElement>, nodeType: WorkflowNodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }, [])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow') as WorkflowNodeType
      if (!type || !reactFlowInstance || !reactFlowWrapper.current) return

      const bounds = reactFlowWrapper.current.getBoundingClientRect()
      const position = reactFlowInstance.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      })

      const nextId = createNodeId(++nodeCounter.current)
      const nextNode = addWorkflowNode(nextId, position, getDefaultNodeData(type))
      setNodes((nds) => nds.concat(nextNode))
    },
    [reactFlowInstance, setNodes],
  )

  const deleteSelection = useCallback(() => {
    const updated = deleteSelectedElements(nodes, edges, selectedNodeId, selectedEdgeId)
    setNodes(updated.nodes)
    setEdges(updated.edges)
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
  }, [edges, nodes, selectedEdgeId, selectedNodeId, setEdges, setNodes])

  const panelTitle = useMemo(() => {
    if (selectedNodeId) return `Selected node: ${selectedNodeId}`
    if (selectedEdgeId) return `Selected edge: ${selectedEdgeId}`
    return 'No selection'
  }, [selectedEdgeId, selectedNodeId])

  return (
    <div className="panels">
      <aside className="panel" data-testid="panel-sidebar" aria-label="Node palette">
        <h2>Node Palette</h2>
        <p className="panel-hint">Drag a node into the canvas.</p>
        <ul className="node-list">
          {NODE_TYPES.map((nodeType) => (
            <li key={nodeType}>
              <button type="button" className="node-chip" draggable onDragStart={(event) => onDragStart(event, nodeType)}>
                {nodeType}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <main className="panel panel-canvas" data-testid="panel-canvas" aria-label="Workflow canvas area">
        <div className="canvas-toolbar">
          <h2>Canvas Area</h2>
          <button type="button" onClick={deleteSelection} disabled={!selectedNodeId && !selectedEdgeId}>
            Delete Selection
          </button>
        </div>

        <div ref={reactFlowWrapper} className="canvas-surface" onDrop={onDrop} onDragOver={onDragOver}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onSelectionChange={({ nodes: selectedNodes, edges: selectedEdges }) => {
              setSelectedNodeId(selectedNodes[0]?.id ?? null)
              setSelectedEdgeId(selectedEdges[0]?.id ?? null)
            }}
            fitView
          >
            <MiniMap />
            <Controls />
            <Background />
          </ReactFlow>
        </div>
      </main>

      <aside className="panel" data-testid="panel-details" aria-label="Node details panel">
        <h2>Selection</h2>
        <p>{panelTitle}</p>
        <p className="panel-hint">Increment 3 will add node forms here.</p>
      </aside>
    </div>
  )
}

function App() {
  return (
    <div className="app-shell">
      <header className="top-bar">
        <h1>HR Workflow Designer</h1>
        <p>Increment 2: canvas actions ready</p>
      </header>
      <ReactFlowProvider>
        <CanvasWorkspace />
      </ReactFlowProvider>
    </div>
  )
}

export default App
