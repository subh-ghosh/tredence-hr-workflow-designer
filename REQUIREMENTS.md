# Requirements Specification - HR Workflow Designer Prototype

## 1. Document Control
- Project: HR Workflow Designer (Case Study)
- Version: 1.0
- Date: 2026-04-24
- Owner: Candidate
- Timebox: 4-6 hours implementation

## 2. Problem Statement
HR admins need a visual way to define internal workflows (for example onboarding and approvals), configure each step, and quickly test behavior before actual implementation.

## 3. Objectives
- Build a functional workflow designer using React + React Flow.
- Support configurable workflow node types with editable forms.
- Integrate mock APIs for automations and simulation.
- Provide a sandbox to validate and test workflow execution.
- Demonstrate scalable frontend architecture and type-safe design.

## 4. In Scope
- Frontend web app (Vite + React + TypeScript).
- Drag/drop workflow canvas with custom node types.
- Node form panel with required fields per node type.
- Mock API layer for automation list and simulation.
- Workflow serialization + simulation log view.
- Basic workflow validation (missing links, cycles, start-first rule).
- Documentation (README + work log).

## 5. Out of Scope
- Authentication/authorization.
- Database persistence.
- Multi-user collaboration.
- Production backend services.
- Pixel-perfect design replication of reference UI.

## 6. Stakeholders
- Primary: HR Admin (end user).
- Secondary: Engineering Reviewer (evaluator).

## 7. User Roles
- HR Admin: creates, configures, validates, and simulates workflows.

## 8. Functional Requirements

### FR-1 Canvas and Graph Editing
The system shall provide a React Flow canvas where users can:
- Drag node types from a sidebar and drop on canvas.
- Connect nodes through directed edges.
- Select a node to edit its configuration.
- Delete nodes and edges.
- Pan and zoom canvas.

Acceptance Criteria
- Given a node in sidebar, when dropped on canvas, then a new node instance appears at drop coordinates.
- Given two nodes, when connected, then an edge is created and rendered.
- Given a selected node/edge, when delete is triggered, then selected item is removed.

### FR-2 Supported Node Types
The system shall support these node types:
- Start Node
- Task Node
- Approval Node
- Automated Step Node
- End Node

Acceptance Criteria
- User can add each node type from sidebar.
- Node type is represented in graph JSON and form panel.

### FR-3 Node Configuration Forms
The system shall show a form panel for the selected node and persist edits to graph state.

Required Fields by Type
- Start Node:
  - startTitle (string)
  - metadata (optional key-value list)
- Task Node:
  - title (required)
  - description (optional)
  - assignee (optional string)
  - dueDate (optional date/string)
  - customFields (optional key-value list)
- Approval Node:
  - title (string)
  - approverRole (string)
  - autoApproveThreshold (number)
- Automated Step Node:
  - title (string)
  - actionId (selected from automations API)
  - actionParams (dynamic fields based on action definition)
- End Node:
  - endMessage (string)
  - summaryFlag (boolean)

Acceptance Criteria
- Selecting a node displays correct form fields for its type.
- Editing fields updates node data immediately or on save (single consistent behavior).
- Task title enforces required validation.
- Automated Step form dynamically updates param inputs when action changes.

### FR-4 Mock API Integration
The system shall expose/use mock APIs:
- GET /automations
- POST /simulate

GET /automations Response Example
[
  { "id": "send_email", "label": "Send Email", "params": ["to", "subject"] },
  { "id": "generate_doc", "label": "Generate Document", "params": ["template", "recipient"] }
]

POST /simulate Contract
- Request: serialized workflow graph JSON.
- Response: step-by-step execution result (list of status messages/events).

Acceptance Criteria
- Automated Step node loads available actions from GET /automations.
- Clicking simulate sends current graph to POST /simulate.
- UI displays returned execution steps.

### FR-5 Sandbox and Validation
The system shall provide a sandbox panel/modal to:
- Serialize graph as JSON.
- Run structural validation:
  - Start node must be first/logical entry.
  - Required connections should exist.
  - Cycles are detected and reported.
- Show simulation results.

Acceptance Criteria
- Validation errors are displayed before or alongside simulation.
- Simulation log is shown in readable ordered list/timeline.

## 9. Non-Functional Requirements
- NFR-1 Type Safety: TypeScript interfaces for all node data and API contracts.
- NFR-2 Modularity: clear separation between canvas, forms, and API layers.
- NFR-3 Extensibility: adding a new node type should require minimal changes.
- NFR-4 Usability: workflow creation and editing should be intuitive without documentation.
- NFR-5 Performance: interactions (drag/connect/edit) should feel responsive for small-medium graphs.
- NFR-6 Delivery: scope should fit within 4-6 hour timebox.

## 10. Data Model (Initial)

WorkflowGraph
- nodes: WorkflowNode[]
- edges: WorkflowEdge[]

WorkflowNode (base)
- id: string
- type: "start" | "task" | "approval" | "automated" | "end"
- position: { x: number, y: number }
- data: node-specific payload

WorkflowEdge
- id: string
- source: string
- target: string

AutomationAction
- id: string
- label: string
- params: string[]

SimulationResult
- steps: Array<{ stepId: string, status: "ok" | "warning" | "error", message: string }>

## 11. UX Requirements
- 3-pane layout recommended:
  - Left: node palette
  - Center: workflow canvas
  - Right: node form panel and/or sandbox controls
- Selected node state must be visually clear.
- Form labels must match domain language (HR/admin friendly).

## 12. Architecture Requirements
Minimum folder-level decomposition:
- canvas layer (React Flow composition and graph events)
- node layer (custom node components + node schemas)
- form layer (node form panel)
- api layer (mock services and contracts)
- validation/simulation layer (graph checks + simulation orchestration)
- hooks/state layer (graph and selection state)

## 13. Assumptions
- Single-user local usage only.
- Mock APIs can run in-app or via local mock server.
- No requirement for persistence across reload.
- UI polish is secondary to architecture and working behavior.

## 14. Risks and Mitigations
- Risk: Dynamic form complexity for automated actions.
  - Mitigation: schema-driven form renderer for action params.
- Risk: Graph validation edge cases within timebox.
  - Mitigation: implement core checks first (entry, dangling nodes, cycle detection).
- Risk: Overbuilding.
  - Mitigation: lock MVP scope and treat extras as backlog.

## 15. Prioritized Backlog
P0 (Must)
- Canvas add/connect/delete/select.
- All required node types.
- Node forms with required fields.
- Mock GET/POST APIs.
- Sandbox serialize + validate + simulate log.
- README with architecture and tradeoffs.

P1 (Should)
- Better validation messaging.
- Improved panel UX and inline errors.

P2 (Could)
- Export/Import JSON.
- Undo/Redo.
- Minimap/controls.
- Auto layout.

## 16. Definition of Done
- All P0 items implemented and demoable.
- App runs locally with documented steps.
- Types compile without errors.
- Basic manual test pass completed:
  - Create each node type.
  - Configure fields.
  - Connect flow.
  - Run simulation and view logs.
  - Trigger at least one validation error and observe feedback.
- README includes: architecture, run instructions, completed scope, pending improvements.

## 17. Submission Checklist
- Public GitHub repo or zip.
- Source code for app.
- README complete and accurate.
- Work log showing implementation trail.
- Optional: screenshot/GIF for quick reviewer walkthrough.
