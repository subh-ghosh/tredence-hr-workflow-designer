# HR Workflow Designer Case Study

This project is a small workflow builder for HR teams.

## Stack
- React + TypeScript + Vite
- React Flow
- Local mock APIs
- Vitest + React Testing Library

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

## Project structure
- `frontend/src/App.tsx` - main UI shell, canvas, form panel, sandbox
- `frontend/src/workflow/graphState.ts` - node data defaults and graph helpers
- `frontend/src/workflow/validation.ts` - workflow validation rules
- `frontend/src/api/mockApi.ts` - local mock API for automations and simulation
- `frontend/src/**/*.test.ts(x)` - unit and integration tests

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

## Assumptions
- The prototype is for a single user working in one browser tab.
- Workflow execution is mocked and only demonstrates frontend reasoning, not real backend orchestration.
- The happy-path simulation follows the connected path starting from the Start step.

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

## Notes
- No authentication
- No database persistence
- No real backend deployment
