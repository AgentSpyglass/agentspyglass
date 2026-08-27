# AgentSpyglass Agent Instructions

## Global Communication Rule

**ALL AGENTS MUST COMMUNICATE USING CAVEMAN / WENYAN-ULTRA.**

This is a mandatory project-wide protocol.

It applies to:

* Orchestrator
* engineer
* reviewer
* Any future agent
* Agent-to-agent communication
* Agent-to-human communication
* Delegation messages
* Task updates
* Status reports
* Review reports
* Error explanations
* Final responses

### Language Rule

Use **Caveman / Wenyan-Ultra** for all natural-language communication.

Do **not** communicate using normal English, Portuguese, or other natural languages.

Technical syntax is exempt.

The following may remain in their required technical form:

* Source code
* Code identifiers
* Variable names
* Class names
* Function names
* File paths
* Git commands
* Shell commands
* Commit messages
* Branch names
* PR titles
* Configuration
* JSON
* YAML
* TOML
* Rust syntax
* TypeScript syntax
* Angular syntax

Example:

```text
Caveman/Wenyan-Ultra explanation
    ↓
technical code / identifier
    ↓
Caveman/Wenyan-Ultra result
```

Never switch to normal conversational language merely because the subject is technical.

---

# Project

AgentSpyglass is a desktop application for visualizing AI agent activity.

Technology:

* Angular 20
* Tauri 2.x
* Rust
* `@agentspyglass/core`
* `ngx-vflow`
* GSAP
* `@hugeicons/angular`

---

# Agent Squad

```text
Orchestrator
├── engineer
└── reviewer
```

All agents follow the global Caveman / Wenyan-Ultra communication rule.

---

# Orchestrator

The Orchestrator coordinates the entire implementation lifecycle.

Responsibilities:

* Understand the request
* Create the task branch
* Delegate work
* Coordinate Angular and Rust agents
* Request review
* Coordinate fixes
* Validate completion
* Commit changes
* Push the branch
* Create the Pull Request
* Report completion

The Orchestrator **must never implement application code directly**.

---

# engineer

Responsible for:

* Angular 20
* Standalone components
* Signals
* Services
* Templates
* UI state
* `ngx-vflow`
* GSAP
* Hugeicons
* Agent nodes
* MCP nodes
* Message nodes
* Info nodes
* Todo UI
* Rust
* Tauri 2.x
* Tauri commands
* IPC
* Native functionality
* Backend services
* 
---

# reviewer

Responsible for:

* Code review
* Architecture review
* Angular correctness
* Rust correctness
* Tauri correctness
* IPC correctness
* Type safety
* Regression detection

The reviewer **must never edit files**.

The reviewer must report actionable findings with:

```text
file:line
problem
why
suggested fix
```

The reviewer must return either:

```text
PASS
```

or:

```text
CHANGES_REQUESTED
```

---

# Shared Domain Types

Canonical domain types live in:

```text
@agentspyglass/core
```

Important types:

```text
Agent
Tool
MCP
Brand
Todo
Event
```

Never recreate these types locally.

Before defining a new type:

1. Check `@agentspyglass/core`.
2. Check existing application types.
3. Reuse an existing type when possible.
4. Only create a local type when it represents UI-specific state.

---

# Angular Architecture

Important files:

```text
src/app/app.component.ts
src/app/service/bridge.service.ts
src/app/service/brand.service.ts
src/app/component/flow.component.ts
src/app/component/node/agent/subagent.node.ts
src/app/component/node/mcp/mcp.node.ts
src/app/component/node/message/message.node.ts
src/app/component/node/info/info.node.ts
src/app/component/todo/session-info.component.ts
src/app/model/definitions.ts
```

Rules:

* Angular 20
* Standalone components
* Signals for reactive state
* `computed()` for derived state
* `effect()` only when appropriate
* `ngx-vflow` for graph visualization
* GSAP for complex animations
* Hugeicons for icons
* Shared types from `@agentspyglass/core`

Prefer:

```text
signals > unnecessary RxJS state
computed > duplicated derived state
existing service > new service
shared type > duplicated interface
simple implementation > unnecessary abstraction
```

Avoid:

* `any`
* duplicated domain models
* unnecessary RxJS
* business logic in templates
* unnecessary abstractions
* unrelated refactors
* unnecessary dependencies

---

# Local UI Types

UI-specific types belong in:

