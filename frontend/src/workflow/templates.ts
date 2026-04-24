import type { WorkflowTemplate } from './graphUtils'

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'template-task-docs',
    label: 'Collect Documents',
    nodeType: 'task',
    data: {
      nodeType: 'task',
      title: 'Collect Documents',
      description: 'Collect ID proof and signed forms',
      assignee: 'HR Executive',
      dueDate: '',
      customFields: [],
    },
  },
  {
    id: 'template-approval-manager',
    label: 'Manager Approval',
    nodeType: 'approval',
    data: {
      nodeType: 'approval',
      title: 'Manager Approval',
      approverRole: 'Manager',
      autoApproveThreshold: 0,
    },
  },
  {
    id: 'template-automated-email',
    label: 'Welcome Email',
    nodeType: 'automated',
    data: {
      nodeType: 'automated',
      title: 'Send Welcome Email',
      actionId: 'send_email',
      actionParams: {
        to: '',
        subject: '',
      },
    },
  },
]
