# Plan - Simple Version

## Goal
Finish all must-have features in the timebox.

## Delivery style
- Build in small increments.
- After each increment, run unit tests for that increment.
- At the end, run integration tests.
- Final step is system testing (end-to-end flow).

## Work order
1. Setup app
2. Build canvas basics
3. Build node forms
4. Add mock APIs
5. Add validation + simulation panel
6. Add optional upgrades
7. Clean up docs and final checks

## Increment plan with tests

### Increment 1: Setup and layout
- Build: app scaffold, layout shell
- Unit tests:
	- layout renders sidebar, canvas area, right panel
	- app bootstraps without runtime error

### Increment 2: Canvas actions
- Build: add node, connect, select, delete
- Unit tests:
	- adding node updates state
	- connecting nodes creates an edge
	- deleting selected node/edge removes it

### Increment 3: Node forms
- Build: forms for all node types
- Unit tests:
	- selecting node shows correct form
	- form edits update node data
	- task title required validation works

### Increment 4: Mock APIs
- Build: GET /automations and POST /simulate
- Unit tests:
	- automation list fetch success and error handling
	- simulate call maps response to UI state

### Increment 5: Validation + sandbox
- Build: graph validation + simulation panel
- Unit tests:
	- cycle detection
	- missing connection detection
	- start rule check

### Increment 6: Final quality gates
- Integration tests:
	- create workflow -> edit -> simulate -> view logs
	- API + UI wiring across major modules
- System tests:
	- full user flow from empty canvas to valid simulation
	- invalid workflow flow showing clear errors

### Optional upgrades
- Export/Import JSON
- Node templates
- Undo/Redo
- Mini-map and zoom controls
- Visual validation on nodes
- Auto-layout
- Node version history

## Milestones

### M1 Setup (30-40 min)
- Create React + TypeScript app
- Install React Flow
- Make 3-pane layout

Done when:
- app starts and layout is visible

### M2 Canvas (50-70 min)
- Drag node from sidebar
- Drop on canvas
- Connect nodes
- Select and delete nodes/edges

Done when:
- all canvas actions work

### M3 Forms (60-80 min)
- Right panel form by node type
- Add all required fields
- Task title required
- Automated node dynamic params

Done when:
- node data updates from form correctly

### M4 APIs (35-50 min)
- Add GET /automations
- Add POST /simulate
- Load automation actions in form

Done when:
- form reads automation list
- simulate API returns data

### M5 Validation + Sandbox (45-60 min)
- Serialize workflow JSON
- Validate missing links
- Validate cycles
- Validate start rule
- Show simulation logs

Done when:
- invalid graph shows errors
- valid graph shows execution log

### M6 Final polish (35-50 min)
- Refactor small issues
- Update README
- Complete work log
- Run manual tests

Done when:
- all must-have requirements pass

## Simple test checklist
- Add all 5 node types
- Connect Start -> Task -> Approval -> Automated -> End
- Edit all node forms
- Run simulation on valid graph
- Trigger validation error on invalid graph

## Status
Implementation, optional upgrades, and final verification are complete.

## Latest updates (2026-04-25)
- Restored multi-workspace graph tabs over the canvas.
- Fixed regression in node version history seeding for create/import/sample flows.
- Synced auto-layout test expectations with the current vertical layout behavior.
- Added light/dark theme persistence using browser cookies.
- Refreshed all docs to reflect the latest shipped behavior.
