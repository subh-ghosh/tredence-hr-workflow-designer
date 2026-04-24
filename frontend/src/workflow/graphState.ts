import type { Edge, Node, XYPosition } from 'reactflow'

export type WorkflowNodeType = 'start' | 'task' | 'approval' | 'automated' | 'end'

export type KeyValueField = {
    key: string
    value: string
}

export type WorkflowData = {
    nodeType: WorkflowNodeType
    startTitle?: string
    metadata?: KeyValueField[]
    title?: string
    description?: string
    assignee?: string
    dueDate?: string
    customFields?: KeyValueField[]
    approverRole?: string
    autoApproveThreshold?: number
    actionId?: string
    actionParams?: Record<string, string>
    endMessage?: string
    summaryFlag?: boolean
}

export function createNodeId(counter: number): string {
    return `node_${counter}`
}

export function getDefaultNodeData(type: WorkflowNodeType): WorkflowData {
    if (type === 'start') {
        return {
            nodeType: type,
            startTitle: 'Start workflow',
            metadata: [],
        }
    }

    if (type === 'task') {
        return {
            nodeType: type,
            title: 'Task step',
            description: '',
            assignee: '',
            dueDate: '',
            customFields: [],
        }
    }

    if (type === 'approval') {
        return {
            nodeType: type,
            title: 'Approval step',
            approverRole: 'Manager',
            autoApproveThreshold: 0,
        }
    }

    if (type === 'automated') {
        return {
            nodeType: type,
            title: 'Automated step',
            actionId: '',
            actionParams: {},
        }
    }

    return {
        nodeType: type,
        endMessage: 'Workflow complete',
        summaryFlag: false,
    }
}

export function addWorkflowNode(
    id: string,
    position: XYPosition,
    data: WorkflowData,
): Node<WorkflowData> {
    return {
        id,
        type: 'default',
        position,
        data,
    }
}

export function getNodeLabel(data: WorkflowData): string {
    switch (data.nodeType) {
        case 'start':
            return data.startTitle ?? 'Start'
        case 'task':
            return data.title ?? 'Task'
        case 'approval':
            return data.title ?? 'Approval'
        case 'automated':
            return data.title ?? 'Automated'
        case 'end':
            return data.endMessage ?? 'End'
        default:
            return 'Node'
    }
}

export function updateWorkflowNode(
    nodes: Node<WorkflowData>[],
    nodeId: string,
    updater: (data: WorkflowData) => WorkflowData,
): Node<WorkflowData>[] {
    return nodes.map((node) => {
        if (node.id !== nodeId) return node

        return {
            ...node,
            data: updater(node.data),
        }
    })
}

export function validateTaskTitle(data: WorkflowData): string | null {
    if (data.nodeType !== 'task') return null
    if (!data.title?.trim()) return 'Task title is required'
    return null
}

export function deleteSelectedElements(
    nodes: Node[],
    edges: Edge[],
    selectedNodeId: string | null,
    selectedEdgeId: string | null,
): { nodes: Node[]; edges: Edge[] } {
    const remainingNodes = selectedNodeId
        ? nodes.filter((node) => node.id !== selectedNodeId)
        : nodes

    const remainingEdgesAfterNodeDelete = selectedNodeId
        ? edges.filter(
            (edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId,
        )
        : edges

    const remainingEdges = selectedEdgeId
        ? remainingEdgesAfterNodeDelete.filter((edge) => edge.id !== selectedEdgeId)
        : remainingEdgesAfterNodeDelete

    return {
        nodes: remainingNodes,
        edges: remainingEdges,
    }
}
