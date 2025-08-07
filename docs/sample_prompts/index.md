# Task Trellis Sample Prompts

This directory contains comprehensive sample prompts for using the Task Trellis MCP server to manage AI coding projects through a hierarchical task management system.

## Overview

Task Trellis organizes work in a hierarchical structure:

- **Projects**: Large-scale initiatives or products
- **Epics**: Major work streams within projects
- **Features**: Specific functionality within epics
- **Tasks**: Atomic units of work (1-2 hours each)

## Workflow-Based Prompts

Follow this sequence to break down projects from high-level specifications to implementable tasks:

### 1. Project Creation

**[Create Project Trellis](./create-project-trellis.md)**

- Transform project specifications into comprehensive project definitions
- Gather requirements and establish project context
- Create the foundation for epic and feature breakdown

### 2. Epic Breakdown

**[Create Epics Trellis](./create-epics-trellis.md)**

- Break down projects into major work streams (epics)
- Analyze project specifications to identify natural boundaries
- Configure epic dependencies and relationships

### 3. Feature Definition

**[Create Features Trellis](./create-features-trellis.md)**

- Either
  - Decompose epics into specific, implementable features
  - Or create standalone features for medium-sized work
- Define clear acceptance criteria and technical requirements
- Structure features for optimal task breakdown (6-20 tasks per feature)

### 4. Task Creation

**[Create Tasks Trellis](./create-tasks-trellis.md)**

- Either
  - Break down features into granular, actionable tasks
  - Or create standalone tasks for smaller work items
- Create atomic work units completable in 1-2 hours
- Include comprehensive implementation guidance and testing requirements

### 5. Task Implementation

**[Implement Task Trellis](./implement-task-trellis.md)**

- Claim and execute tasks using Research and Plan → Implement workflow
- Follow quality standards with comprehensive testing
- Complete tasks with proper documentation and validation
- Sample references the Claude Code subagent for research and planning (`.claude/agents/research-and-implementation-planner.md`)

## Key Features

- **Hierarchical Organization**: Clear project structure from high-level goals to implementation details
- **Dependency Management**: Proper sequencing of work with prerequisite tracking
- **Quality Standards**: Built-in testing, security, and code quality requirements
- **Parallel Development**: Structure enables independent work streams
- **Comprehensive Documentation**: Detailed acceptance criteria and implementation guidance

## Usage Tips

1. **Sequential Breakdown**: Follow the workflow order for optimal task organization
2. **Do Research**: Each prompt encourages thorough research and planning before creating projects, epics, features, or tasks or implementing them
3. **Ask Questions**: Each prompt includes structured questioning to clarify requirements
4. **Quality Focus**: All prompts emphasize testing, security, and code quality standards

These prompts are designed for AI coding agents to efficiently manage complex software projects through structured task decomposition and implementation workflows.
