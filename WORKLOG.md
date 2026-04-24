# Work Log - HR Workflow Designer

Purpose: Track everything done during this case study build.

## Project
- Name: HR Workflow Designer Case Study
- Repo: tredence-hr-workflow-designer
- Started: 2026-04-24

## Log Entries

### 2026-04-24

#### 1. Repository Setup
- Created project folder.
- Initialized Git repository.
- Set default branch to main.
- Added README with initial scope.
- Created initial commit.

#### 2. Requirements Engineering
- Created a formal requirements specification document.
- Captured scope, out-of-scope, functional and non-functional requirements.
- Defined acceptance criteria for canvas, forms, API integration, and sandbox.
- Added data model, assumptions, risk register, prioritized backlog, and definition of done.
- Locked MVP/P0 goals before implementation to prevent scope creep.

#### 3. Planning Phase
- Created a milestone-based implementation plan document.
- Broke execution into six milestones with time targets and exit criteria.
- Defined strict build order and acceptance gate mapping to FR/NFR.
- Added manual test plan, risk controls, and coding readiness checklist.

#### 4. UML and Use Case Expansion
- Added explicit use case scenarios to requirements (UC-1 to UC-4).
- Added UML diagrams document with use case, activity, sequence, and class diagrams.
- Linked UML artifacts from the requirements document for reviewer navigation.

#### 5. Documentation Simplification
- Simplified wording in README, requirements, and planning documents.
- Rewrote UML labels in simpler language for easier understanding.
- Regenerated PNG diagram files from updated Mermaid sources.

#### 6. Repository Cleanup
- Removed duplicate PNG files from the top-level diagrams folder.
- Removed temporary Mermaid render config file used only for PNG generation.
- Kept a single canonical diagram location under assets/diagrams.

#### 7. Incremental Test-Driven Plan
- Adopted incremental build approach with unit tests after every increment.
- Added explicit integration test phase after feature completion.
- Added final system test phase for full user-flow verification.
- Added dedicated test strategy document.

#### 8. Increment 1 Implementation (Frontend Folder)
- Restored repo to last stable commit after accidental root scaffold.
- Created dedicated frontend project in frontend/ using Vite + React + TypeScript.
- Installed core dependencies including React Flow.
- Added Vitest + React Testing Library setup.
- Implemented Increment 1 shell UI with three panels:
	- Node palette (left)
	- Canvas placeholder (center)
	- Details/Sandbox placeholder (right)
- Added baseline unit tests for shell rendering.
- Fixed test isolation via cleanup hook in test setup.
- Verified Increment 1 test run: 2 tests passed.

#### 9. Test Governance and Result Tracking
- Strengthened test strategy with standards (naming, isolation, determinism, scope).
- Added required test commands and increment-level run policy.
- Added evidence policy requiring recorded result entry for each increment.
- Added dedicated TEST_RESULTS.md file with structured sections for each increment, integration, and system testing.

#### 10. Increment 2 Implementation (Canvas Actions)
- Implemented React Flow canvas in frontend shell.
- Added drag-and-drop node creation from sidebar.
- Added edge connection support.
- Added selection tracking for node/edge and delete selection action.
- Added graph helper module for state operations.
- Added unit tests for add/connect/delete behavior in graph state helpers.
- Fixed React Flow test runtime dependency by mocking ResizeObserver in test setup.
- Verified gates:
	- Unit tests passed (7/7)
	- Build passed

#### 11. Increment 3 Implementation (Node Form Panel)
- Added typed node data models for start, task, approval, automated, and end nodes.
- Added node detail form panel that changes based on selected node type.
- Added editable fields for all node types (required minimum set).
- Added task title required validation and inline error message.
- Added helper functions for node update, label preview, and validation.
- Expanded unit tests for defaults, update behavior, labels, and validation.
- Verified gates:
	- Unit tests passed (11/11)
	- Build passed

#### 12. Increment 4 Implementation (Mock API Layer)
- Added a simple local mock API service for:
	- GET /automations
	- POST /simulate
- Added unit tests for automation fetch success/error and simulation success/error.
- Wired the Automated node form to load actions from the mock API.
- Replaced free-text action entry with a simple dropdown.
- Added dynamic parameter inputs based on the selected automation action.
- Updated the shell header to reflect Increment 4 status.
- Verified gates:
	- Unit tests passed (15/15)
	- Build passed

#### 13. Increment 5 Implementation (Validation and Sandbox)
- Added workflow validation helpers for:
	- start node rule
	- missing incoming and outgoing connections
	- cycle detection
- Added unit tests for validator behavior.
- Added a simple Sandbox section in the right panel.
- Added a Run Simulation action that:
	- validates the graph first
	- shows errors if invalid
	- calls the mock simulate API if valid
	- shows step-by-step execution logs
- Updated the app header to reflect Increment 5 status.
- Verified gates:
	- Unit tests passed (19/19)
	- Build passed

#### 14. Final Integration and System Test Phase
- Added a simple integration test for validate -> simulate workflow handoff.
- Re-ran the full frontend test suite and production build.
- Recorded final integration and system test evidence in TEST_RESULTS.md.
- Expanded README so the repo clearly explains:
	- architecture
	- run steps
	- design choices
	- current scope
	- future improvements

#### 15. Final Bug-Fix and Submission Pass
- Fixed direct node/edge selection behavior for easier browser testing.
- Fixed node labels so steps are visible on the canvas.
- Changed the mock simulation to follow the connected path from Start instead of raw creation order.
- Improved validation messages to show readable step names instead of internal ids.
- Added repeatable extra field inputs for Start and Task steps.
- Re-ran:
	- unit/integration tests
	- production build
	- lint
- Updated README with assumptions and a clearer completed-vs-next section for submission.
- Added a reusable submission note with repo summary, architecture highlights, tricky bug solved, and optional Vercel deployment guidance.

## Decisions
- Keep the implementation frontend-first with local/mock API support as requested in the case study.

## Next Planned Steps
- Submit the repo and share the supporting note/resume links.

## How To Use This Log
- Add one entry per meaningful change.
- Include date, what changed, and why.
- Record blockers and resolution notes.
