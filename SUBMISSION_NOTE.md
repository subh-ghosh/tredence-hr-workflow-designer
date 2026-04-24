# Submission Note

GitHub repo:
- https://github.com/subh-ghosh/tredence-hr-workflow-designer

What I built:
- A React + TypeScript + React Flow HR Workflow Designer prototype
- Supports Start, Task, Approval, Automated, and End steps
- Includes step editing forms, local mock API integration, validation, and a workflow test panel
- Built incrementally with unit tests after each major step, followed by integration and final system verification

Architecture highlights:
- Canvas and main UI in `frontend/src/App.tsx`
- Graph state helpers in `frontend/src/workflow/graphState.ts`
- Validation rules in `frontend/src/workflow/validation.ts`
- Mock API layer in `frontend/src/api/mockApi.ts`

One tricky bug I solved:
- The simulation initially used node creation order instead of the actual connected workflow path
- I changed it to follow the graph starting from the Start step, and validation now blocks invalid graphs before simulation

What I intentionally kept simple:
- In-app mock API instead of a real backend
- Default React Flow node renderer instead of a fully custom node card UI
- No persistence/auth because the case study explicitly did not require them

Optional demo/deployment path:
- The frontend can be deployed directly on Vercel by setting the project root to `frontend`, with build command `npm run build` and output directory `dist`

What I would add with more time:
- Custom node UI cards
- Import/export JSON
- Undo/redo
- Full browser E2E automation
