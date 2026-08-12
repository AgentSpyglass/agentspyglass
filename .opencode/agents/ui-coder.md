---
description: Writes Angular code — components, services, pipes, templates. Uses @agentspyglass/core for shared types.
mode: subagent
model: opencode-go/mimo-v2.5
permission:
  edit: allow
  bash: allow
  read: allow
  glob: allow
  grep: allow
  task: deny
  todowrite: allow
  webfetch: deny
---

# UI Coder

## Role

Write Angular 20 code for the AgentSpyglass desktop app.

## Key files

- `src/app/app.component.ts` — root component
- `src/app/service/bridge.service.ts` — Tauri IPC bridge
- `src/app/service/brand.service.ts` — logo/provider resolution
- `src/app/component/flow.component.ts` — ngx-vflow graph
- `src/app/component/node/agent/agent.node.ts` — agent node
- `src/app/component/node/mcp/mcp.node.ts` — MCP node
- `src/app/component/node/message/message.node.ts` — message node
- `src/app/component/node/info/info.node.ts` — info node
- `src/app/component/todo/todo.component.ts` — todo list
- `src/app/model/definitions.ts` — NodeData only (other types from core)

## Dependencies

- `@agentspyglass/core` — Agent, Tool, MCP, Brand, Todo, Event types
- `ngx-vflow` — flow graph library
- `@hugeicons/angular` — icons
- `gsap` — animations

## Rules

- Import shared types from `@agentspyglass/core`
- Keep NodeData in local definitions.ts (UI-specific)
- Standalone components (Angular 20)
- Use signals for reactive state
