# Instructions for working in the Task Trellis MCP

An MCP (Model Context Protocol) server for Task Trellis, a task management application for AI coding agents.

## Repository Structure

**Applications:**

- `src` - main application code

## Development

This project uses [mise](https://mise.jdx.dev/) for tool version management and task running.

### Setup

```bash
# Install mise (if not already installed)
curl https://mise.run | sh

# Install tools and activate environment
mise install
```

### Quality checks

**IMPORTANT** Run the following commands to ensure code quality after every change. Fix all issues as soon as possible.

- `mise run quality` - Run linting, formatting, and type checks
- `mise run test` - Run unit tests to ensure functionality

### Commands

#### Development & Build

| Command          | Description                                         |
| ---------------- | --------------------------------------------------- |
| `mise run build` | Compile TypeScript to JavaScript                    |
| `mise run dev`   | Watch mode compilation with TypeScript (do not run) |
| `mise run start` | Start the compiled server (do not run)              |
| `mise run serve` | Build and start the server (do not run)             |

#### Testing & Quality

| Command               | Description                                           |
| --------------------- | ----------------------------------------------------- |
| `mise run test`       | Run unit tests with Jest                              |
| `mise run test:e2e`   | Run end-to-end tests with Jest                        |
| `mise run test:watch` | Run tests in watch mode (do not run)                  |
| `mise run lint`       | Run ESLint and fix issues automatically               |
| `mise run format`     | Format all TypeScript, JavaScript, and Markdown files |
| `mise run type-check` | Run TypeScript type checks without emitting files     |
| `mise run quality`    | Run all quality checks (lint, format, type-check)     |

#### Task Aliases

| Alias | Full Command          |
| ----- | --------------------- |
| `t`   | `mise run test`       |
| `l`   | `mise run lint`       |
| `f`   | `mise run format`     |
| `tc`  | `mise run type-check` |

## Architecture

### Technology Stack

- **Language**: TypeScript (5.8+)
- **Unit Testing**: Jest (30.0+)
- **Validation**: Zod (4.0+)
- **MCP SDK**: @modelcontextprotocol/sdk

---

# Clean‑Code Charter

**Purpose** Steer LLM coding agents toward the **simplest working solution**, in the spirit of Kent Beck & Robert C. Martin.

## 1  Guiding Maxims – echo before coding

| Maxim                   | Practical test                         |
| ----------------------- | -------------------------------------- |
| **KISS**                | Junior dev explains in ≤ 2 min         |
| **YAGNI**               | Abstraction < 3 uses? Inline           |
| **SRP**                 | One concept/function; ≤ 20 LOC; CC ≤ 5 |
| **DRY**                 | Duplication? Extract                   |
| **Simplicity**          | Choose the simpler path                |
| **Explicit > Implicit** | Self‑documenting, or add comments      |
| **Fail fast**           | Clear, early error handling            |

## 2  Architecture

### Files / Packages

- ≤ 400 logical LOC
- No “util” dumping grounds
- Naming:
  - `ComponentName.tsx` (PascalCase)
  - `moduleName.ts` / `moduleName.css` (camelCase)

### Modules & Dependencies

1. Each module owns **one** domain concept.
2. Export only what callers need (`index.ts`).
3. No import cycles – break with interfaces.
4. Import depth ≤ 3.
5. Prefer composition; inherit only if ≥ 2 real subclasses.
6. Keep domain pure; use **Ports & Adapters** for I/O.
7. Names: packages/modules = nouns; functions = verb + noun.

## 3  Testing

- **One** happy‑path unit test per public function (unless CC > 5).
- Integration tests only at service seams; mock internals.

## 4  Self‑Review Checklist

1. Could this be one function simpler?

## 5  Forbidden

- `any` types
- `console.log` in production
- Dead code kept around
- Shared “kitchen‑sink” modules
- Hard‑coded secrets or env values
- Direct DOM manipulation in React

---

## 🤔 When You're Unsure

1. **Stop** and ask a clear, single question.
2. Offer options (A / B / C) if helpful.
3. Wait for user guidance before proceeding.

## Troubleshooting

If you encounter issues:

- Use the context7 MCP tool for up-to-date library documentation
- Use web for research (the current year is 2025)
- If you need clarification, ask specific questions with options
