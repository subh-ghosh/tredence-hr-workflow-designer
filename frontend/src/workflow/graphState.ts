import type { Edge, Node, XYPosition } from 'reactflow'

export type WorkflowNodeType = 'start' | 'task' | 'approval' | 'automated' | 'end'

export type WorkflowData = {
    label: string
}

export function createNodeId(counter: number): string {
    return `node_${counter}`
}

export function getDefaultNodeData(type: WorkflowNodeType): WorkflowData {
    return {
        label: `${type} node`,
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
