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
  getNodeLabel,
  updateWorkflowNode,
  validateTaskTitle,
  type ApprovalNodeData,
  type AutomatedNodeData,
  type EndNodeData,
  type StartNodeData,
  type TaskNodeData,
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

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  )

  const validationMessage = useMemo(() => {
    if (!selectedNode) return null
    return validateTaskTitle(selectedNode.data)
  }, [selectedNode])

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
    if (selectedNode) return `Selected node: ${selectedNode.id}`
    if (selectedEdgeId) return `Selected edge: ${selectedEdgeId}`
    return 'No selection'
  }, [selectedEdgeId, selectedNode])

  const updateSelectedNode = useCallback(
    (updater: (data: WorkflowData) => WorkflowData) => {
      if (!selectedNodeId) return
      setNodes((current) => updateWorkflowNode(current, selectedNodeId, updater))
    },
    [selectedNodeId, setNodes],
  )

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
        <h2>Node Form Panel</h2>
        <p>{panelTitle}</p>

        {!selectedNode && (
          <p className="panel-hint">Select a node to edit its fields.</p>
        )}

        {selectedNode && selectedNode.data.nodeType === 'start' && (
          <div className="form-grid" data-testid="form-start">
            <label>
              Start title
              <input
                value={(selectedNode.data as StartNodeData).startTitle}
                onChange={(event) => {
                  const value = event.target.value
                  updateSelectedNode((data) => {
                    if (data.nodeType !== 'start') return data
                    return { ...data, startTitle: value }
                  })
                }}
              />
            </label>
            <label>
              Metadata key
              <input
                value={(selectedNode.data as StartNodeData).metadata[0]?.key ?? ''}
                onChange={(event) => {
                  const nextKey = event.target.value
                  updateSelectedNode((data) => {
                    if (data.nodeType !== 'start') return data
                    const first = data.metadata[0] ?? { key: '', value: '' }
                    return { ...data, metadata: [{ ...first, key: nextKey }] }
                  })
                }}
              />
            </label>
            <label>
              Metadata value
              <input
                value={(selectedNode.data as StartNodeData).metadata[0]?.value ?? ''}
                onChange={(event) => {
                  const nextValue = event.target.value
                  updateSelectedNode((data) => {
                    if (data.nodeType !== 'start') return data
                    const first = data.metadata[0] ?? { key: '', value: '' }
                    return { ...data, metadata: [{ ...first, value: nextValue }] }
                  })
                }}
              />
            </label>
          </div>
        )}

        {selectedNode && selectedNode.data.nodeType === 'task' && (
          <div className="form-grid" data-testid="form-task">
            <label>
              Title (required)
              <input
                value={(selectedNode.data as TaskNodeData).title}
                onChange={(event) => {
                  const value = event.target.value
                  updateSelectedNode((data) => {
                    if (data.nodeType !== 'task') return data
                    return { ...data, title: value }
                  })
                }}
              />
            </label>
            <label>
              Description
              <input
                value={(selectedNode.data as TaskNodeData).description}
                onChange={(event) => {
                  const value = event.target.value
                  updateSelectedNode((data) => {
                    if (data.nodeType !== 'task') return data
                    return { ...data, description: value }
                  })
                }}
              />
            </label>
            <label>
              Assignee
              <input
                value={(selectedNode.data as TaskNodeData).assignee}
                onChange={(event) => {
                  const value = event.target.value
                  updateSelectedNode((data) => {
                    if (data.nodeType !== 'task') return data
                    return { ...data, assignee: value }
                  })
                }}
              />
            </label>
            <label>
              Due date
              <input
                value={(selectedNode.data as TaskNodeData).dueDate}
                onChange={(event) => {
                  const value = event.target.value
                  updateSelectedNode((data) => {
                    if (data.nodeType !== 'task') return data
                    return { ...data, dueDate: value }
                  })
                }}
              />
            </label>
          </div>
        )}

        {selectedNode && selectedNode.data.nodeType === 'approval' && (
          <div className="form-grid" data-testid="form-approval">
            <label>
              Title
              <input
                value={(selectedNode.data as ApprovalNodeData).title}
                onChange={(event) => {
                  const value = event.target.value
                  updateSelectedNode((data) => {
                    if (data.nodeType !== 'approval') return data
                    return { ...data, title: value }
                  })
                }}
              />
            </label>
            <label>
              Approver role
              <input
                value={(selectedNode.data as ApprovalNodeData).approverRole}
                onChange={(event) => {
                  const value = event.target.value
                  updateSelectedNode((data) => {
                    if (data.nodeType !== 'approval') return data
                    return { ...data, approverRole: value }
                  })
                }}
              />
            </label>
            <label>
              Auto-approve threshold
              <input
                type="number"
                value={(selectedNode.data as ApprovalNodeData).autoApproveThreshold}
                onChange={(event) => {
                  const value = Number(event.target.value || 0)
                  updateSelectedNode((data) => {
                    if (data.nodeType !== 'approval') return data
                    return { ...data, autoApproveThreshold: value }
                  })
                }}
              />
            </label>
          </div>
        )}

        {selectedNode && selectedNode.data.nodeType === 'automated' && (
          <div className="form-grid" data-testid="form-automated">
            <label>
              Title
              <input
                value={(selectedNode.data as AutomatedNodeData).title}
                onChange={(event) => {
                  const value = event.target.value
                  updateSelectedNode((data) => {
                    if (data.nodeType !== 'automated') return data
                    return { ...data, title: value }
                  })
                }}
              />
            </label>
            <label>
              Action Id
              <input
                value={(selectedNode.data as AutomatedNodeData).actionId}
                onChange={(event) => {
                  const value = event.target.value
                  updateSelectedNode((data) => {
                    if (data.nodeType !== 'automated') return data
                    return { ...data, actionId: value }
                  })
                }}
              />
            </label>
            <label>
              Param value
              <input
                value={(selectedNode.data as AutomatedNodeData).actionParams.value ?? ''}
                onChange={(event) => {
                  const value = event.target.value
                  updateSelectedNode((data) => {
                    if (data.nodeType !== 'automated') return data
                    return { ...data, actionParams: { ...data.actionParams, value } }
                  })
                }}
              />
            </label>
          </div>
        )}

        {selectedNode && selectedNode.data.nodeType === 'end' && (
          <div className="form-grid" data-testid="form-end">
            <label>
              End message
              <input
                value={(selectedNode.data as EndNodeData).endMessage}
                onChange={(event) => {
                  const value = event.target.value
                  updateSelectedNode((data) => {
                    if (data.nodeType !== 'end') return data
                    return { ...data, endMessage: value }
                  })
                }}
              />
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={(selectedNode.data as EndNodeData).summaryFlag}
                onChange={(event) => {
                  const checked = event.target.checked
                  updateSelectedNode((data) => {
                    if (data.nodeType !== 'end') return data
                    return { ...data, summaryFlag: checked }
                  })
                }}
              />
              Summary flag
            </label>
          </div>
        )}

        {selectedNode && validationMessage && (
          <p className="validation-error" data-testid="task-title-error">
            {validationMessage}
          </p>
        )}

        {selectedNode && (
          <p className="panel-hint">
            Label preview: {getNodeLabel(selectedNode.data)}
          </p>
        )}
      </aside>
    </div>
  )
}

function App() {
  return (
    <div className="app-shell">
      <header className="top-bar">
        <h1>HR Workflow Designer</h1>
        <p>Increment 3: node form panel ready</p>
      </header>
      <ReactFlowProvider>
        <CanvasWorkspace />
      </ReactFlowProvider>
    </div>
  )
}

export default App