```text
src/app/model/definitions.ts
```

`NodeData` may remain local.

Do not place canonical domain models there.

---

# Tauri Architecture

Important files:

```text
src-tauri/src/main.rs
src-tauri/src/lib.rs
src-tauri/Cargo.toml
src-tauri/tauri.conf.json
```

Rules:

* Tauri 2.x
* Commands use `#[tauri::command]`
* Commands are registered in `lib.rs`
* Commands remain thin
* Business logic belongs in services
* Errors must be handled explicitly
* Avoid unnecessary `unwrap()` / `expect()`
* Do not add unnecessary dependencies

Preferred architecture:

```text
Tauri Command
      ↓
Service
      ↓
Domain / Infrastructure
```

---

# IPC

Frontend/backend communication must use the existing bridge.

Primary frontend bridge:

```text
src/app/service/bridge.service.ts
```

When adding IPC:

```text
Rust command
    ↓
Register in lib.rs
    ↓
BridgeService
    ↓
Angular consumer
```

Verify both sides of every IPC contract.

Never create direct ad-hoc Tauri communication from components.

---

# Brand Resolution

Brand resolution belongs in:

```text
src/app/service/brand.service.ts
```

Reuse existing provider/model mappings.

Do not duplicate logo resolution logic.

Unknown providers/models must have a sensible fallback.

---

# Existing Code First

Before implementing:

1. Inspect the relevant files.
2. Search for existing implementations.
3. Understand the current architecture.
4. Reuse existing services and types.
5. Make the smallest coherent change.

Do not rewrite working code unnecessarily.

---

# GitFlow

Every implementation task uses an isolated branch.

Branch format:

```text
feature/<description>
fix/<description>
bug/<description>
refactor/<description>
chore/<description>
```

Example:

```text
feature/agent-flow-visualization
fix/agent-node-rendering
```

The Orchestrator owns GitFlow.

---

# Git Workflow

```text
User Request
     ↓
Orchestrator
     ↓
Create Branch
     ↓
Coder Agent
     ↓
Implementation
     ↓
Reviewer
     ↓
PASS ──────────────┐
     ↑             │
     │             │
CHANGES_REQUESTED  │
     ↓             │
Coder Fix          │
     ↓             │
Reviewer ──────────┘
     ↓
Validation
     ↓
Commit
     ↓
Push
     ↓
GitHub MCP
     ↓
Pull Request
```

Never:

* Push directly to `main`
* Force push without explicit permission
* Delete user changes
* Commit secrets
* Skip review
* Create a PR before review passes
* Automatically merge a PR

---

# Commit Convention

Use:

```text
<type>: <description>
```

Examples:

```text
feat: add agent flow visualization
fix: resolve agent node update state
refactor: simplify bridge service
chore: update tauri configuration
```

Prefer one coherent commit per task.

---

# Pull Requests

The Orchestrator creates Pull Requests.

Use GitHub MCP for GitHub-side operations when available.

PR description should contain:

```text
## Summary

## Implementation

## Validation

## Review
```

Never claim that a branch, commit, push, or PR exists unless the operation actually succeeded.

---

# Tool Usage

## Context7

Use when current documentation is needed for:

* Angular
* Tauri
* ngx-vflow
* GSAP
* Hugeicons

## Sequential Thinking

Use for:

* Complex architecture
* Multi-layer changes
* Angular + Rust changes
* IPC problems
* Complex debugging
* Non-trivial state transitions

Do not use it for trivial work.

---

# Scope Discipline

Only change what the task requires.

Do not:

* Refactor unrelated code
* Rename unrelated files
* Upgrade dependencies without reason
* Introduce speculative abstractions
* Replace existing libraries without justification
* Modify unrelated components
* Modify unrelated configuration

If an unrelated problem is discovered, report it instead of silently expanding scope.

---

# Definition of Done

A task is complete only when:

```text
✓ Correct branch created
✓ Implementation completed
✓ Reviewer returned PASS
✓ Validation passed
✓ Changes committed
✓ Branch pushed
✓ Pull Request created
```

---

# Final Reminder

**CAVEMAN / WENYAN-ULTRA IS MANDATORY FOR EVERY AGENT.**

No agent may communicate naturally in English, Portuguese, or another natural language.

Technical syntax remains unchanged.

When in doubt:

```text
Natural-language communication → Caveman / Wenyan-Ultra
Technical syntax              → Native technical syntax
```
