# Requirements - Simple Version

## Project Snapshot
- Project: HR Workflow Designer (Case Study)
- Timebox: 4-6 hours
- Goal: show clear frontend architecture and working features

## What we need to build
- A React app with a workflow canvas
- Node editing forms
- Mock API calls
- A simulation panel with basic validation

## In scope
- Frontend only (React + TypeScript + React Flow)
- Five node types: Start, Task, Approval, Automated, End
- Drag/drop nodes, connect nodes, select, delete
- Node form panel with required fields
- Mock APIs:
  - GET /automations
  - POST /simulate
- Validation: missing links, cycle check, start rule
- Documentation

## Out of scope
- Login/auth
- Database save/load
- Multi-user support
- Real backend deployment

## Functional requirements

### FR-1 Canvas actions
Users can:
- drag a node from sidebar to canvas
- connect nodes with edges
- select a node
- delete node or edge

Done when:
- all actions above work without crash

### FR-2 Node types
Must support:
- Start
- Task
- Approval
- Automated
- End

Done when:
- each type can be added and appears in graph JSON

### FR-3 Node forms
When a node is selected, show the right form.

Required fields:
- Start: startTitle, metadata (optional key-value)
- Task: title (required), description, assignee, dueDate, customFields (optional key-value)
- Approval: title, approverRole, autoApproveThreshold
- Automated: title, actionId, actionParams (dynamic)
- End: endMessage, summaryFlag

Done when:
- form values update node data
- Task title validation works
- Automated params update when action changes

### FR-4 Mock APIs
- GET /automations returns action list
- POST /simulate accepts graph JSON and returns step logs

Done when:
- automated form reads actions from API
- simulation call returns and logs are shown

### FR-5 Sandbox and validation
Sandbox can:
- serialize graph
- validate graph
- run simulation
- show ordered execution log

Done when:
- invalid graph shows errors
- valid graph shows simulation steps

## Simple data model
- WorkflowGraph: nodes, edges
- WorkflowNode: id, type, position, data
- WorkflowEdge: id, source, target
- AutomationAction: id, label, params
- SimulationResult: list of step logs

## Use case scenarios

### UC-1 Build workflow
1. User drags nodes to canvas.
2. User connects nodes in order.
3. System stores graph.

### UC-2 Edit node
1. User clicks node.
2. System opens node form.
3. User updates fields.
4. System saves valid data.

### UC-3 Run simulation
1. User clicks Simulate.
2. System validates graph.
3. If valid, system calls POST /simulate.
4. System shows step log.

### UC-4 Configure automated step
1. User selects Automated node.
2. System loads actions from GET /automations.
3. User picks action and fills params.
4. System saves action data.

## Definition of done
- All required features (FR-1 to FR-5) work
- App runs locally
- No TypeScript errors
- Unit tests pass for each completed increment
- Integration tests pass for major module handoffs
- System tests pass for complete user journey
- README explains what is done and what is pending

## Submission checklist
- GitHub repo link
- Complete source code
- README
- Work log
- Diagram PNGs in assets/diagrams

## Testing approach (incremental)
- Build feature in small increment.
- Add or update unit tests for that increment.
- Do not move to next increment until unit tests pass.
- After all increments, run integration tests.
- Final step is system testing with real user-like flows.

Minimum test levels:
- Unit tests:
  - state updates for node/edge operations
  - form behavior and field validation
  - validation helpers (cycle, missing links, start rule)
  - API service methods and error handling
- Integration tests:
  - canvas + form sync
  - form + API action loading
  - sandbox + simulation result rendering
- System tests:
  - end-to-end success flow: build, configure, validate, simulate
  - end-to-end failure flow: invalid graph shows actionable errors
