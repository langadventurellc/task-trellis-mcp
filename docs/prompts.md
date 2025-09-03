# Prompt Packages

Task Trellis MCP includes pre-built prompt packages that provide structured workflows for managing AI coding projects. These prompts help break down complex projects into manageable hierarchical tasks and guide implementation processes.

## CLI Configuration

Use the `--prompt-package` argument to specify which prompt package to load:

```bash
npx task-trellis-mcp --prompt-package basic
npx task-trellis-mcp --prompt-package basic-claude
npx task-trellis-mcp --prompt-package none
```

**Available packages:**

- `basic` - Core workflow prompts (default)
- `basic-claude` - Enhanced prompts with Claude Code agent integration
- `none` - Disable prompts entirely

## Package Overview

### Basic Package

The foundational prompt package containing the core Task Trellis workflow prompts:

**Workflow Prompts:**

- **create-project** - Transform specifications into comprehensive project definitions
- **create-epics** - Break down projects into major work streams and deliverables (or creates one or more standalone epics without a parent project)
- **create-features** - Decompose epics into implementable feature sets (or creates one or more standalone features without a parent epic)
- **create-tasks** - Break down features into atomic, actionable work units (or creates one or more standalone tasks without a parent feature)
- **implement-task** - Claim and execute tasks with quality standards and completion tracking

These prompts follow the Task Trellis hierarchy (Project -> Epic -> Feature -> Task) and provide structured approaches to project decomposition and implementation.

### Basic-Claude Package

An enhanced version of the basic package optimized for Claude Code environments, featuring:

**Enhanced Workflow Prompts:**
All core prompts from the basic package, enhanced with:

- **create-project, create-epics, create-features, create-tasks** - Include verification steps using the `issue-verifier` agent
- **implement-task** - Integrates the `detailed-implementation-planner` agent for comprehensive task planning

**Specialized Agents:**

- **issue-verifier** - Validates created Trellis issues against original requirements to ensure completeness, correctness, and appropriate scope
- **detailed-implementation-planner** - Generates comprehensive file-by-file implementation plans with specific changes and implementation order

The basic-claude package provides enhanced quality assurance and detailed planning capabilities specifically designed for Claude Code's agent-based development workflows.

## Usage

When a prompt package is loaded, the prompts become available as MCP resources that can be accessed and used by compatible AI clients. Each prompt includes:

- **Structured workflows** - Step-by-step processes for task management
- **Quality gates** - Built-in verification and validation steps
- **Context preservation** - Maintains project context across workflow stages
- **Integration points** - Seamless connection between hierarchy levels

For detailed information about each prompt's functionality, see the individual prompt files in the `resources/` directory of your chosen package.
