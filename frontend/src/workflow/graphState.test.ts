import { describe, expect, it } from 'vitest'
import { addEdge, type Edge, type Node } from 'reactflow'
import {
    addWorkflowNode,
    createNodeId,
    deleteSelectedElements,
    getDefaultNodeData,
    getNodeLabel,
    updateWorkflowNode,
    validateTaskTitle,
} from './graphState'

describe('graph state helpers', () => {
    it('adds a node with expected shape', () => {
        const node = addWorkflowNode('node_1', { x: 120, y: 90 }, getDefaultNodeData('task'))

        expect(node.id).toBe('node_1')
        expect(node.position).toEqual({ x: 120, y: 90 })
        expect(node.data.nodeType).toBe('task')
    })

    it('creates edge when connection is made', () => {
        const edges: Edge[] = []
        const nextEdges = addEdge({
            source: 'node_1',
            target: 'node_2',
            sourceHandle: null,
            targetHandle: null,
        }, edges)

        expect(nextEdges).toHaveLength(1)
        expect(nextEdges[0].source).toBe('node_1')
        expect(nextEdges[0].target).toBe('node_2')
    })

    it('deletes selected node and related edges', () => {
        const nodes: Node[] = [
            { id: 'node_1', type: 'default', position: { x: 0, y: 0 }, data: { label: 'start' } },
            { id: 'node_2', type: 'default', position: { x: 200, y: 0 }, data: { label: 'end' } },
        ]

        const edges: Edge[] = [
            { id: 'e1', source: 'node_1', target: 'node_2' },
        ]

        const result = deleteSelectedElements(nodes, edges, 'node_1', null)

        expect(result.nodes).toHaveLength(1)
        expect(result.nodes[0].id).toBe('node_2')
        expect(result.edges).toHaveLength(0)
    })

    it('deletes selected edge only', () => {
        const nodes: Node[] = [
            { id: 'node_1', type: 'default', position: { x: 0, y: 0 }, data: { label: 'start' } },
            { id: 'node_2', type: 'default', position: { x: 200, y: 0 }, data: { label: 'end' } },
        ]

        const edges: Edge[] = [
            { id: 'e1', source: 'node_1', target: 'node_2' },
            { id: 'e2', source: 'node_2', target: 'node_1' },
        ]

        const result = deleteSelectedElements(nodes, edges, null, 'e1')

        expect(result.nodes).toHaveLength(2)
        expect(result.edges).toHaveLength(1)
        expect(result.edges[0].id).toBe('e2')
    })

    it('creates stable node ids', () => {
        expect(createNodeId(1)).toBe('node_1')
        expect(createNodeId(25)).toBe('node_25')
    })

    it('provides defaults for each node type', () => {
        expect(getDefaultNodeData('start').nodeType).toBe('start')
        expect(getDefaultNodeData('task').nodeType).toBe('task')
        expect(getDefaultNodeData('approval').nodeType).toBe('approval')
        expect(getDefaultNodeData('automated').nodeType).toBe('automated')
        expect(getDefaultNodeData('end').nodeType).toBe('end')
    })

    it('updates selected node data', () => {
        const nodes: Node[] = [
            {
                id: 'node_1',
                type: 'default',
                position: { x: 0, y: 0 },
                data: getDefaultNodeData('task'),
            },
        ]

        const updated = updateWorkflowNode(nodes, 'node_1', (data) => {
            if (data.nodeType !== 'task') return data
            return { ...data, title: 'Collect documents' }
        })

        const nodeData = updated[0].data
        expect(nodeData.nodeType).toBe('task')
        if (nodeData.nodeType === 'task') {
            expect(nodeData.title).toBe('Collect documents')
        }
    })

    it('validates task title as required', () => {
        const task = getDefaultNodeData('task')
        if (task.nodeType !== 'task') {
            throw new Error('Expected task node type')
        }

        const emptyTask = { ...task, title: '   ' }
        const validTask = { ...task, title: 'Collect docs' }

        expect(validateTaskTitle(emptyTask)).toBe('Task title is required')
        expect(validateTaskTitle(validTask)).toBeNull()
    })

    it('builds display label based on node data type', () => {
        const task = getDefaultNodeData('task')
        const start = getDefaultNodeData('start')

        expect(getNodeLabel(task)).toBe('Task')
        expect(getNodeLabel(start)).toBe('Start')
    })
})
