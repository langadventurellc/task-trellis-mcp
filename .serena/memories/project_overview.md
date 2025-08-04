# Task Trellis MCP - Project Overview

## Purpose

An MCP (Model Context Protocol) server for Task Trellis, a task management application for AI coding agents. This project implements MCP tools and resources that allow AI agents to interact with task management functionality.

## Project Status

- **Early Stage**: Project is in initial setup phase
- **No source code yet**: The `src` directory doesn't exist yet, indicating this is a fresh project
- **Configuration ready**: ESLint, Prettier, and basic project structure are configured

## Key Information

- **License**: GPL-3.0-only
- **Author**: LangAdventure LLC
- **Repository**: https://github.com/langadventurellc/task-trellis-mcp
- **Module Type**: ES Module (`"type": "module"` in package.json)

## Architecture Notes

- Planned to use **Ports & Adapters** pattern for I/O
- Will contain desktop (Electron) project with shared logic
- Mobile platform may be added in the future
- Each module should own one domain concept
- No "util" dumping grounds allowed
