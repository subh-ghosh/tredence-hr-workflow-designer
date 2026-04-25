# Work Log — Tredence Analytics HR Workflow Designer

Purpose: Track everything done during this case study build.

## Project
- Name: Tredence Analytics HR Workflow Designer
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
- Added a reusable submission note with repo summary, architecture highlights, tricky bug solved, and final submission links.

#### 16. Optional Features & Bug Fixes
- Fixed an async state closure bug affecting the history pushing logic, restoring `Undo/Redo` functionality to the Start Node and all node editing actions.
- Completed and polished all requested "Bonus" options from the PDF: Export/Import workflow as JSON, Node templates, Undo/Redo, Mini-map/Zoom controls, Visual node validation errors, Auto-layout, and Node version history.
- Re-ran:
	- unit tests
	- production build
	- lint
- Updated README, submission note, and test log to reflect the optional features and live demo link.

#### 17. UI Modernization & UX Pass
- Reworked the UI shell to feel more modern and guided for first-time users.
- Added a stronger visual header with simple "how to use" cues.
- Replaced plain default-looking graph nodes with custom workflow card nodes by step type.
- Improved panel wording, button placement, and canvas presentation so actions feel more discoverable.
- Tuned panel height, overflow, and spacing so the left, center, and right columns feel more balanced during real usage.
- Re-ran:
	- unit tests
	- production build
	- lint

#### 18. Light/Dark Mode Toggle
- Added a `🌙 Dark Mode` / `☀️ Light Mode` button in the hero header.
- Implemented `isDarkMode` React state in the `App` component, toggling `body.dark` class on mount/unmount.
- Propagated `isDarkMode` prop into `CanvasWorkspace` so React Flow edge colors and markers switch dynamically.
- Preserved the original light theme as the default; all dark theme rules appended as `body.dark` overrides in CSS.
- Dark theme covers: app shell background, glass panels, node cards, canvas surface, minimap, zoom controls, form inputs, toolbar buttons, import/export buttons, validation errors, and simulation logs.
- Fixed color science to be consistent across themes with matching semantic colors (green=start, blue=task, amber=approval, purple=automated, rose=end).

#### 19. Mobile Responsive Layout
- Added `isMobile` state in `CanvasWorkspace` with a resize listener (breakpoint: 768px).
- Added `activeTab` state (`steps | canvas`) default `canvas`.
- The `.panels` div receives `.mobile-panels.mobile-tab-{tab}` classes on mobile; only the active panel is visible.
- Added a fixed `<nav class="mobile-tab-bar">` at the bottom with 2 icon+label tab buttons.
- Added `addNodeAtCenter(type)` helper: places a node at a random offset near the canvas center and auto-switches to the Canvas tab — used as a touch-friendly alternative to drag-and-drop.
- Added `+` tap buttons next to each sidebar node chip on mobile.
- CSS: `@media (max-width: 768px)` block, a `≤380px` block for ultra-small screens, and dark mode overrides for the tab bar.
- Desktop layout is unaffected (tab bar hidden, node chips behave as before).
- Fixed canvas surface not rendering on mobile (CSS specificity bug: `.panel-canvas .canvas-surface { flex:1 }` was overriding height; fixed with explicit `flex: none; height: 420px` inside the media query).
- Added `addTemplateAtCenter(templateId)` helper and `+` tap buttons to Quick-start templates section on mobile.
- Replaced generic emoji tab icons with clean inline SVG icons matching the app design language (Steps = document, Canvas = node-graph).
- Changed `+` tap button color from blue to the app's warm orangish gradient (`#c2461a → #e8843a`) for consistency.
- Hidden "Drag & drop" badge and drag hint text on mobile; replaced with mobile-specific instructional tip.

### UI Polish & Functional Enhancements
- **Colourful Sidebar Chips**: Refactored the `node-chip` styles to map left-edge gradient borders and background colours directly to the canvas node types (green for start, blue for task, amber for approval, purple for automation, rose for end). Overrode dark mode backgrounds with matching high-contrast dark tones.
- **Premium Simulation Log Timeline**: Replaced the plain `<ol>` workflow test simulator result with an animated, staggered load vertical line timeline, complete with coloured SVG indicator dots and "SUCCESS" pill badges.
- **Workflow Sample Auto-loader**: Added a distinct `✦ Sample` orange gradient button to instantly inject a 7-step pre-built Tredence Onboarding workflow graph in a clean, perfect 2-row "U" shape linear path without validation edge rules.
- **Full-Graph PNG Export**: Installed `html-to-image` and appended a blue `⬇ Download` button to capture retina-scaled 2x PNG snaps of the current React Flow workflow canvas. Automatically detects active Dark/Light mode theme to shade the background.

### 2026-04-25

#### 20. Restore Multi-Workspace Graph Tabs
- Reintroduced the workflow tab strip above the canvas so multiple graph workspaces can be opened in parallel.
- Added tab switching, tab creation, and tab close behavior with per-tab graph state isolation.
- Added matching desktop/mobile/dark-theme styles for the restored workspace tab controls.

#### 21. Regression Audit + Stability Fixes
- Ran a full audit across the latest 10 commits to validate promised features against current code.
- Fixed a regression where initial node version history seed entries could be dropped during create/import/sample flows.
- Updated auto-layout test expectations to match the current vertical layout behavior.
- Re-verified with full suite and build:
	- test: 34/34 passed
	- build: pass

#### 22. Theme Preference Persistence
- Added browser-cookie persistence for light/dark mode.
- On app startup, theme reads from cookie and applies immediately.
- On toggle, cookie is updated (1-year expiry), preventing mode reset on refresh.

#### 23. Documentation Synchronization Pass
- Updated README, submission note, test records, and frontend workspace docs to reflect the latest shipped behavior.
- Synced wording for:
	- multi-workspace graph tabs
	- cookie-persisted theme mode
	- current mobile UX (Steps/Canvas tabs + node-edit modal)

#### 24. Last 10 Commit Coverage (Docs Traceability)
- Added explicit traceability for the latest 10 commits so docs can be checked against shipped behavior quickly.
- Logged covered commits:
	- `948eac4` feat(theme): persist light/dark mode via cookies
	- `44c78a3` fix(regressions): preserve version history seeds and align auto-layout tests
	- `20d150e` fix(ui): restore multiple graph tabs over canvas
	- `5138940` feat: restore validation badges, optimize PNG export for mobile/desktop, and implement vertical auto-layout
	- `e9e3847` fix(export): resolve toPng RAM crash by restricting download bounds to node viewport
	- `8c87de4` feat(ui): add premium simulation timeline, colourful chip overrides, PNG graph export, and auto-layout U-shape workflow sample
	- `27f5e85` docs: update README preview screenshots with new light/dark/mobile captures
	- `87b3d78` chore: rebrand to Tredence Analytics HR Workflow Designer across all files
	- `2ce31b8` fix(mobile): add live label, version history, and save version to node edit modal
	- `f377659` feat(mobile): node edit modal, 2-tab nav, canvas-bottom sections, bigger handles, taller canvas

## Decisions
- Keep the implementation frontend-first with local/mock API support as requested in the case study.

## Next Planned Steps
- Repository and live demo are ready for submission.

## How To Use This Log
- Add one entry per meaningful change.
- Include date, what changed, and why.
- Record blockers and resolution notes.
