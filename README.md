# HR Workflow Designer Case Study

This project is a small workflow builder for HR teams.

Goal: allow an HR admin to create, edit, validate, and test simple internal workflows such as onboarding, leave approval, or document verification.

## Stack
- React + TypeScript + Vite
- React Flow
- Local mock APIs
- Vitest + React Testing Library

## Architecture
- `frontend/src/App.tsx`
  Main UI shell. Holds the three-pane layout, React Flow canvas, details form, and test panel.
- `frontend/src/workflow/graphState.ts`
  Workflow node defaults, labels, update helpers, and delete helpers.
- `frontend/src/workflow/validation.ts`
  Graph validation rules such as start-node checks, missing connections, and cycle detection.
- `frontend/src/api/mockApi.ts`
  In-app mock API for `GET /automations` and `POST /simulate`.
- `frontend/src/**/*.test.ts(x)`
  Unit and integration tests for graph helpers, validation, mock API, and workflow handoff.

## What is implemented
- Drag node types from the left panel onto the canvas
- Connect nodes with edges
- Select and delete nodes or edges
- Edit Start, Task, Approval, Automated, and End nodes in the right panel
- Add multiple extra key-value fields for Start and Task steps
- Load automation actions from a local mock API
- Validate workflow structure before simulation
- Run mock simulation and show step-by-step logs in workflow order

## Workflow validation
- Exactly one Start node is required
- Start node must be first
- Non-start nodes must have an incoming connection
- Non-end nodes must have an outgoing connection
- Cycles are blocked

## Node types
- Start
- Task
- Approval
- Automated
- End

## How to run
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Test commands
- `npm run test:run`
- `npm run build`

## Design choices
- Kept the solution frontend-first as requested in the case study.
- Used a simple local mock API instead of a real backend.
- Kept state handling plain and close to the UI to avoid over-engineering.
- Split graph logic, validation logic, and mock API logic into small files so each part is easy to test.
- Kept labels and field names simple so the browser demo is easy to follow.

## Why this structure scales
- Canvas behavior, validation, and API behavior are separated instead of mixed into one large component.
- The node data model is shared between UI, validation, and mock simulation.
- New node types or validation rules can be added without rewriting the whole app.
- The mock API can later be replaced by real HTTP calls with minimal UI changes.

## Assumptions
- The prototype is for a single user working in one browser tab.
- Workflow execution is mocked and only demonstrates frontend reasoning, not real backend orchestration.
- The happy-path simulation follows the connected path starting from the Start step.

## Testing summary
- Incremental unit-test-first workflow was followed during development.
- Current verification:
  - `npm run test:run` -> passing
  - `npm run build` -> passing
  - `npm run lint` -> passing
- Coverage includes:
  - graph state helpers
  - validation rules
  - mock API behavior
  - integration handoff from validation to simulation

## What is still simple / could be improved
- Canvas nodes still use the default React Flow node renderer instead of fully custom card nodes.
- No import/export, undo/redo, or auto-layout yet.
- Final system testing is kept lightweight and documented in the repo rather than using a full browser E2E tool.

## Completed vs. next with more time
- Completed:
  - canvas step creation and linking
  - editable forms for all required step types
  - mock automations API
  - mock simulation API
  - validation and test panel
  - unit and integration coverage
- Next with more time:
  - custom node UI cards
  - import/export JSON
  - undo/redo
  - stronger end-to-end browser automation

## Tricky bug solved
- The simulation originally followed node creation order instead of the actual connected workflow path.
- This caused misleading logs when users reconnected steps or added another Start node later.
- The fix was to make simulation follow the connected path starting from the Start step and to block invalid graphs through validation first.

## Notes
- No authentication
- No database persistence
- No real backend deployment
