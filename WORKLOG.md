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

## Decisions
- Keep the implementation frontend-first with local/mock API support as requested in the case study.

## Next Planned Steps
- Increment 3: implement node forms and unit test form behavior.
- Increment 4: add API layer and unit test service behavior.
- Increment 5: add validation/sandbox and unit test validators.
- Final phase: run integration tests, then system tests.

## How To Use This Log
- Add one entry per meaningful change.
- Include date, what changed, and why.
- Record blockers and resolution notes.
