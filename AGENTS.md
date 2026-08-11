# @agentspyglass/app

## What

Angular + Tauri desktop app. Visualizes OpenCode agent sessions as an interactive node graph.

## Architecture

```
src/
  main.ts                     Angular bootstrap
  app/
    app.component.ts          Root component. Wires bridge → flow.
    app.config.ts             Angular providers.
    service/
      bridge.service.ts       WebSocket client. Parses wire events → RxJS subjects.
      brand.service.ts        Resolves provider/MCP logos.
      gsap-animation.service.ts  GSAP animation helpers.
    component/
      flow.component.ts       ngx-vflow graph. Manages nodes/edges.
      text-container.component.ts  Expandable text block.
      todo/todo.component.ts  Todo list panel.
      node/
        agent/agent.node.ts   Agent node (vflow custom node).
        mcp/mcp.node.ts       MCP server node.
        message/message.node.ts  Message node.
        info/info.node.ts     Generic info node.
    model/
      definitions.ts          UI view models: Agent, Tool, MCP, Brand, NodeData, Todo.
    pipe/namecase.pipe.ts     Title-case pipe.
    directive/animate-on-change.directive.ts  Animate on value change.
src-tauri/                    Tauri (Rust) shell.
```

## Key Dependencies

- `@agentspyglass/core` — wire event types (source-only, `file:../agentspyglass-core`)
- Angular 20, Tauri 2, ngx-vflow, GSAP, Tailwind CSS 4, hugeicons

## Rules

- Wire event types imported from `@agentspyglass/core`, never defined locally.
- `definitions.ts` holds UI view models only (Agent, Tool, MCP, Brand, NodeData, Todo).
- `bridge.service.ts` connects to `ws://127.0.0.1:51763` (the plugin's WebSocket server).
- Tauri binary name: `agentspyglass-window`.

## Dev

```bash
npm install
npm run tauri dev
```
