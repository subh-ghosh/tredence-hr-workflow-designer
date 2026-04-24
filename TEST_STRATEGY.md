# Test Strategy - Incremental Delivery

## Goal
Ship features in small steps with confidence.

## Rules
- Build one increment at a time.
- Write unit tests for that increment immediately.
- Move forward only when unit tests pass.
- Run integration tests after all increments are complete.
- Run system tests as final quality gate.

## Increments and tests

### Increment 1: App shell
Feature scope:
- app starts
- base layout (sidebar, canvas, panel)

Unit tests:
- shell renders all three regions
- no crash on initial render

### Increment 2: Canvas actions
Feature scope:
- add node
- connect nodes
- select node
- delete node/edge

Unit tests:
- add node updates graph state
- connect creates edge
- select updates selected id
- delete removes selected item

### Increment 3: Node forms
Feature scope:
- forms for Start, Task, Approval, Automated, End
- required validation for task title

Unit tests:
- correct form appears per node type
- field edits update node data
- required field validation blocks invalid data

### Increment 4: API layer
Feature scope:
- GET /automations
- POST /simulate

Unit tests:
- automations fetch success path
- automations fetch error path
- simulate maps response to timeline data

### Increment 5: Validation + sandbox
Feature scope:
- graph serialization
- cycle check
- missing connection check
- start rule check
- show execution log

Unit tests:
- each validator returns expected errors
- valid graph returns no validation errors
- sandbox displays returned step logs

## Integration tests (final phase)
- canvas state and form panel stay in sync
- automated step reads API action list and stores selected params
- sandbox triggers simulate and renders logs

## System tests (final phase)
- full happy path:
  - create full workflow
  - fill forms
  - validate
  - simulate
  - view logs
- full failure path:
  - create invalid workflow
  - run simulate
  - confirm clear errors shown

## Exit criteria
- All unit tests pass for each increment
- Integration tests pass
- System tests pass
- No blocking bugs in main user flow
