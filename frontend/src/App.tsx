import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  type WorkflowData,
  type WorkflowNodeType,
} from './workflow/graphState'
import {
  getAutomations,
  simulateWorkflow,
  type AutomationAction,
  type StepLog,
} from './api/mockApi'
import { validateWorkflow } from './workflow/validation'

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
  const [automations, setAutomations] = useState<AutomationAction[]>([])
  const [automationsLoading, setAutomationsLoading] = useState(true)
  const [automationsError, setAutomationsError] = useState('')
  const [simulationErrors, setSimulationErrors] = useState<string[]>([])
  const [simulationLogs, setSimulationLogs] = useState<StepLog[]>([])
  const [simulationLoading, setSimulationLoading] = useState(false)

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  )

  const validationMessage = useMemo(() => {
    if (!selectedNode) return null
    return validateTaskTitle(selectedNode.data)
  }, [selectedNode])

  const selectedAutomation = useMemo(() => {
    if (!selectedNode || selectedNode.data.nodeType !== 'automated') return null
    return automations.find((item) => item.id === selectedNode.data.actionId) ?? null
  }, [automations, selectedNode])

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

  return (
    <div className="panels">
      <aside className="panel" data-testid="panel-sidebar" aria-label="Node palette">
        <h2>Steps</h2>
        <p className="panel-hint">Drag a step into the canvas.</p>
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
          <h2>Workflow</h2>
          <button type="button" onClick={deleteSelection} disabled={!selectedNodeId && !selectedEdgeId}>
            Delete
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
            onNodeClick={(_, node) => {
              setSelectedNodeId(node.id)
              setSelectedEdgeId(null)
            }}
            onEdgeClick={(_, edge) => {
              setSelectedEdgeId(edge.id)
              setSelectedNodeId(null)
            }}
            onPaneClick={() => {
              setSelectedNodeId(null)
              setSelectedEdgeId(null)
            }}
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
        <h2>Details</h2>
        <p>{panelTitle}</p>

        {!selectedNode && (
          <p className="panel-hint">Click a step to edit it.</p>
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
          </div>
        )}

        {selectedNode && validationMessage && (
          <p className="validation-error" data-testid="task-title-error">
            {validationMessage}
          </p>
        )}

        {selectedNode && (
          <p className="panel-hint">
            Step label: {getNodeLabel(selectedNode.data)}
          </p>
        )}

        <div className="sandbox-panel">
          <div className="sandbox-header">
            <h3>Test</h3>
            <button type="button" onClick={runSimulation} disabled={simulationLoading}>
              {simulationLoading ? 'Running...' : 'Run'}
            </button>
          </div>

          <p className="panel-hint">Check the flow and run a test.</p>

          {simulationErrors.length > 0 && (
            <ul className="error-list" data-testid="simulation-errors">
              {simulationErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}

          {simulationLogs.length > 0 && (
            <ol className="log-list" data-testid="simulation-logs">
              {simulationLogs.map((log) => (
                <li key={log.stepId}>
                  <strong>{log.status}</strong>: {log.message}
                </li>
              ))}
            </ol>
          )}
        </div>
      </aside>
    </div>
  )
}

function App() {
  return (
    <div className="app-shell">
      <header className="top-bar">
        <h1>HR Workflow Designer</h1>
        <p>Build and test a simple HR workflow.</p>
      </header>
      <ReactFlowProvider>
        <CanvasWorkspace />
      </ReactFlowProvider>
    </div>
  )
}

export default App
